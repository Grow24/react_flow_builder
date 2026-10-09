import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ORIGIN } from '../api/origin';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as Y from 'yjs';
import { createYjsProvider } from '../lib/collabProvider';
import io from 'socket.io-client';

// Simple node components
const StartNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 bg-green-100 border-2 border-green-300 rounded">
    ▶️ {data.label}
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 bg-blue-100 border-2 border-blue-300 rounded">
    ⚡ {data.label}
  </div>
);

const DecisionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-300 rounded">
    ❓ {data.label}
  </div>
);

const EndNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 bg-red-100 border-2 border-red-300 rounded">
    🏁 {data.label}
  </div>
);

const nodeTypes = {
  start: StartNode,
  action: ActionNode,
  decision: DecisionNode,
  end: EndNode,
};

// Demo data
const salesforceDemo = {
  nodes: [
    { id: '1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Lead Entry' } },
    { id: '2', type: 'decision', position: { x: 100, y: 200 }, data: { label: 'Revenue > $1M?' } },
    { id: '3', type: 'action', position: { x: 300, y: 150 }, data: { label: 'Enterprise Team' } },
    { id: '4', type: 'action', position: { x: 300, y: 250 }, data: { label: 'SMB Team' } },
    { id: '5', type: 'end', position: { x: 500, y: 200 }, data: { label: 'Complete' } },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3', label: 'Yes' },
    { id: 'e2-4', source: '2', target: '4', label: 'No' },
    { id: 'e3-5', source: '3', target: '5' },
    { id: 'e4-5', source: '4', target: '5' },
  ],
};

const meceDemo = {
  nodes: [
    { id: '1', type: 'start', position: { x: 50, y: 50 }, data: { label: 'Customer Segmentation' } },
    { id: '2', type: 'decision', position: { x: 50, y: 150 }, data: { label: 'Company Size' } },
    { id: '3', type: 'action', position: { x: 250, y: 100 }, data: { label: 'Small (<50)' } },
    { id: '4', type: 'action', position: { x: 250, y: 150 }, data: { label: 'Medium (50-500)' } },
    { id: '5', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Large (>500)' } },
    { id: '6', type: 'end', position: { x: 450, y: 150 }, data: { label: 'Processed' } },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e2-5', source: '2', target: '5' },
    { id: 'e3-6', source: '3', target: '6' },
    { id: 'e4-6', source: '4', target: '6' },
    { id: 'e5-6', source: '5', target: '6' },
  ],
};

export default function WorkingFlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const roomId = 'demo-working-flow';

  // Setup Yjs shared state for nodes/edges
  useEffect(() => {
    const currentUser = { id: 'guest', name: 'Guest', color: '#3b82f6' };
    const { ydoc, provider, awareness, destroy } = createYjsProvider(roomId, currentUser);

    const yNodes = ydoc.getArray<any>('nodes');
    const yEdges = ydoc.getArray<any>('edges');

    const applyFromY = () => {
      try {
        setNodes(yNodes.toArray());
        setEdges(yEdges.toArray());
      } catch {}
    };

    // Initialize from Y if present
    applyFromY();

    const nodesObserver = () => applyFromY();
    const edgesObserver = () => applyFromY();
    yNodes.observe(nodesObserver);
    yEdges.observe(edgesObserver);

    // Mirror local changes into Y (simple whole-replace for demo)
    const unsubNodes = onNodesChange((changes) => {
      // Defer to ReactFlow handler then write full array to Y
      setTimeout(() => {
        ydoc.transact(() => {
          yNodes.delete(0, yNodes.length);
          yNodes.push([...(nodes as any)]);
        });
      }, 0);
    });

    const unsubEdges = onEdgesChange((changes) => {
      setTimeout(() => {
        ydoc.transact(() => {
          yEdges.delete(0, yEdges.length);
          yEdges.push([...(edges as any)]);
        });
      }, 0);
    });

    // Socket.io presence minimal join
    const socket = io(`${API_ORIGIN}/flow`);
    socket.emit('user_join', { roomId, user: currentUser });

    return () => {
      yNodes.unobserve(nodesObserver);
      yEdges.unobserve(edgesObserver);
      unsubNodes();
      unsubEdges();
      socket.disconnect();
      destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setIsDrawerOpen(true);
  }, []);

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: `New ${type}` },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveNode = (nodeId: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
      )
    );
    setIsDrawerOpen(false);
  };

  const saveFlow = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: flowName, nodes, edges }),
      });
      if (response.ok) {
        alert('Flow saved successfully!');
      } else {
        alert('Failed to save flow');
      }
    } catch (error) {
      alert('Error saving flow');
    }
  };

  const loadFlow = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/flows');
      const flows = await response.json();
      if (flows.length > 0) {
        const flow = flows[0];
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setFlowName(flow.name);
        alert(`Loaded: ${flow.name}`);
      } else {
        alert('No flows found');
      }
    } catch (error) {
      alert('Error loading flow');
    }
  };

  const newFlow = () => {
    setNodes([]);
    setEdges([]);
    setFlowName('Untitled Flow');
  };

  const loadSalesforceDemo = () => {
    setNodes(salesforceDemo.nodes);
    setEdges(salesforceDemo.edges);
    setFlowName('Salesforce Lead Flow');
  };

  const loadMeceDemo = () => {
    setNodes(meceDemo.nodes);
    setEdges(meceDemo.edges);
    setFlowName('MECE Customer Segmentation');
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 p-4 bg-gray-100 border-r">
          <h3 className="font-bold mb-4">Node Palette</h3>
          
          <button
            onClick={() => addNode('start')}
            className="w-full p-3 mb-2 bg-green-100 border rounded hover:bg-green-200"
          >
            ▶️ Start
          </button>
          
          <button
            onClick={() => addNode('action')}
            className="w-full p-3 mb-2 bg-blue-100 border rounded hover:bg-blue-200"
          >
            ⚡ Action
          </button>
          
          <button
            onClick={() => addNode('decision')}
            className="w-full p-3 mb-2 bg-yellow-100 border rounded hover:bg-yellow-200"
          >
            ❓ Decision
          </button>
          
          <button
            onClick={() => addNode('end')}
            className="w-full p-3 mb-4 bg-red-100 border rounded hover:bg-red-200"
          >
            🏁 End
          </button>

          <hr className="my-4" />
          
          <button
            onClick={newFlow}
            className="w-full p-2 mb-2 bg-white border rounded hover:bg-gray-50"
          >
            New Flow
          </button>
          
          <button
            onClick={saveFlow}
            className="w-full p-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Flow
          </button>
          
          <button
            onClick={loadFlow}
            className="w-full p-2 mb-4 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Load Flow
          </button>

          <hr className="my-4" />
          
          <button
            onClick={loadSalesforceDemo}
            className="w-full p-2 mb-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            SF Demo
          </button>
          
          <button
            onClick={loadMeceDemo}
            className="w-full p-2 mb-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            MECE Demo
          </button>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b">
            <h2 className="text-lg font-semibold">{flowName}</h2>
          </div>
          
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>

        {/* Node Editor Drawer */}
        {isDrawerOpen && selectedNode && (
          <div className="fixed inset-y-0 right-0 w-80 bg-white border-l shadow-lg p-6 z-50">
            <h3 className="text-lg font-semibold mb-4">Edit Node</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Label</label>
              <input
                type="text"
                defaultValue={selectedNode.data.label}
                className="w-full p-2 border rounded"
                onBlur={(e) => saveNode(selectedNode.id, e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}