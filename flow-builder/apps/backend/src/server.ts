import { readFileSync } from 'fs';
import { resolve } from 'path';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { FlowValidator } from './services/FlowValidator';
import { FlowRunner } from './services/FlowRunner';
import { FlowExecutionStream } from './services/FlowExecutionStream';
import { compileDecisionForLegacyEval, hasStructuredConfig } from './services/ConfigAdapter';
import { isDecisionNodeData } from './services/NodeConfigSchema';
import { evaluate } from './lib/expression';
import templatesRouter from './routes/templates';
import importRouter from './routes/import';
import scienceTemplatesRouter from './routes/scienceTemplates';
import commentsRouter from './routes/comments';
import notesRouter from './routes/notes';
import whiteboardsRouter from './routes/whiteboards';
import mediaRouter from './routes/media';
import attachmentsRouter from './routes/attachments';
import devAuditRouter from './routes/devAudit';

if (!process.env.DATABASE_URL) {
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of envFile.split('\n')) {
      const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // Prisma still reports a clear error if DATABASE_URL is missing.
  }
}

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();



// Middleware
app.use(express.json());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
];
const allowAnyOrigin = allowedOrigins.includes('*');
const corsOrigin = (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
  if (!origin || allowAnyOrigin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(null, false);
};
app.use(cors({ origin: corsOrigin }));
app.use('/uploads', express.static('uploads'));

// Zod schemas
const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'decision', 'action', 'process', 'connector', 'end', 'document', 'database', 'inputoutput', 'annotation', 'group', 'text', 'callout', 'image', 'activity', 'stickynote', 'table', 'importtable', 'filter', 'join', 'display']),
  data: z.record(z.any()),
  position: z.object({ x: z.number(), y: z.number() }),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
});

const flowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

