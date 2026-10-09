import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionLineType,
  Edge,
  MarkerType,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/animations.css';
import { Button } from '../components/ui/button';
import { NodeConfigDrawer } from '../components/NodeConfigDrawer';
import { SidebarPalette } from '../components/SidebarPalette';
import { EdgeLabelEditor } from '../components/EdgeLabelEditor';
import { OrthogonalEdge } from '../components/edges/OrthogonalEdge';
import { FlowInputModal } from '../components/FlowInputModal';
import { RightFormatPanel } from '../components/RightFormatPanel';
import { SwimlaneCanvas } from '../components/SwimlaneCanvas';
import { TemplateGallery } from '../components/TemplateGallery';
import { ExportDialog } from '../components/ExportDialog';
import { ImportDialog } from '../components/ImportDialog';
import { SearchBar } from '../components/SearchBar';
import { HistoryTimeline } from '../components/HistoryTimeline';
import { DiagramStats } from '../components/DiagramStats';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import { nodeTypes } from '../config/nodeTypes';
import { flowsAPI } from '../api/flows';
import { API_BASE } from '../api/origin';
import { toast } from 'sonner';
import { Save, CheckCircle, Zap, Plus, Settings, FileText, Palette, AlignLeft, AlignRight, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Grid3X3, ArrowLeftRight, ArrowUpDown, PenTool, Play } from 'lucide-react';
import { ContextMenu } from '../components/ContextMenu';
import { ExecutionResultsModal } from '../components/ExecutionResultsModal';
import { FlowExecutionAnimator } from '../components/FlowExecutionAnimator';
import { ExecutionControls } from '../components/ExecutionControls';

import { AnimatedEdge } from '../components/edges/AnimatedEdge';
import { ProgressiveEdge } from '../components/edges/ProgressiveEdge';
import { ElbowEdge } from '../components/edges/ElbowEdge';
import { RoundedElbowEdge } from '../components/edges/RoundedElbowEdge';
import { SmoothStepEdge } from '../components/edges/SmoothStepEdge';
import { ConnectorStyleToolbar } from '../components/ConnectorStyleToolbar';
import { exportFlowAsJSON, exportFlowAsCSV, exportFlowDiagram } from '../utils/flowExport';
import { autoLayoutNodes, applyDrawioStyling, getLayoutStyles } from '../utils/layout';
import { LayoutToolbar } from '../components/LayoutToolbar';
import { applyDrawioStyleToTemplate } from '../utils/drawioStyles';

import { LayerPanel } from '../components/LayerPanel';
import { SmartGuides } from '../components/SmartGuides';
import { alignNodes, distributeNodes, snapToGrid, getSmartGuides } from '../lib/alignment';
import { Download, Layers, Group, Ungroup, Columns, Search, History, BarChart3, Upload, BookOpen, Sparkles, Shuffle, Lightbulb, ArrowRight } from 'lucide-react';
import { createDemoFlow } from '../utils/demoFlow';
import { createRandomWordFlow } from '../utils/randomWordFlow';
import { createBrainstormingFlow } from '../utils/brainstormingFlow';
import { createSimpleLinearFlow } from '../utils/simpleLinearFlow';
import { createStandardFlowchartTemplate } from '../utils/standardFlowchartTemplate';
import { createCustomerRegistrationTemplate } from '../utils/customerRegistrationTemplate';
import { layoutFlow } from '../utils/layoutFlow';
import { ScienceTemplateGallery } from '../components/ScienceTemplateGallery';
import { insertTemplate } from '../utils/insertTemplate';
import { useCollaboration, CollabUser } from '../hooks/useCollaboration';
import { PresenceBar } from '../components/collaboration/PresenceBar';
import { LiveCursors } from '../components/collaboration/LiveCursors';







