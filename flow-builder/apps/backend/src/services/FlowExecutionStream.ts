import { FlowRunner } from './FlowRunner';

export interface ExecutionEvent {
  type: 'node-start' | 'node-end' | 'edge-taken' | 'node-error' | 'flow-complete';
  id: string;
  runId: string;
  timestamp: number;
  data?: any;
}

export class FlowExecutionStream {
  static emit(flowId: string, event: ExecutionEvent) {
    // No-op for single user mode
  }
  
  static async runFlowWithEvents(flowData: any, inputContext: any = {}, flowId: string = 'flow') {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Find start node
      const startNode = flowData.nodes.find((n: any) => n.type === 'start');
      if (!startNode) throw new Error('No start node found');

      const hasDataNodes = flowData.nodes.some((node: any) =>
        ['importtable', 'filter', 'join', 'display'].includes(node.type)
      );
      if (hasDataNodes) {
        return this.runTableFlow(flowData, startNode, runId);
      }
      
      let currentNodeId = startNode.id;
      let context = { ...inputContext };
      const visitedNodes = new Set<string>();
      const logs: string[] = [];
      
      while (currentNodeId && !visitedNodes.has(currentNodeId)) {
        visitedNodes.add(currentNodeId);
        const currentNode = flowData.nodes.find((n: any) => n.id === currentNodeId);
        
        if (!currentNode) break;
        logs.push(`${currentNode.type}: ${currentNode.data?.label || currentNode.id}`);
        
        // Emit node start
        this.emit(flowId, {
          type: 'node-start',
          id: currentNodeId,
          runId,
          timestamp: Date.now(),
          data: { node: currentNode, context }
        });
        
        await delay(150);
        
        // Process node
        let nextNodeId: string | null = null;
        let edgeLabel = '';
        
        try {
          switch (currentNode.type) {
            case 'start':
              nextNodeId = this.getNextNode(flowData, currentNodeId);
              break;
              
            case 'decision':
              const result = this.evaluateDecision(currentNode, context, flowData);
              nextNodeId = result.nextNodeId;
              edgeLabel = result.label;
              break;
              
            case 'action':
              await this.executeAction(currentNode, context);
              logs.push(`Action type ${currentNode.data?.actionType || 'email'} finished`);
              nextNodeId = this.getNextNode(flowData, currentNodeId);
              break;
              
            case 'end':
              nextNodeId = null;
              break;
              
            default:
              nextNodeId = this.getNextNode(flowData, currentNodeId);
          }
          
          // Emit node end
          this.emit(flowId, {
            type: 'node-end',
            id: currentNodeId,
            runId,
            timestamp: Date.now(),
            data: { success: true, context }
          });
          
          await delay(300);
          
          // Emit edge taken if there's a next node
          if (nextNodeId) {
            const edge = flowData.edges.find((e: any) => 
              e.source === currentNodeId && e.target === nextNodeId
            );
            
            this.emit(flowId, {
              type: 'edge-taken',
              id: edge?.id || `${currentNodeId}-${nextNodeId}`,
              runId,
              timestamp: Date.now(),
              data: { 
                source: currentNodeId, 
                target: nextNodeId, 
                label: edgeLabel || edge?.label 
              }
            });
            
            await delay(50);
          }
          
        } catch (error) {
          this.emit(flowId, {
            type: 'node-error',
            id: currentNodeId,
            runId,
            timestamp: Date.now(),
            data: { error: error.message }
          });
          break;
        }
        
        currentNodeId = nextNodeId;
      }
      
      // Emit flow complete
      this.emit(flowId, {
        type: 'flow-complete',
        id: 'flow',
        runId,
        timestamp: Date.now(),
        data: { context, success: true }
      });
      
      logs.push('Flow completed');
      return {
        success: true,
        status: 'completed',
        logs,
        outputContext: context,
        context,
        runId,
      };
      
    } catch (error) {
      this.emit(flowId, {
        type: 'node-error',
        id: 'flow',
        runId,
        timestamp: Date.now(),
        data: { error: error.message }
      });
      
      return {
        success: false,
        status: 'failed',
        logs: [error.message],
        outputContext: {},
        error: error.message,
        runId,
      };
    }
  }
  
  private static runTableFlow(flowData: any, startNode: any, runId: string) {
    const logs: string[] = [];
    const nodeResults: Array<{ id: string; status: string; rows: any[] }> = [];
    const cache = new Map<string, any[]>();
    const steps: Array<{ node: string; kind: string; rows: any[] }> = [];

    const incoming = (nodeId: string) =>
      flowData.edges.filter((edge: any) => edge.target === nodeId);
    const findNode = (nodeId: string) =>
      flowData.nodes.find((node: any) => node.id === nodeId);

    const produce = (nodeId: string): any[] => {
      if (cache.has(nodeId)) return cache.get(nodeId) || [];
      const node = findNode(nodeId);
      if (!node) return [];
      cache.set(nodeId, []);

      let rows: any[] = [];
      if (node.type === 'importtable') {
        rows = Array.isArray(node.data?.rows) ? node.data.rows : [];
        logs.push(`Imported ${node.data?.tableName || 'table'}: ${rows.length} rows`);
      } else if (node.type === 'filter') {
        const parent = incoming(nodeId)[0];
        const sourceRows = parent ? produce(parent.source) : [];
        const column = node.data?.column;
        const value = node.data?.value;
        rows = sourceRows.filter((row) => String(row?.[column]) === String(value)).slice(0, 1);
        logs.push(`Filter kept 1 row where ${column} = ${value}`);
      } else if (node.type === 'join') {
        const parents = incoming(nodeId);
        const leftRows = parents[0] ? produce(parents[0].source) : [];
        const rightRows = parents[1] ? produce(parents[1].source) : [];
        const leftKey = node.data?.leftKey || 'id';
        const rightKey = node.data?.rightKey || 'customerId';
        rows = [];
        for (const left of leftRows) {
          for (const right of rightRows) {
            if (String(left?.[leftKey]) === String(right?.[rightKey])) {
              rows.push({ ...left, ...right });
            }
          }
        }
        logs.push(`Joined ${leftRows.length} + ${rightRows.length} rows into ${rows.length}`);
      } else if (node.type === 'display') {
        const parent = incoming(nodeId)[0];
        rows = parent ? produce(parent.source) : [];
        logs.push(`Display is showing ${rows.length} row(s)`);
      } else if (node.type === 'start') {
        logs.push(`Start: ${node.data?.label || 'Start'}`);
      }

      cache.set(nodeId, rows);
      nodeResults.push({ id: nodeId, status: 'completed', rows });
      if (node.type !== 'start') {
        steps.push({
          node: node.data?.label || node.type,
          kind: node.type,
          rows,
        });
      }
      return rows;
    };

    const queue = [startNode.id];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const nodeId = queue.shift() as string;
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      produce(nodeId);
      flowData.edges
        .filter((edge: any) => edge.source === nodeId)
        .forEach((edge: any) => queue.push(edge.target));
    }

    logs.push('Flow completed');
    const outputContext = { steps };
    return {
      success: true,
      status: 'completed',
      logs,
      outputContext,
      context: outputContext,
      nodeResults,
      runId,
    };
  }

  private static getNextNode(flowData: any, currentNodeId: string): string | null {
    const edge = flowData.edges.find((e: any) => e.source === currentNodeId);
    return edge?.target || null;
  }
  
  private static evaluateDecision(node: any, context: any, flowData: any) {
    const conditions = node.data.conditions || [];
    
    for (const condition of conditions) {
      try {
        // Simple expression evaluation (extend as needed)
        const result = this.evaluateExpression(condition.condition, context);
        if (result) {
          const edge = this.findEdgeByLabel(node.id, condition.label, flowData);
          return { nextNodeId: edge?.target, label: condition.label };
        }
      } catch (error) {
        console.error('Condition evaluation error:', error);
      }
    }
    
    // Default path
    const defaultEdge = this.findEdgeByLabel(node.id, node.data.defaultPath, flowData);
    return { nextNodeId: defaultEdge?.target, label: node.data.defaultPath };
  }
  
  private static findEdgeByLabel(sourceId: string, label: string, flowData?: any) {
    if (!flowData) return null;
    return flowData.edges.find((e: any) => e.source === sourceId && e.label === label);
  }
  
  private static evaluateExpression(expression: string, context: any): boolean {
    // Simple evaluation - extend with proper expression parser
    try {
      const func = new Function('context', `with(context) { return ${expression}; }`);
      return Boolean(func(context));
    } catch {
      return false;
    }
  }
  
  private static async executeAction(node: any, context: any) {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (node.data.actionType) {
      case 'email':
        context.emailSent = true;
        break;
      case 'api':
        context.apiCalled = true;
        break;
      case 'db':
        context.dbUpdated = true;
        break;
    }
  }
}