// Error middleware
const errorHandler = (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== ERROR DETAILS ===');
  console.error('URL:', req.method, req.url);
  console.error('Body:', JSON.stringify(req.body, null, 2));
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('=====================');
  
  if (error.name === 'ZodError') {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.errors 
    });
  }
  
  res.status(500).json({ 
    error: error.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Routes
app.use('/api/templates', templatesRouter);
app.use('/api/science-templates', scienceTemplatesRouter);
app.use('/api/import', importRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/whiteboards', whiteboardsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/dev', devAuditRouter);

// Socket.io real-time collaboration
const io = new SocketIOServer(server, {
  cors: { 
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket auth middleware (best-effort)
io.use((socket, next) => {
  try {
    const token = (socket.handshake.auth && (socket.handshake.auth as any).token) ||
      (socket.handshake.headers['authorization'] as string | undefined)?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string | undefined);
    // In this iteration we trust presence of token; later we can verify JWT and attach user claims
    (socket.data as any).token = token || null;
    next();
  } catch (e) {
    next();
  }
});

type PresenceUser = { id: string; name: string; color?: string; avatarUrl?: string };
type RoomPresence = Map<string, PresenceUser>; // socketId -> user

const presenceByNamespace: Record<string, Map<string, RoomPresence>> = {
  flow: new Map(),
  whiteboard: new Map(),
  docs: new Map(),
};

function setupNamespace(nsName: 'flow' | 'whiteboard' | 'docs') {
  const nsp = io.of(`/${nsName}`);
  nsp.on('connection', (socket) => {
    socket.on('user_join', ({ roomId, user }: { roomId: string; user: PresenceUser }) => {
      socket.join(roomId);
      if (!presenceByNamespace[nsName].has(roomId)) {
        presenceByNamespace[nsName].set(roomId, new Map());
      }
      presenceByNamespace[nsName].get(roomId)!.set(socket.id, user);
      socket.to(roomId).emit('user_join', user);
      const others = Array.from(presenceByNamespace[nsName].get(roomId)!.values()).filter(
        (u) => u.id !== user.id
      );
      socket.emit('presence', others);
    });

    socket.on('cursor', ({ roomId, cursor }) => {
      socket.to(roomId).emit('cursor', { socketId: socket.id, cursor });
    });

    socket.on('selection', ({ roomId, selection }) => {
      socket.to(roomId).emit('selection', { socketId: socket.id, selection });
    });

    socket.on('change', ({ roomId, payload }) => {
      socket.to(roomId).emit('change', payload);
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of presenceByNamespace[nsName].entries()) {
        if (room.has(socket.id)) {
          const user = room.get(socket.id)!;
          room.delete(socket.id);
          socket.to(roomId).emit('user_leave', user);
        }
      }
    });
  });
}

setupNamespace('flow');
setupNamespace('whiteboard');
setupNamespace('docs');

// Track active rooms for collaboration
const ACTIVE_ROOMS = new Set<string>();
io.of('/flow').on('connection', (socket) => {
  socket.on('user_join', ({ roomId }) => ACTIVE_ROOMS.add(roomId));
});



app.get('/api/flows', async (req, res, next) => {
  try {
    const flows = await prisma.flowMaster.findMany({
      include: {
        nodes: true,
        edges: true,
        variables: true,
      },
    });
    res.json(flows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/flows/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const flow = await prisma.flowMaster.findUnique({
      where: { id: Number(id) },
      include: {
        nodes: true,
        edges: true,
        variables: true,
      },
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    // Transform to React Flow format
    const transformedFlow = {
      ...flow,
      nodes: flow.nodes.map(node => ({
        id: node.nodeId,
        type: node.type,
        data: JSON.parse(node.data),
        position: { x: node.positionX, y: node.positionY },
      })),
      edges: flow.edges.map(edge => ({
        id: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: edge.animated,
      })),
    };
    
    res.json(transformedFlow);
  } catch (error) {
    next(error);
  }
});

app.post('/api/flows', async (req, res, next) => {
  try {
    const validatedData = flowSchema.parse(req.body);
    
    const flow = await prisma.flowMaster.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        nodes: {
          create: validatedData.nodes.map(node => ({
            nodeId: node.id,
            type: node.type,
            label: node.data.label || node.type,
            data: JSON.stringify(node.data),
            positionX: node.position.x,
            positionY: node.position.y,
          })),
        },
        edges: {
          create: validatedData.edges.map(edge => ({
            edgeId: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || null,
            targetHandle: edge.targetHandle || null,
            label: edge.label || null,
            animated: edge.animated || false,
          })),
        },
      },
      include: {
        nodes: true,
        edges: true,
      },
    });
    
    res.status(201).json(flow);
  } catch (error) {
    next(error);
  }
});

app.put('/api/flows/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('PUT /api/flows/:id - ID:', id);
    
    // Check if flow exists and create version snapshot
    const existingFlow = await prisma.flowMaster.findUnique({
      where: { id: Number(id) },
      include: { nodes: true, edges: true }
    });
    
    if (!existingFlow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    // Create version snapshot before update
    const currentSnapshot = {
      name: existingFlow.name,
      description: existingFlow.description,
      nodes: existingFlow.nodes.map(n => ({
        id: n.nodeId,
        type: n.type,
        data: JSON.parse(n.data),
        position: { x: n.positionX, y: n.positionY }
      })),
      edges: existingFlow.edges.map(e => ({
        id: e.edgeId,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        animated: e.animated
      }))
    };
    
    await prisma.flowVersionHistory.create({
      data: {
        flowId: Number(id),
        version: existingFlow.version,
        jsonBackup: JSON.stringify(currentSnapshot),
        author: 'system'
      }
    });
    
    const validatedData = flowSchema.parse(req.body);
    
    // Process nodes with config adapter
    const processedNodes = validatedData.nodes.map(node => {
      let nodeData = node.data;
      
      // Handle structured decision configs
      if (node.type === 'decision' && hasStructuredConfig(nodeData)) {
        if (isDecisionNodeData(nodeData)) {
          nodeData = compileDecisionForLegacyEval(nodeData);
        }
      }
      
      return {
        nodeId: node.id,
        type: node.type,
        label: nodeData.label || node.type,
        data: JSON.stringify(nodeData),
        positionX: node.position.x,
        positionY: node.position.y,
      };
    });
    
    // Delete existing nodes and edges
    await prisma.nodeMaster.deleteMany({ where: { flowId: Number(id) } });
    await prisma.edgeMaster.deleteMany({ where: { flowId: Number(id) } });
    
    const flow = await prisma.flowMaster.update({
      where: { id: Number(id) },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        version: existingFlow.version + 1,
        updatedAt: new Date(),
        nodes: {
          create: processedNodes,
        },
        edges: {
          create: validatedData.edges.map(edge => ({
            edgeId: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || null,
            targetHandle: edge.targetHandle || null,
            label: edge.label || null,
            animated: edge.animated || false,
          })),
        },
      },
      include: {
        nodes: true,
        edges: true,
      },
    });
    
    console.log('Flow updated successfully with version', flow.version);
    res.json(flow);
  } catch (error) {
    console.error('Error in PUT /api/flows/:id:', error);
    next(error);
  }
});

app.post('/api/flows/:id/validate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const flow = await prisma.flowMaster.findUnique({
      where: { id: Number(id) },
      include: { nodes: true, edges: true },
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    const flowData = {
      nodes: flow.nodes.map(node => ({
        id: node.nodeId,
        type: node.type,
        data: JSON.parse(node.data),
      })),
      edges: flow.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
      })),
    };
    
    const result = FlowValidator.validate(flowData);
    
    // Log warnings if present
    if (result.warnings && result.warnings.length > 0) {
      console.log('Flow validation warnings:', result.warnings);
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/flows/:id/versions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const versions = await prisma.flowVersionHistory.findMany({
      where: { flowId: Number(id) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        jsonBackup: true,
        author: true,
        createdAt: true
      }
    });
    
    // Add node/edge counts from jsonBackup
    const versionsWithCounts = versions.map(version => {
      try {
        const data = JSON.parse(version.jsonBackup);
        return {
          ...version,
          nodeCount: data.nodes?.length || 0,
          edgeCount: data.edges?.length || 0
        };
      } catch {
        return {
          ...version,
          nodeCount: 0,
          edgeCount: 0
        };
      }
    });
    
    res.json(versionsWithCounts);
  } catch (error) {
    next(error);
  }
});

