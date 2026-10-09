import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api/origin';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Clock, User, RotateCcw, Eye } from 'lucide-react';
import { ReactFlow, Node, Edge } from '@xyflow/react';
import { nodeTypes } from '../config/nodeTypes';
import { toast } from 'sonner';

interface FlowVersion {
  id: number;
  version: number;
  jsonBackup: string;
  author: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
}

interface HistoryTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  flowId: number | null;
  onRestore: (versionData: any) => void;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  isOpen,
  onClose,
  flowId,
  onRestore
}) => {
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<FlowVersion | null>(null);
  const [previewData, setPreviewData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && flowId) {
      fetchVersions();
    }
  }, [isOpen, flowId]);

  const fetchVersions = async () => {
    if (!flowId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/flows/${flowId}/versions`);
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const previewVersion = (version: FlowVersion) => {
    try {
      const versionData = JSON.parse(version.jsonBackup);
      setSelectedVersion(version);
      setPreviewData({
        nodes: versionData.nodes || [],
        edges: versionData.edges || []
      });
    } catch (error) {
      console.error('Failed to parse version data:', error);
      toast.error('Failed to preview version');
    }
  };

  const restoreVersion = () => {
    if (!selectedVersion) return;
    
    try {
      const versionData = JSON.parse(selectedVersion.jsonBackup);
      onRestore(versionData);
      onClose();
      toast.success(`Restored to version ${selectedVersion.version}`);
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateDiff = (current: FlowVersion, previous?: FlowVersion) => {
    if (!previous) return { nodes: 0, edges: 0 };
    
    return {
      nodes: current.nodeCount - previous.nodeCount,
      edges: current.edgeCount - previous.edgeCount
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Version History</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex h-[70vh]">
          {/* Version List */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium mb-4">Versions</h3>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading versions...
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No version history available
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => {
                    const diff = calculateDiff(version, versions[index + 1]);
                    const isSelected = selectedVersion?.id === version.id;
                    
                    return (
                      <Card
                        key={version.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => previewVersion(version)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                              v{version.version}
                            </div>
                            <span className="font-medium text-sm">
                              Version {version.version}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              previewVersion(version);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(version.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.author || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-3">
                            <span>{version.nodeCount} nodes</span>
                            <span>{version.edgeCount} edges</span>
                          </div>
                          {(diff.nodes !== 0 || diff.edges !== 0) && (
                            <div className="flex items-center gap-2 text-xs">
                              {diff.nodes !== 0 && (
                                <span className={diff.nodes > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {diff.nodes > 0 ? '+' : ''}{diff.nodes} nodes
                                </span>
                              )}
                              {diff.edges !== 0 && (
                                <span className={diff.edges > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {diff.edges > 0 ? '+' : ''}{diff.edges} edges
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Preview Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  {selectedVersion ? (
                    <div>
                      <h3 className="font-medium">
                        Version {selectedVersion.version} Preview
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedVersion.createdAt)} by {selectedVersion.author || 'Unknown'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-500">
                        Select a version to preview
                      </h3>
                      <p className="text-sm text-gray-400">
                        Click on a version from the list to see the flow diagram
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedVersion && (
                  <Button
                    onClick={restoreVersion}
                    className="gap-2"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore Version
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-gray-50">
              {previewData ? (
                <ReactFlow
                  nodes={previewData.nodes}
                  edges={previewData.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  attributionPosition="bottom-left"
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  className="bg-gray-50"
                >
                </ReactFlow>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {selectedVersion ? 'Loading preview...' : 'No version selected'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};