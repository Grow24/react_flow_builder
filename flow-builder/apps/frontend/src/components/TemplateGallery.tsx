import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api/origin';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, FileText, Users, AlertTriangle, BookOpen, Copy, Lightbulb } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount: number;
  edgeCount: number;
}

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onSaveAsTemplate?: (templateData: any) => void;
  selectedNodes?: any[];
  selectedEdges?: any[];
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onSaveAsTemplate,
  selectedNodes = [],
  selectedEdges = []
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', category: '', description: '' });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/templates`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Business Process':
        return <FileText className="w-5 h-5" />;
      case 'Customer Management':
        return <Users className="w-5 h-5" />;
      case 'IT Operations':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Ideation & Creativity':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Template Gallery</h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedNodes.length > 0 && onSaveAsTemplate && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSaveDialog(true)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Save as Template
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading templates...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(templates) && templates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300 group"
                  onClick={() => onSelectTemplate(template.id)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        {template.category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{template.nodeCount} nodes</span>
                      <span>{template.edgeCount} connections</span>
                    </div>
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template.id);
                      }}
                    >
                      Insert
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        </div>
      </div>
      
      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Save as Template</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select category</option>
                  <option value="HR Process">HR Process</option>
                  <option value="Operations">Operations</option>
                  <option value="Business Process">Business Process</option>
                  <option value="Customer Management">Customer Management</option>
                  <option value="Ideation & Creativity">Ideation & Creativity</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Describe this template"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newTemplate.name && newTemplate.category && onSaveAsTemplate) {
                    onSaveAsTemplate({
                      ...newTemplate,
                      nodes: selectedNodes,
                      edges: selectedEdges
                    });
                    setShowSaveDialog(false);
                    setNewTemplate({ name: '', category: '', description: '' });
                  }
                }}
                disabled={!newTemplate.name || !newTemplate.category}
              >
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};