app.post('/api/flows/:id/versions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { author = 'user' } = req.body;
    
    const flow = await prisma.flowMaster.findUnique({
      where: { id: Number(id) },
      include: { nodes: true, edges: true }
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    const snapshot = {
      name: flow.name,
      description: flow.description,
      nodes: flow.nodes.map(n => ({
        id: n.nodeId,
        type: n.type,
        data: JSON.parse(n.data),
        position: { x: n.positionX, y: n.positionY }
      })),
      edges: flow.edges.map(e => ({
        id: e.edgeId,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        animated: e.animated
      }))
    };
    
    const version = await prisma.flowVersionHistory.create({
      data: {
        flowId: Number(id),
        version: flow.version,
        jsonBackup: JSON.stringify(snapshot),
        author
      }
    });
    
    res.status(201).json(version);
  } catch (error) {
    next(error);
  }
});

// Catalog endpoints
app.get('/api/catalog/fields', async (req, res, next) => {
  try {
    const { flowId } = req.query;
    
    if (flowId) {
      const variables = await prisma.variableMaster.findMany({
        where: { flowId: Number(flowId) }
      });
      res.json(variables.map(v => ({
        id: v.name,
        label: v.name,
        type: v.type,
        category: 'flow'
      })));
    } else {
      // Return common fields
      const commonFields = [
        { id: 'customerEmail', label: 'Customer Email', type: 'string', category: 'customer' },
        { id: 'customerName', label: 'Customer Name', type: 'string', category: 'customer' },
        { id: 'revenue', label: 'Annual Revenue', type: 'number', category: 'financial' },
        { id: 'accountType', label: 'Account Type', type: 'string', category: 'account' },
        { id: 'registrationDate', label: 'Registration Date', type: 'date', category: 'temporal' }
      ];
      res.json(commonFields);
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/operators', async (req, res, next) => {
  try {
    const { type } = req.query;
    
    const allOperators = {
      string: [
        { id: 'equals', label: 'Equals', symbol: '===' },
        { id: 'not_equals', label: 'Not Equals', symbol: '!==' },
        { id: 'contains', label: 'Contains', symbol: 'includes' },
        { id: 'starts_with', label: 'Starts With', symbol: 'startsWith' },
        { id: 'ends_with', label: 'Ends With', symbol: 'endsWith' }
      ],
      number: [
        { id: 'equals', label: 'Equals', symbol: '===' },
        { id: 'not_equals', label: 'Not Equals', symbol: '!==' },
        { id: 'greater_than', label: 'Greater Than', symbol: '>' },
        { id: 'less_than', label: 'Less Than', symbol: '<' },
        { id: 'greater_than_or_equal', label: 'Greater Than or Equal', symbol: '>=' },
        { id: 'less_than_or_equal', label: 'Less Than or Equal', symbol: '<=' }
      ],
      boolean: [
        { id: 'equals', label: 'Equals', symbol: '===' },
        { id: 'not_equals', label: 'Not Equals', symbol: '!==' }
      ],
      date: [
        { id: 'equals', label: 'Equals', symbol: '===' },
        { id: 'not_equals', label: 'Not Equals', symbol: '!==' },
        { id: 'after', label: 'After', symbol: '>' },
        { id: 'before', label: 'Before', symbol: '<' }
      ]
    };
    
    if (type && allOperators[type as keyof typeof allOperators]) {
      res.json(allOperators[type as keyof typeof allOperators]);
    } else {
      res.json(Object.values(allOperators).flat());
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/actions', async (req, res, next) => {
  try {
    const actions = [
      { id: 'email', label: 'Email Notification', icon: '📧', description: 'Send automated emails' },
      { id: 'api', label: 'API Integration', icon: '🌐', description: 'Call external services' },
      { id: 'db', label: 'Database Operation', icon: '🗄️', description: 'CRUD operations' },
      { id: 'webhook', label: 'Webhook', icon: '⚡', description: 'HTTP callbacks' }
    ];
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

app.post('/api/flows/:id/test-decision', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nodeId, sampleData } = req.body;
    
    const flow = await prisma.flowMaster.findUnique({
      where: { id: Number(id) },
      include: { nodes: true }
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    const node = flow.nodes.find(n => n.nodeId === nodeId);
    if (!node || node.type !== 'decision') {
      return res.status(404).json({ error: 'Decision node not found' });
    }
    
    const nodeData = JSON.parse(node.data);
    const conditions = nodeData.conditions || [];
    const results = [];
    
    for (const condition of conditions) {
      try {
        const result = evaluate(condition.expression, sampleData);
        results.push({
          conditionId: condition.id,
          label: condition.label,
          expression: condition.expression,
          result,
          matched: !!result
        });
      } catch (error) {
        results.push({
          conditionId: condition.id,
          label: condition.label,
          expression: condition.expression,
          result: null,
          matched: false,
          error: error instanceof Error ? error.message : 'Evaluation error'
        });
      }
    }
    
    const matchedCondition = results.find(r => r.matched);
    
    res.json({
      nodeId,
      sampleData,
      results,
      selectedPath: matchedCondition ? matchedCondition.label : nodeData.defaultPath || 'default'
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/flows/:id/run', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inputContext = {} } = req.body;
    
    const flow = await prisma.flowMaster.findUnique({
      where: { id: Number(id) },
      include: { nodes: true, edges: true },
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    const flowData = {
      nodes: flow.nodes.map(node => ({
        id: node.nodeId,
        type: node.type,
        data: JSON.parse(node.data),
      })),
      edges: flow.edges.map(edge => ({
        id: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        label: edge.label,
      })),
    };
    
    const result = await FlowExecutionStream.runFlowWithEvents(flowData, inputContext, id);
    const savedRun = await prisma.flowRun.create({
      data: {
        flowId: Number(id),
        status: result.status || (result.success ? 'completed' : 'failed'),
        inputJson: JSON.stringify(inputContext),
        outputJson: JSON.stringify(result.outputContext || result.context || {}),
        logs: JSON.stringify(result.logs || []),
      },
    });
    res.json({ ...result, prismaRunId: savedRun.id });
  } catch (error) {
    next(error);
  }
});



app.use(errorHandler);



app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.io collaboration ready at ws://localhost:${PORT}`);
});