const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FlowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentFlowId, setCurrentFlowId] = useState<number | null>(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [savedFlows, setSavedFlows] = useState<Array<{ id: number; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [edgeLabelEditor, setEdgeLabelEditor] = useState<{ edge: Edge | null; position: { x: number; y: number } } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [dropTargetEdge, setDropTargetEdge] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [groups, setGroups] = useState<Array<{id: string; nodeIds: string[]}>>([]);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(false);
  const [gridSize] = useState(16);
  const [smartGuides, setSmartGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [swimlanesEnabled, setSwimlanesEnabled] = useState(false);
  const [swimlanes, setSwimlanes] = useState([{ id: 'lane-1', title: 'Lane 1', height: 200 }]);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);
  const [showDiagramStats, setShowDiagramStats] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [currentLayoutStyle, setCurrentLayoutStyle] = useState<'standard' | 'compact' | 'freeform'>('standard');
  const [isExecuting, setIsExecuting] = useState(false);
  const [cinematicMode, setCinematicMode] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);
  const [currentInputData, setCurrentInputData] = useState<any>(null);
  const [connectorStyle, setConnectorStyle] = useState<'straight' | 'elbow' | 'rounded' | 'smooth'>('smooth');
  const [showScienceTemplates, setShowScienceTemplates] = useState(false);

  const [executionSpeed, setExecutionSpeed] = useState(1);

  // Collaboration state
  const [currentUser] = useState<CollabUser>(() => ({
    id: 'user-' + Math.random().toString(36).slice(2, 11),
    name: 'Demo User',
    color: '#3b82f6',
  }));
  
  const [cursors, setCursors] = useState<any[]>([]);
  
  const { isConnected, connectedUsers, sendCursor } = useCollaboration({
    roomId: currentFlowId?.toString() || 'demo-flow',
    namespace: 'flow',
    user: currentUser,
    onCursor: (cursor) => {
      setCursors(prev => {
        const filtered = prev.filter(c => c.socketId !== cursor.socketId);
        return [...filtered, cursor];
      });
    },
  });

  // Collaboration setup
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({});






  const edgeTypes = {
    default: ProgressiveEdge,
    orthogonal: OrthogonalEdge,
    animated: AnimatedEdge,
    progressive: ProgressiveEdge,
    straight: ProgressiveEdge,
    elbow: ElbowEdge,
    rounded: RoundedElbowEdge,
    smooth: SmoothStepEdge,
  };
  
  const { fitView, getViewport } = useReactFlow();
  

  
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const handleEdgeLabelEdit = useCallback((edgeId: string, position: { x: number; y: number }) => {
    const edge = edgesRef.current.find(e => e.id === edgeId);
    if (edge) {
      setEdgeLabelEditor({ edge, position });
    }
  }, []);
  
  const handleEdgeLabelChange = useCallback((edgeId: string, label: string) => {
    setEdges((eds) => eds.map(edge => 
      edge.id === edgeId 
        ? { ...edge, label }
        : edge
    ));
  }, [setEdges]);



  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: connectorStyle,
        data: {
          onLabelEdit: handleEdgeLabelEdit,
          onLabelChange: handleEdgeLabelChange,
        },
        style: {
          strokeColor: '#424242',
          strokeWidth: 2,
          style: connectorStyle,
          arrowHead: 'triangle',
          dashed: false,
          labelBgColor: '#ffffff'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, handleEdgeLabelEdit, connectorStyle]
  );

  // Stamp label callbacks onto existing edges. Skip when nothing changed so this
  // does not schedule another render and freeze the page.
  useEffect(() => {
    setEdges((eds) => {
      if (eds.length === 0) return eds;
      return eds.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          onLabelEdit: handleEdgeLabelEdit,
          onLabelChange: handleEdgeLabelChange,
          isDropTarget: dropTargetEdge === edge.id,
        },
        style: edge.style || {
          strokeColor: '#64748b',
          strokeWidth: 2,
          style: 'bezier',
          arrowHead: 'triangle',
          dashed: false,
          labelBgColor: '#ffffff'
        }
      }));
    });
  }, [handleEdgeLabelEdit, handleEdgeLabelChange, dropTargetEdge, setEdges]);

  const handleSaveEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges((eds) => eds.map(edge => 
      edge.id === edgeId 
        ? { ...edge, label }
        : edge
    ));
    setEdgeLabelEditor(null);
  }, [setEdges]);

  const handleCloseEdgeLabelEditor = useCallback(() => {
    setEdgeLabelEditor(null);
  }, []);

  const onNodeClick = useCallback((event: any, node: Node) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedNodes(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      );
    } else {
      setSelectedNode(node);
      setSelectedNodes([node.id]);
    }
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);
  
  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setIsDrawerOpen(true);
    setShowFormatPanel(false);
  }, []);
  
  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setIsDrawerOpen(false);
    setShowFormatPanel(false);
    setContextMenu(null);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setSelectedNodes([]);
    setIsDrawerOpen(false);
    setShowFormatPanel(false);
    setShowLayerPanel(false);
    setContextMenu(null);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isConnected) {
      sendCursor({ x: event.clientX, y: event.clientY });
    }
  }, [isConnected, sendCursor]);



  const handleSaveNode = useCallback(async (nodeId: string, data: any) => {
    console.log('handleSaveNode called:', { nodeId, data, currentFlowId });
    
    // Update local state first
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, ...data } };
          console.log('Updated node:', updatedNode);
          return updatedNode;
        }
        return node;
      });
      return updatedNodes;
    });
    
    // Auto-save to database if flow exists
    if (currentFlowId) {
      try {
        // Get the updated nodes state
        const updatedNodes = nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        });
        
        console.log('Saving to database:', { flowId: currentFlowId, updatedNodes });
        
        await flowsAPI.updateFlow(currentFlowId, {
          name: flowName,
          nodes: updatedNodes,
          edges
        });
        console.log('✅ Node data saved to database successfully');
        toast.success('Node configuration saved');
      } catch (error) {
        console.error('❌ Failed to auto-save node data:', error);
        toast.error('Failed to save node data');
      }
    } else {
      console.log('⚠️ No currentFlowId - data not saved to database');
      toast.warning('Please save the flow first to persist node data');
    }
  }, [setNodes, currentFlowId, flowName, nodes, edges]);
  
  const handleUpdateNodeStyle = useCallback((nodeId: string, style: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId 
          ? {
              ...node,
              data: {
                ...(node.data as any),
                style: { ...((node.data as any)?.style || {}), ...style },
              },
            }
          : node
      )
    );
  }, [setNodes]);
  
  const handleUpdateEdgeStyle = useCallback((edgeId: string, style: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId 
          ? { ...edge, style: { ...((edge.style as any) || {}), ...style } }
          : edge
      )
    );
  }, [setEdges]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedNode(null);
  }, []);
  
  const handleCloseFormatPanel = useCallback(() => {
    setShowFormatPanel(false);
    setSelectedEdge(null);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remove all edges connected to this node
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    // Close drawer if deleted node was selected
    if (selectedNode?.id === nodeId) {
      setIsDrawerOpen(false);
      setSelectedNode(null);
    }
    
    toast.success('Element deleted');
  }, [selectedNode, setNodes, setEdges]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(node => node.id === nodeId);
    if (!nodeToDuplicate) return;
    
    const newNode: Node = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.type}-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        label: `${nodeToDuplicate.data.label} (Copy)`,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    toast.success('Element duplicated');
  }, [nodes, setNodes]);

  const handleContextMenuEdit = useCallback(() => {
    if (contextMenu) {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node) {
        setSelectedNode(node);
        setIsDrawerOpen(true);
      }
    }
    setContextMenu(null);
  }, [contextMenu, nodes]);
  


  const handleContextMenuDuplicate = useCallback(() => {
    if (contextMenu) {
      handleDuplicateNode(contextMenu.nodeId);
    }
    setContextMenu(null);
  }, [contextMenu, handleDuplicateNode]);

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu) {
      handleDeleteNode(contextMenu.nodeId);
    }
    setContextMenu(null);
  }, [contextMenu, handleDeleteNode]);

  const addNode = (type: string, position?: { x: number; y: number }) => {
    const baseData: any = { label: `New ${type}` };
    
    // Add default values for specific node types
    let nodeData: any = baseData;
    if (type === 'action') {
      nodeData = { ...baseData, actionType: 'email' };
    } else if (type === 'importtable') {
      const alreadyImported = nodes.filter((node) => node.type === 'importtable').length;
      nodeData = alreadyImported === 0
        ? {
            label: 'Customers',
            tableName: 'Customers',
            columns: ['id', 'name', 'city'],
            rows: [
              { id: 1, name: 'Anita', city: 'Pune' },
              { id: 2, name: 'Ravi', city: 'Mumbai' },
              { id: 3, name: 'Meera', city: 'Pune' },
            ],
          }
        : {
            label: 'Orders',
            tableName: 'Orders',
            columns: ['orderId', 'customerId', 'item'],
            rows: [
              { orderId: 101, customerId: 1, item: 'Notebook' },
              { orderId: 102, customerId: 2, item: 'Pen' },
              { orderId: 103, customerId: 1, item: 'Bag' },
            ],
          };
    } else if (type === 'filter') {
      nodeData = { label: 'Pick Anita', column: 'name', value: 'Anita' };
    } else if (type === 'join') {
      nodeData = { label: 'Join on customer', leftKey: 'id', rightKey: 'customerId' };
    } else if (type === 'display') {
      nodeData = { label: nodes.some((node) => node.type === 'display') ? 'Joined table' : 'Selected row' };
    } else if (type === 'decision') {
      nodeData = { ...baseData, conditions: [], defaultPath: 'default' };
    } else if (type === 'process') {
      nodeData = { ...baseData, description: 'Business process' };
    } else if (type === 'connector') {
      nodeData = { ...baseData, label: 'New connector' };
    } else if (type === 'text') {
      nodeData = { ...baseData, text: 'Double-click to edit', label: 'Text' };
    } else if (type === 'callout') {
      nodeData = { ...baseData, text: 'Add note...', label: 'Callout' };
    } else if (type === 'image') {
      nodeData = { ...baseData, label: 'Image', width: 200, height: 150 };
    } else if (type === 'activity') {
      nodeData = { ...baseData, actions: [], label: 'New Activity' };
    } else if (type === 'stickynote') {
      nodeData = { 
        ...baseData, 
        content: 'Double-click to edit...', 
        color: '#FFF7D6',
        label: 'Sticky Note'
      };
    } else if (type === 'table') {
      nodeData = {
        ...baseData,
        label: 'Table',
        rows: 3,
        cols: 3,
        cells: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']],
        columnWidths: [80, 80, 80],
        rowHeights: [30, 30, 30]
      };
    }
    
    // Add default style based on node type
    const getDefaultStyle = (nodeType: string) => {
      const baseStyle = {
        fillColor: '#ffffff',
        borderColor: '#64748b',
        borderWidth: 2,
        borderStyle: 'solid',
        textColor: '#ffffff',
        fontSize: 14,
        icon: 'circle',
        shadow: false,
        borderRadius: 8
      };
      
      switch (nodeType) {
        case 'start':
          return { ...baseStyle, fillColor: '#10b981', borderColor: '#059669', icon: 'play' };
        case 'decision':
          return { ...baseStyle, fillColor: '#f59e0b', borderColor: '#d97706', icon: 'diamond' };
        case 'action':
          return { ...baseStyle, fillColor: '#3b82f6', borderColor: '#2563eb', icon: 'zap' };
        case 'process':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#a855f7', textColor: '#1e293b', icon: 'settings', borderRadius: 16 };
        case 'connector':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#64748b', textColor: '#64748b', icon: 'arrow-right' };
        case 'end':
          return { ...baseStyle, fillColor: '#ef4444', borderColor: '#dc2626', icon: 'square' };
        case 'document':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#64748b', textColor: '#1e293b', icon: 'file-text' };
        case 'database':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#6366f1', textColor: '#1e293b', icon: 'database' };
        case 'inputoutput':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#14b8a6', textColor: '#1e293b', icon: 'arrow-right-left' };
        case 'annotation':
          return { ...baseStyle, fillColor: '#fef3c7', borderColor: '#f59e0b', textColor: '#92400e', icon: 'sticky-note' };
        case 'text':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#e2e8f0', textColor: '#1e293b', icon: 'type' };
        case 'callout':
          return { ...baseStyle, fillColor: '#fef3c7', borderColor: '#f59e0b', textColor: '#92400e', icon: 'message-square' };
        case 'image':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#e2e8f0', textColor: '#1e293b', icon: 'image' };
        case 'activity':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#a855f7', textColor: '#1e293b', icon: 'settings', borderRadius: 16 };
        case 'stickynote':
          return { ...baseStyle, fillColor: '#FFF7D6', borderColor: '#F2D98B', textColor: '#92400e', icon: 'sticky-note' };
        case 'table':
          return { ...baseStyle, fillColor: '#ffffff', borderColor: '#10b981', textColor: '#1e293b', icon: 'table' };
        default:
          return baseStyle;
      }
    };
    
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        ...nodeData,
        shapeType: type,
        style: getDefaultStyle(type)
      },
    };
    // Add onChange handler for visual nodes
    if (['text', 'callout', 'image', 'table'].includes(type)) {
      newNode.data.onChange = (updates: any) => {
        setNodes((nds) => nds.map(node => 
          node.id === newNode.id 
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        ));
      };
    }
    
    setNodes((nds) => [...nds, newNode]);
  };
  
  const handleGroup = useCallback(() => {
    if (selectedNodes.length < 2) return;
    
    const groupId = `group-${Date.now()}`;
    const groupNodes = nodes.filter(n => selectedNodes.includes(n.id));
    
    // Calculate bounding box
    const minX = Math.min(...groupNodes.map(n => n.position.x));
    const minY = Math.min(...groupNodes.map(n => n.position.y));
    const maxX = Math.max(...groupNodes.map(n => n.position.x + 150));
    const maxY = Math.max(...groupNodes.map(n => n.position.y + 80));
    
    // Create group node
    const groupNode: Node = {
      id: groupId,
      type: 'group',
      position: { x: minX - 10, y: minY - 10 },
      data: {
        label: `Group ${groups.length + 1}`,
        nodeIds: selectedNodes,
        groupId
      },
      style: {
        width: maxX - minX + 20,
        height: maxY - minY + 20,
        zIndex: -1
      }
    };
    
    // Update grouped nodes with groupId
    setNodes(nds => [
      ...nds.map(node => 
        selectedNodes.includes(node.id)
          ? { ...node, data: { ...node.data, groupId } }
          : node
      ),
      groupNode
    ]);
    
    setGroups(prev => [...prev, { id: groupId, nodeIds: selectedNodes }]);
    setSelectedNodes([]);
    toast.success('Nodes grouped');
  }, [selectedNodes, nodes, groups.length]);
  
  const handleUngroup = useCallback(() => {
    const groupToUngroup = groups.find(g => 
      g.nodeIds.some(id => selectedNodes.includes(id))
    );
    
    if (!groupToUngroup) return;
    
    // Remove group node and clear groupId from nodes
    setNodes(nds => nds
      .filter(n => n.id !== groupToUngroup.id)
      .map(node => 
        groupToUngroup.nodeIds.includes(node.id)
          ? { ...node, data: { ...node.data, groupId: undefined } }
          : node
      )
    );
    
    setGroups(prev => prev.filter(g => g.id !== groupToUngroup.id));
    setSelectedNodes([]);
    toast.success('Group ungrouped');
  }, [selectedNodes, groups]);
  
  const handleAlign = useCallback((direction: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle') => {
    if (selectedNodes.length < 2) return;
    
    const selectedNodeObjects = nodes.filter(n => selectedNodes.includes(n.id));
    const alignedNodes = alignNodes(selectedNodeObjects, direction);
    
    setNodes(nds => nds.map(node => {
      const alignedNode = alignedNodes.find(an => an.id === node.id);
      return alignedNode || node;
    }));
    
    toast.success(`Nodes aligned ${direction}`);
  }, [selectedNodes, nodes, setNodes]);
  
  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedNodes.length < 3) return;
    
    const selectedNodeObjects = nodes.filter(n => selectedNodes.includes(n.id));
    const distributedNodes = distributeNodes(selectedNodeObjects, direction);
    
    setNodes(nds => nds.map(node => {
      const distributedNode = distributedNodes.find(dn => dn.id === node.id);
      return distributedNode || node;
    }));
    
    toast.success(`Nodes distributed ${direction}ly`);
  }, [selectedNodes, nodes, setNodes]);
  
  const handleToggleGrid = useCallback(() => {
    setSnapToGridEnabled(prev => !prev);
    toast.success(`Snap to grid ${!snapToGridEnabled ? 'enabled' : 'disabled'}`);
  }, [snapToGridEnabled]);
  
  const handleToggleSwimlanes = useCallback(() => {
    setSwimlanesEnabled(prev => !prev);
    toast.success(`Swimlanes ${!swimlanesEnabled ? 'enabled' : 'disabled'}`);
  }, [swimlanesEnabled]);
  
  const handleSelectScienceTemplate = useCallback((template: any) => {
    try {
      const templateData = typeof template.json === 'string' ? JSON.parse(template.json) : template.json;
      
      insertTemplate(
        templateData,
        nodes,
        edges,
        setNodes,
        setEdges,
        fitView,
        handleEdgeLabelEdit,
        handleEdgeLabelChange
      );
      
      toast.success(`Scientific template "${template.name}" inserted successfully`);
    } catch (error) {
      console.error('Failed to insert science template:', error);
      toast.error('Failed to insert science template');
    }
  }, [nodes, edges, setNodes, setEdges, fitView, handleEdgeLabelEdit, handleEdgeLabelChange]);

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`${API_BASE}/templates/${templateId}`);
      const template = await response.json();
      
      // Handle both database templates (template.json) and static templates (template.data)
      const templateData = template.json || template.data;
      if (!templateData || !templateData.nodes) {
        throw new Error('Invalid template structure');
      }
      
      // Generate new IDs for nodes and edges with offset positioning
      const nodeIdMap = new Map();
      const offsetX = 200; // Offset to avoid overlap
      const offsetY = 100;
      
      const newNodes = templateData.nodes.map((node: any) => {
        const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        nodeIdMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY
          },
          data: {
            ...node.data,
            style: node.data.style || {
              fillColor: node.type === 'start' ? '#10b981' : 
                        node.type === 'decision' ? '#f59e0b' :
                        node.type === 'action' ? '#3b82f6' :
                        node.type === 'process' ? '#a855f7' :
                        node.type === 'end' ? '#ef4444' : '#ffffff',
              borderColor: '#64748b',
              borderWidth: 2,
              textColor: '#ffffff',
              fontSize: 14
            },
            // Add onChange handler for visual nodes
            onChange: ['text', 'callout', 'image'].includes(node.type) ? (updates: any) => {
              setNodes((nds) => nds.map(n => 
                n.id === newId ? { ...n, data: { ...n.data, ...updates } } : n
              ));
            } : undefined
          }
        };
      });
      
      const newEdges = templateData.edges.map((edge: any) => ({
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: nodeIdMap.get(edge.source),
        target: nodeIdMap.get(edge.target),
        type: edge.style?.style === 'orthogonal' ? 'orthogonal' : 'default',
        data: {
          onLabelEdit: handleEdgeLabelEdit,
          onLabelChange: handleEdgeLabelChange,
        },
        style: edge.style || {
          strokeColor: '#424242',
          strokeWidth: 1,
          style: 'orthogonal',
          arrowHead: 'triangle',
          dashed: false,
          labelBgColor: '#ffffff'
        }
      }));
      
      // Apply Draw.io styling if using standard layout
      let finalNodes = newNodes;
      let finalEdges = newEdges;
      
      if (currentLayoutStyle === 'standard') {
        const styled = applyDrawioStyleToTemplate(newNodes, newEdges);
        finalNodes = styled.nodes;
        finalEdges = styled.edges;
      }
      
      // Insert into current canvas instead of creating new flow
      setNodes(prevNodes => [...prevNodes, ...finalNodes]);
      setEdges(prevEdges => [...prevEdges, ...finalEdges]);
      
      // Auto-zoom to fit new nodes
      setTimeout(() => {
        fitView({ nodes: newNodes, duration: 800 });
      }, 100);
      
      setShowTemplateGallery(false);
      toast.success(`Template "${template.name}" inserted successfully`);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  }, [handleEdgeLabelEdit, handleEdgeLabelChange, setNodes, setEdges, fitView]);
  
  const handleSaveAsTemplate = useCallback(async (templateData: any) => {
    try {
      const response = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateData.name,
          category: templateData.category,
          description: templateData.description,
          json: {
            nodes: templateData.nodes,
            edges: templateData.edges
          }
        })
      });
      
      if (response.ok) {
        toast.success('Template saved successfully');
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  }, []);
  
  const handleImportFlow = useCallback((importedData: any) => {
    const newNodes = importedData.nodes.map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        onChange: ['text', 'callout', 'image'].includes(node.type) ? (updates: any) => {
          setNodes((nds) => nds.map(n => 
            n.id === node.id ? { ...n, data: { ...n.data, ...updates } } : n
          ));
        } : undefined
      }
    }));
    
    const newEdges = importedData.edges.map((edge: any) => ({
      ...edge,
      type: 'default',
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange,
      },
      style: edge.style || {
        strokeColor: '#64748b',
        strokeWidth: 2,
        style: 'bezier',
        arrowHead: 'triangle',
        dashed: false,
        labelBgColor: '#ffffff'
      }
    }));
    
    setNodes(newNodes);
    setEdges(newEdges);
    setShowImportDialog(false);
  }, [handleEdgeLabelEdit, handleEdgeLabelChange, setNodes, setEdges]);
  
  const handleRestoreVersion = useCallback((versionData: any) => {
    setNodes(versionData.nodes || []);
    setEdges(versionData.edges || []);
    // request restore for collab snapshots if flowId present
    if (currentFlowId) {
      fetch(`${API_BASE}/collab/flow/${currentFlowId}/restore/${versionData.id}`, { method: 'POST' });
    }
  }, [setNodes, setEdges]);
  
  const handleNodeDrag = useCallback((_: any, node: Node) => {
    if (!isDragging) {
      setIsDragging(true);
    }
    
    // Calculate smart guides
    const otherNodes = nodes.filter(n => n.id !== node.id);
    const guides = getSmartGuides(node, otherNodes);
    setSmartGuides(guides);
    
    // Apply snap to grid if enabled
    if (snapToGridEnabled) {
      const snappedPosition = snapToGrid(node.position, gridSize);
      return { ...node, position: snappedPosition };
    }
    
    return node;
  }, [nodes, snapToGridEnabled, gridSize, isDragging]);
  
  const handleNodeDragStop = useCallback(() => {
    setIsDragging(false);
    setSmartGuides({ x: [], y: [] });
  }, []);
  
  const handleNodeDragStart = useCallback((nodeType: string) => {
    setDraggedNodeType(nodeType);
  }, []);
  
  const handleNodeDragEnd = useCallback(() => {
    setDraggedNodeType(null);
    setDropTargetEdge(null);
  }, []);
  
  const handleNewFlow = async (preserveCanvas = false) => {
    try {
      const flowData = {
        name: preserveCanvas ? (flowName.trim() || 'Untitled Flow') : 'Untitled Flow',
        nodes: preserveCanvas ? nodes : [],
        edges: preserveCanvas ? edges : []
      };
      
      const flow = await flowsAPI.createFlow(flowData);
      setCurrentFlowId(flow.id);
      setFlowName(flow.name);
      
      if (!preserveCanvas) {
        setNodes([]);
        setEdges([]);
      }
      
      toast.success('New flow created');
      refreshSavedFlows();
    } catch (error) {
      console.error('Failed to create flow:', error);
      toast.error('Failed to create flow');
    }
  };

  const handleSaveFlow = async () => {
    if (!currentFlowId) {
      await handleNewFlow(true);
      return;
    }
    
    try {
      setIsSaving(true);
      const savedName = flowName.trim() || 'Untitled Flow';
      if (savedName !== flowName) setFlowName(savedName);
      await flowsAPI.updateFlow(currentFlowId, {
        name: savedName,
        nodes,
        edges
      });
      toast.success('Flow saved');
      refreshSavedFlows();
    } catch (error) {
      console.error('Failed to save flow:', error);
      toast.error('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const refreshSavedFlows = () => {
    flowsAPI.getFlows()
      .then((flows) => {
        const list = flows
          .map((flow) => ({ id: Number(flow.id), name: flow.name || 'Untitled Flow' }))
          .filter((flow) => Number.isFinite(flow.id))
          .sort((a, b) => b.id - a.id)
          .slice(0, 12);
        setSavedFlows(list);
      })
      .catch((error) => console.error('Failed to load saved flows', error));
  };

  const handleOpenSavedFlow = async (id: number) => {
    try {
      const flow = await flowsAPI.getFlow(id);
      setNodes(flow.nodes || []);
      setEdges((flow.edges || []).map((edge) => ({ ...edge, type: 'smooth' })));
      setCurrentFlowId(flow.id);
      setFlowName(flow.name || 'Untitled Flow');
      toast.success('Saved flow opened');
    } catch (error) {
      console.error('Failed to open flow', error);
      toast.error('Could not open that flow');
    }
  };

  useEffect(() => {
    refreshSavedFlows();
  }, []);

  const handleValidateFlow = async () => {
    if (!currentFlowId) {
      toast.error('Please save the flow first');
      return;
    }
    
    try {
      const result = await flowsAPI.validateFlow(currentFlowId);
      setValidationResult(result);
      if (result.valid) {
        toast.success('Flow is valid');
      } else {
        toast.error(`Validation failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Validation failed');
    }
  };

  const handleRunFlow = async () => {
    if (!currentFlowId) {
      toast.error('Please save the flow first');
      return;
    }
    
    setShowInputModal(true);
  };

  const handleRunWithInput = async (inputData: any) => {
    if (!currentFlowId) {
      toast.error('Please save the flow first');
      return;
    }

    const started = Date.now();
    try {
      setCurrentInputData(inputData);
      setIsExecuting(true);
      setActiveRequests(1);
      const executionResult: any = await flowsAPI.runFlow(currentFlowId, inputData);
      setExecutionResult({
        status: executionResult.status || (executionResult.success ? 'completed' : 'failed'),
        logs: executionResult.logs || [],
        outputContext: executionResult.outputContext || executionResult.context || {},
        executionId: executionResult.runId || `exec_${Date.now()}`,
        startTime: new Date(started).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - started,
        prismaRunId: executionResult.prismaRunId,
      });
      if (Array.isArray(executionResult.nodeResults)) {
        setNodes((current) => current.map((node) => {
          const hit = executionResult.nodeResults.find((item: any) => item.id === node.id);
          if (!hit) return node;
          return {
            ...node,
            data: {
              ...node.data,
              runColor: '#86efac',
              previewRows: hit.rows,
              runStatus: 'done',
              style: {
                ...(node.data?.style || {}),
                fillColor: '#16a34a',
                borderColor: '#166534',
              },
            },
          };
        }));
      }
      setShowExecutionModal(true);
      toast.success('Flow executed and saved in Prisma');
    } catch (error) {
      console.error('Flow execution failed:', error);
      toast.error('Flow execution failed');
    } finally {
      setIsExecuting(false);
      setActiveRequests(0);
    }
  };
  
  const handleExecutionPlay = () => {
    // Allow demo flow to run without saving
    if (!currentFlowId && nodes.length === 0) {
      toast.error('Please load a flow first');
      return;
    }
    setShowInputModal(true);
  };
  
  const handleExecutionPause = () => {
    setIsExecuting(false);
  };
  
  const handleExecutionReplay = () => {
    if (!currentFlowId) {
      toast.error('Please save the flow first');
      return;
    }
    setShowInputModal(true);
  };
  
  const handleSpeedChange = (speed: number) => {
    setExecutionSpeed(speed);
  };
  
  const handleCinematicToggle = (enabled: boolean) => {
    setCinematicMode(enabled);
  };
  
  const handleExecutionComplete = async () => {
    setIsExecuting(false);
    setActiveRequests(0);
  };
  
  const handleLoadDemo = () => {
    const { nodes: demoNodes, edges: demoEdges } = createDemoFlow();
    
    // Add edge callbacks
    const processedEdges = demoEdges.map(edge => ({
      ...edge,
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange,
        cinematicMode
      }
    }));
    
    setNodes(demoNodes);
    setEdges(processedEdges);
    
    // Auto-fit view
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
    
    toast.success('Demo flow loaded - ready for animation!');
  };
  
  const handleLoadRandomWordFlow = () => {
    const { nodes: wordNodes, edges: wordEdges } = createRandomWordFlow();
    
    // Add edge callbacks
    const processedEdges = wordEdges.map(edge => ({
      ...edge,
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange,
        cinematicMode
      }
    }));
    
    setNodes(wordNodes);
    setEdges(processedEdges);
    
    // Auto-fit view
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
    
    toast.success('Random Word Generator loaded - ready for animation!');
  };
  
  const handleLoadBrainstormingFlow = () => {
    const { nodes: brainstormNodes, edges: brainstormEdges } = createBrainstormingFlow();
    
    // Add edge callbacks
    const processedEdges = brainstormEdges.map(edge => ({
      ...edge,
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange,
        cinematicMode
      }
    }));
    
    setNodes(brainstormNodes);
    setEdges(processedEdges);
    
    // Auto-fit view
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
    
    toast.success('Brainstorming Flow loaded - ready for animation!');
  };
  
  const handleLoadSimpleFlow = () => {
    const { nodes: simpleNodes, edges: simpleEdges } = createSimpleLinearFlow();
    
    // Add edge callbacks
    const processedEdges = simpleEdges.map(edge => ({
      ...edge,
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange,
        cinematicMode
      }
    }));
    
    setNodes(simpleNodes);
    setEdges(processedEdges);
    
    // Auto-fit view
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
    
    toast.success('Simple Linear Flow loaded - ready for animation!');
  };
  
  const handleLoadStandardFlowchart = async () => {
    const { nodes: flowNodes, edges: flowEdges } = createStandardFlowchartTemplate();
    
    const processedEdges = flowEdges.map(edge => ({
      ...edge,
      type: 'straight',
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange
      }
    }));
    
    // Apply auto-layout
    const layoutedNodes = await layoutFlow(flowNodes, processedEdges, 'DOWN');
    
    setNodes(layoutedNodes);
    setEdges(processedEdges);
    
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
    
    toast.success('Content Agency Flowchart loaded with Draw.io layout!');
  };
  
  const handleLoadCustomerRegistration = async () => {
    const { nodes: regNodes, edges: regEdges } = createCustomerRegistrationTemplate();
    
    const processedEdges = regEdges.map(edge => ({
      ...edge,
      type: 'straight',
      data: {
        onLabelEdit: handleEdgeLabelEdit,
        onLabelChange: handleEdgeLabelChange
      }
    }));
    
    // Apply auto-layout
    const layoutedNodes = await layoutFlow(regNodes, processedEdges, 'DOWN');
    
    setNodes(layoutedNodes);
    setEdges(processedEdges);
    
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
    
    toast.success('Customer Registration Flow loaded with Draw.io layout!');
  };

  const handleAutoLayout = async () => {
    try {
      const direction = currentLayoutStyle === 'compact' ? 'RIGHT' : 'DOWN';
      const layoutedNodes = await layoutFlow(nodes, edges, direction);
      setNodes(layoutedNodes);
      
      setTimeout(() => {
        fitView({ duration: 800 });
      }, 100);
      
      toast.success(`Draw.io ${currentLayoutStyle} layout applied`);
    } catch (error) {
      console.error('Layout failed:', error);
      toast.error('Layout failed');
    }
  };
  
  const handleLayoutChange = (layoutStyle: 'standard' | 'compact' | 'freeform') => {
    setCurrentLayoutStyle(layoutStyle);
    toast.success(`Layout style changed to ${layoutStyle}`);
  };

  const handleConnectorStyleChange = (newStyle: 'straight' | 'elbow' | 'rounded' | 'smooth') => {
    setConnectorStyle(newStyle);
    
    // Clean and update all existing edges
    setEdges((eds) => eds
      .filter(edge => 
        edge.source && 
        edge.target && 
        nodes.some(n => n.id === edge.source) && 
        nodes.some(n => n.id === edge.target)
      )
      .map(edge => ({
        ...edge,
        type: newStyle === 'straight' ? 'progressive' : newStyle === 'smooth' ? 'smooth' : newStyle,
        sourceHandle: edge.sourceHandle === 'no' ? null : edge.sourceHandle,
        targetHandle: edge.targetHandle === 'no' ? null : edge.targetHandle
      }))
    );
    
    toast.success(`All connectors changed to ${newStyle}`);
  };

  const handleFitView = () => {
    fitView();
  };

  const handleCloseExecutionModal = () => {
    setShowExecutionModal(false);
    setExecutionResult(null);
  };

  const handleRunAgain = () => {
    setShowExecutionModal(false);
    handleRunFlow();
  };

  const handleExport = (format: string) => {
    toast.success(`Exported execution result as ${format.toUpperCase()}`);
  };

  const handleFlowExport = (format: string) => {
    if (!flowName || nodes.length === 0) {
      toast.error('Please create and save a flow first');
      return;
    }

    switch (format) {
      case 'json':
        exportFlowAsJSON(flowName, nodes, edges);
        break;
      case 'csv':
        exportFlowAsCSV(flowName, nodes, edges);
        break;
      case 'diagram':
        exportFlowDiagram(flowName, nodes, edges);
        break;
    }
    toast.success(`Flow exported as ${format.toUpperCase()}`);
  };

  // Migrate existing nodes to have default styles
  useEffect(() => {
    setNodes((nds) => nds.map(node => {
      if (!node.data.style) {
        const getDefaultStyle = (nodeType: string) => {
          const baseStyle = {
            fillColor: '#ffffff',
            borderColor: '#64748b',
            borderWidth: 2,
            borderStyle: 'solid',
            textColor: '#ffffff',
            fontSize: 14,
            icon: 'circle',
            shadow: false,
            borderRadius: 8
          };
          
          switch (nodeType) {
            case 'start':
              return { ...baseStyle, fillColor: '#10b981', borderColor: '#059669', icon: 'play' };
            case 'decision':
              return { ...baseStyle, fillColor: '#f59e0b', borderColor: '#d97706', icon: 'diamond' };
            case 'action':
              return { ...baseStyle, fillColor: '#3b82f6', borderColor: '#2563eb', icon: 'zap' };
            case 'process':
              return { ...baseStyle, fillColor: '#ffffff', borderColor: '#a855f7', textColor: '#1e293b', icon: 'settings', borderRadius: 16 };
            case 'connector':
              return { ...baseStyle, fillColor: '#ffffff', borderColor: '#64748b', textColor: '#64748b', icon: 'arrow-right' };
            case 'end':
              return { ...baseStyle, fillColor: '#ef4444', borderColor: '#dc2626', icon: 'square' };
            case 'document':
              return { ...baseStyle, fillColor: '#ffffff', borderColor: '#64748b', textColor: '#1e293b', icon: 'file-text' };
            case 'database':
              return { ...baseStyle, fillColor: '#ffffff', borderColor: '#6366f1', textColor: '#1e293b', icon: 'database' };
            case 'inputoutput':
              return { ...baseStyle, fillColor: '#ffffff', borderColor: '#14b8a6', textColor: '#1e293b', icon: 'arrow-right-left' };
            case 'annotation':
              return { ...baseStyle, fillColor: '#fef3c7', borderColor: '#f59e0b', textColor: '#92400e', icon: 'sticky-note' };
            default:
              return baseStyle;
          }
        };
        
        return {
          ...node,
          data: {
            ...node.data,
            style: getDefaultStyle(node.type || 'default')
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field or panels are open
      const activeElement = document.activeElement as HTMLElement | null;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable === true ||
        activeElement.getAttribute('role') === 'textbox' ||
        activeElement.getAttribute('type') === 'color'
      );
      
      // Don't trigger shortcuts when panels are open
      if (isTyping || showFormatPanel || isDrawerOpen) return;
      
      // Delete selected node/edge
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode) {
          event.preventDefault();
          handleDeleteNode(selectedNode.id);
        }
      }
      
      // Open format panel with F key
      if (event.key === 'f' || event.key === 'F') {
        if (selectedNode || selectedEdge) {
          event.preventDefault();
          setShowFormatPanel(true);
          setIsDrawerOpen(false);
        }
      }
      
      // Open config drawer with Enter key
      if (event.key === 'Enter') {
        if (selectedNode) {
          event.preventDefault();
          setIsDrawerOpen(true);
          setShowFormatPanel(false);
        }
      }
      
      // Escape to close panels
      if (event.key === 'Escape') {
        setShowFormatPanel(false);
        setIsDrawerOpen(false);
        setShowLayerPanel(false);
        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedNodes([]);
      }
      
      // Ctrl/Cmd+A to select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        setSelectedNodes(nodes.map(n => n.id));
      }
      
      // Ctrl/Cmd+G to group
      if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault();
        if (selectedNodes.length > 1) {
          handleGroup();
        }
      }
      
      // Ctrl/Cmd+Shift+G to ungroup
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'G') {
        event.preventDefault();
        handleUngroup();
      }
      
      // Ctrl/Cmd+F to search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowSearchBar(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, handleDeleteNode, isDrawerOpen, showFormatPanel]);
  


  return (
    <div className="flex h-screen bg-slate-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex h-full items-center justify-between gap-4 px-6 overflow-visible">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Flow Builder</h1>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <input
                  aria-label="Flow name"
                  value={flowName}
                  onChange={(event) => setFlowName(event.target.value)}
                  onBlur={() => {
                    const nextName = flowName.trim() || 'Untitled Flow';
                    if (nextName !== flowName) setFlowName(nextName);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                  placeholder="Flow name"
                  className="h-8 w-44 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              
              {(selectedNode || selectedEdge) && (
                <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 font-medium">
                    {selectedNode 
                      ? `${selectedNode.type?.charAt(0).toUpperCase()}${selectedNode.type?.slice(1)} selected`
                      : 'Edge selected'
                    }
                  </span>
                  <span className="text-blue-600 text-xs opacity-75">
                    {selectedNode ? '• Double-click to config' : '• Click Format to style'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            <div className="relative group" onMouseEnter={refreshSavedFlows}>
              <Button onClick={() => handleNewFlow(false)} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Flow
              </Button>
              <div className="absolute left-0 top-full z-[100] w-64 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                  {savedFlows.length > 0 && (
                    <>
                      <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Saved flows</div>
                      {savedFlows.map((flow) => (
                        <button
                          key={flow.id}
                          onClick={() => handleOpenSavedFlow(flow.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                          <span className="truncate">{flow.name}</span>
                        </button>
                      ))}
                      <div className="my-1 border-t border-slate-100" />
                    </>
                  )}
                  <button
                    onClick={() => handleNewFlow(false)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Blank Flow
                  </button>
                  <button
                    onClick={() => setShowTemplateGallery(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    From Template
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Demo Flow (Animation)
                  </button>
                  <button
                    onClick={handleLoadRandomWordFlow}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    Random Word Generator
                  </button>
                  <button
                    onClick={handleLoadBrainstormingFlow}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Brainstorming Session
                  </button>
                  <button
                    onClick={handleLoadSimpleFlow}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Simple Linear Flow
                  </button>
                  <button
                    onClick={handleLoadStandardFlowchart}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Content Agency Flowchart
                  </button>
                  <button
                    onClick={handleLoadCustomerRegistration}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customer Registration
                  </button>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSaveFlow} 
              variant="outline" 
              size="sm" 
              className="gap-2"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleValidateFlow} variant="outline" size="sm" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Validate
            </Button>

            
            {selectedNode && (
              <Button 
                onClick={() => {
                  setIsDrawerOpen(true);
                  setShowFormatPanel(false);
                }}
                variant={isDrawerOpen ? "default" : "outline"} 
                size="sm" 
                className={`gap-2 ${isDrawerOpen ? 'bg-green-600 text-white' : ''}`}
                title="Configure selected node (Enter)"
              >
                <Settings className="w-4 h-4" />
                Config
              </Button>
            )}
            
            <Button 
              onClick={() => {
                setShowFormatPanel(true);
                setIsDrawerOpen(false);
              }}
              variant={showFormatPanel ? "default" : "outline"} 
              size="sm" 
              className={`gap-2 ${showFormatPanel ? 'bg-blue-600 text-white' : ''}`}
              disabled={!selectedNode && !selectedEdge}
              title={selectedNode || selectedEdge ? 'Format selected element (F)' : 'Select an element to format'}
            >
              <Palette className="w-4 h-4" />
              Format
              {(selectedNode || selectedEdge) && (
                <span className="ml-1 text-xs opacity-75">(F)</span>
              )}
            </Button>
            

            
            <Button 
              onClick={() => setShowLayerPanel(true)}
              variant="outline" 
              size="sm" 
              className="gap-2"
              title="Layers & Groups"
            >
              <Layers className="w-4 h-4" />
              Layers
            </Button>
            
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                title="Template Library"
              >
                <BookOpen className="w-4 h-4" />
                Templates
              </Button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                <div className="py-2">
                  <button
                    onClick={() => setShowTemplateGallery(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Flow Templates
                  </button>
                  <button
                    onClick={() => setShowScienceTemplates(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Science Templates
                  </button>
                </div>
              </div>
            </div>
            
            {selectedNodes.length > 1 && (
              <>
                <div className="h-6 w-px bg-slate-300" />
                <Button 
                  onClick={() => handleAlign('left')}
                  variant="outline" 
                  size="sm" 
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => handleAlign('center')}
                  variant="outline" 
                  size="sm" 
                  title="Align Center"
                >
                  <AlignHorizontalJustifyCenter className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => handleAlign('right')}
                  variant="outline" 
                  size="sm" 
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => handleAlign('top')}
                  variant="outline" 
                  size="sm" 
                  title="Align Top"
                >
                  <AlignLeft className="w-4 h-4 rotate-90" />
                </Button>
                <Button 
                  onClick={() => handleAlign('middle')}
                  variant="outline" 
                  size="sm" 
                  title="Align Middle"
                >
                  <AlignVerticalJustifyCenter className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => handleAlign('bottom')}
                  variant="outline" 
                  size="sm" 
                  title="Align Bottom"
                >
                  <AlignRight className="w-4 h-4 rotate-90" />
                </Button>
                
                {selectedNodes.length > 2 && (
                  <>
                    <div className="h-6 w-px bg-slate-300" />
                    <Button 
                      onClick={() => handleDistribute('horizontal')}
                      variant="outline" 
                      size="sm" 
                      title="Distribute Horizontally"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDistribute('vertical')}
                      variant="outline" 
                      size="sm" 
                      title="Distribute Vertically"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            )}
            
            <div className="h-6 w-px bg-slate-300" />
            
            <ConnectorStyleToolbar
              currentStyle={connectorStyle}
              onStyleChange={handleConnectorStyleChange}
            />
            
            <LayoutToolbar
              currentLayout={currentLayoutStyle}
              onLayoutChange={handleLayoutChange}
              onAutoLayout={handleAutoLayout}
            />
            
            <Button 
              onClick={handleToggleGrid}
              variant={snapToGridEnabled ? "default" : "outline"} 
              size="sm" 
              title={`Snap to Grid (${gridSize}px)`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={handleToggleSwimlanes}
              variant={swimlanesEnabled ? "default" : "outline"} 
              size="sm" 
              title="Toggle Swimlanes"
            >
              <Columns className="w-4 h-4" />
            </Button>
            
            <div className="h-6 w-px bg-slate-300" />
            
            <Button 
              onClick={() => setShowSearchBar(true)}
              variant="outline" 
              size="sm" 
              title="Search (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={() => setShowDiagramStats(true)}
              variant="outline" 
              size="sm" 
              title="Diagram Stats"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={() => setShowHistoryTimeline(true)}
              variant="outline" 
              size="sm" 
              title="Version History"
              disabled={!currentFlowId}
            >
              <History className="w-4 h-4" />
            </Button>
            
            {selectedNodes.length > 1 && (
              <Button 
                onClick={handleGroup}
                variant="outline" 
                size="sm" 
                className="gap-2"
                title={`Group ${selectedNodes.length} selected nodes`}
              >
                <Group className="w-4 h-4" />
                Group ({selectedNodes.length})
              </Button>
            )}
            
            {groups.length > 0 && (
              <Button 
                onClick={handleUngroup}
                variant="outline" 
                size="sm" 
                className="gap-2"
                title="Ungroup selected group"
              >
                <Ungroup className="w-4 h-4" />
                Ungroup
              </Button>
            )}
            
            <div className="relative group">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                <div className="py-2">
                  <button
                    onClick={() => setShowExportDialog(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Visual Export (PNG/SVG)
                  </button>
                  <button
                    onClick={() => handleFlowExport('json')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    📄 Flow Definition (JSON)
                  </button>
                  <button
                    onClick={() => handleFlowExport('csv')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    📊 Flow Data (CSV)
                  </button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowImportDialog(true)}
              variant="outline" 
              size="sm" 
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            
            <div className="h-6 w-px bg-slate-300" />
            
            <Button 
              onClick={() => window.location.href = '/whiteboards'}
              variant="outline" 
              size="sm" 
              className="gap-2"
              title="Switch to Whiteboard"
            >
              <PenTool className="w-4 h-4" />
              Whiteboard
            </Button>
            
            <Button
              onClick={handleExecutionPlay}
              size="sm"
              className="gap-2 bg-green-600 text-white hover:bg-green-700"
              title="Play this flow"
            >
              <Play className="w-4 h-4" />
              Play
            </Button>

            <ExecutionControls
              isExecuting={isExecuting}
              onPlay={handleExecutionPlay}
              onPause={handleExecutionPause}
              onReplay={handleExecutionReplay}
              onSpeedChange={handleSpeedChange}
              onCinematicToggle={handleCinematicToggle}
              activeRequests={activeRequests}
              compact={true}
            />
            


          </div>
        </div>
      </div>

      {/* Sidebar */}
      <SidebarPalette 
        onAddNode={addNode} 
        onAutoLayout={handleAutoLayout}
        onFitView={handleFitView}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragEnd={handleNodeDragEnd}
      />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col mt-16 ml-12">
        <div 
          className="flex-1 bg-slate-50 relative"
          onDragOver={(e) => {
            if (draggedNodeType) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedNodeType) {
              const rect = e.currentTarget.getBoundingClientRect();
              const position = {
                x: e.clientX - rect.left - 100,
                y: e.clientY - rect.top - 50
              };
              addNode(draggedNodeType, position);
              setDraggedNodeType(null);
            }
          }}
        >

          {swimlanesEnabled && (
            <SwimlaneCanvas
              swimlanes={swimlanes}
              onUpdateSwimlanes={setSwimlanes}
              enabled={swimlanesEnabled}
              onToggle={handleToggleSwimlanes}
            />
          )}
          

            <ReactFlow
              nodes={nodes.map(node => ({
                ...node,
                selected: selectedNodes.includes(node.id)
              }))}
              edges={edges.map(edge => ({
                ...edge,
                type: 'smooth',
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: '#475569',
                },
                style: {
                  stroke: '#475569',
                  strokeWidth: 2,
                },
                data: {
                  ...edge.data,
                  cinematicMode
                }
              }))}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ stroke: '#475569', strokeWidth: 2 }}
              connectionRadius={28}
              defaultEdgeOptions={{
                type: 'smooth',
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: '#475569',
                },
              }}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeContextMenu={onNodeContextMenu}
              onNodeDrag={handleNodeDrag}
              onNodeDragStop={handleNodeDragStop}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onMouseMove={handleMouseMove}

              onSelectionChange={(params) => {
                if (params.nodes) {
                  setSelectedNodes(params.nodes.map(n => n.id));
                  if (params.nodes.length === 1) {
                    const only = params.nodes[0];
                    setSelectedNode(only ? (only as Node) : null);
                  } else {
                    setSelectedNode(null);
                  }
                }
              }}
              multiSelectionKeyCode="Shift"
              selectionKeyCode="Shift"
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className={`bg-slate-50 ${cinematicMode ? 'cinematic-mode' : ''}`}
              style={{
                background: cinematicMode 
                  ? 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)'
                  : undefined
              }}
            >
            <FlowExecutionAnimator
              flowId={currentFlowId?.toString() || 'flow'}
              isExecuting={isExecuting}
              inputData={currentInputData}
              cinematicMode={cinematicMode}
              onExecutionComplete={handleExecutionComplete}
            />
            <Controls className="bg-white border border-slate-200 shadow-lg" />
            <MiniMap 
              className="bg-white border border-slate-200 shadow-lg" 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return '#10b981';
                  case 'decision': return '#f59e0b';
                  case 'action': return '#3b82f6';
                  case 'end': return '#ef4444';
                  case 'process': return '#a855f7';
                  case 'connector': return '#64748b';
                  case 'document': return '#64748b';
                  case 'database': return '#6366f1';
                  case 'inputoutput': return '#14b8a6';
                  case 'annotation': return '#f59e0b';
                  default: return '#6b7280';
                }
              }}
            />
            <Background 
              color="#e2e8f0" 
              gap={snapToGridEnabled ? gridSize : 20} 
              size={snapToGridEnabled ? 2 : 1}
              variant={(snapToGridEnabled ? 'dots' : 'lines') as any}
            />
            {isDragging && (
              <SmartGuides guides={smartGuides} viewport={getViewport()} />
            )}

            </ReactFlow>
        </div>
      </div>

      {/* Live cursors */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        {Object.entries(remoteCursors).map(([id, c]) => (
          <div key={id} className="absolute" style={{ left: c.x + 6, top: c.y + 6 }}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/90 border text-slate-700">
                {c.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <NodeConfigDrawer
        selectedNode={selectedNode}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        onDuplicate={handleDuplicateNode}
      />



      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleContextMenuEdit}
          onDuplicate={handleContextMenuDuplicate}
          onDelete={handleContextMenuDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ExecutionResultsModal
        isOpen={showExecutionModal}
        onClose={handleCloseExecutionModal}
        result={executionResult}
        flowName={flowName}
        onRunAgain={handleRunAgain}
        onExport={handleExport}
      />

      <EdgeLabelEditor
        edge={edgeLabelEditor?.edge || null}
        isOpen={!!edgeLabelEditor}
        onClose={handleCloseEdgeLabelEditor}
        onSave={handleSaveEdgeLabel}
        position={edgeLabelEditor?.position}
      />

      <FlowInputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        onRun={handleRunWithInput}
        flowName={flowName}
      />
      
      <RightFormatPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        isOpen={showFormatPanel}
        onClose={handleCloseFormatPanel}
        onUpdateNode={handleUpdateNodeStyle}
        onUpdateEdge={handleUpdateEdgeStyle}
      />
      
      <LayerPanel
        isOpen={showLayerPanel}
        onClose={() => setShowLayerPanel(false)}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
      />
      
      <TemplateGallery
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={handleSelectTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
        selectedNodes={nodes.filter(n => selectedNodes.includes(n.id))}
        selectedEdges={edges.filter(e => selectedNodes.includes(e.source) && selectedNodes.includes(e.target))}
      />
      
      <ScienceTemplateGallery
        isOpen={showScienceTemplates}
        onClose={() => setShowScienceTemplates(false)}
        onSelectTemplate={handleSelectScienceTemplate}
      />
      
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        flowId={currentFlowId}
        flowName={flowName}
      />
      
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportFlow}
      />
      
      <SearchBar
        isOpen={showSearchBar}
        onClose={() => setShowSearchBar(false)}
        nodes={nodes}
        edges={edges}
        onSelectItem={(id, type) => {
          if (type === 'node') {
            const node = nodes.find(n => n.id === id);
            if (node) {
              setSelectedNode(node);
              setSelectedNodes([id]);
            }
          } else {
            const edge = edges.find(e => e.id === id);
            if (edge) {
              setSelectedEdge(edge);
            }
          }
        }}
        onUpdateNode={handleUpdateNodeStyle}
        onUpdateEdge={handleUpdateEdgeStyle}
      />
      
      <HistoryTimeline
        isOpen={showHistoryTimeline}
        onClose={() => setShowHistoryTimeline(false)}
        flowId={currentFlowId}
        onRestore={handleRestoreVersion}
      />
      
      <DiagramStats
        isOpen={showDiagramStats}
        onClose={() => setShowDiagramStats(false)}
        nodes={nodes}
        edges={edges}
        onSelectNode={(nodeId) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
            setSelectedNodes([nodeId]);
          }
        }}
        onSelectEdge={(edgeId) => {
          const edge = edges.find(e => e.id === edgeId);
          if (edge) {
            setSelectedEdge(edge);
          }
        }}
        validationResult={validationResult}
      />
      
      {/* Collaboration Components */}
      <div className="absolute top-16 right-6 z-30">
        <PresenceBar
          users={connectedUsers}
          isConnected={isConnected}
          currentUser={currentUser}
        />
      </div>
      
      <LiveCursors cursors={cursors} />
      


    </div>
  );
}

export default function FlowBuilder() {
  return (
    <AccessibilityProvider>
      <ReactFlowProvider>
        <FlowBuilderContent />
      </ReactFlowProvider>
    </AccessibilityProvider>
  );
}