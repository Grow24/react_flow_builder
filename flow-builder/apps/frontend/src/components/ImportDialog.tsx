import React, { useState, useRef } from 'react';
import { API_ORIGIN } from '../api/origin';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportReport {
  mapped: number;
  skipped: number;
  warnings: string[];
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [importType, setImportType] = useState<'json' | 'drawio'>('json');
  const [content, setContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      
      // Auto-detect format
      if (text.trim().startsWith('<')) {
        setImportType('drawio');
      } else {
        setImportType('json');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!content.trim()) {
      toast.error('Please provide content to import');
      return;
    }

    try {
      setImporting(true);
      setReport(null);

      const endpoint = importType === 'json' ? '/api/import/json' : '/api/import/drawio';
      const payload = importType === 'json' 
        ? { flowData: JSON.parse(content) }
        : { xmlContent: content };

      const response = await fetch(`${API_ORIGIN}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setReport(result.report);
        onImport(result.data);
        toast.success(`Import successful: ${result.report.mapped} items mapped`);
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed: Invalid format');
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setContent('');
    setReport(null);
    setImportType('json');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Import Flow</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Import Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Import Format</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`p-4 cursor-pointer border-2 ${
                  importType === 'json' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setImportType('json')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">JSON Flow</h4>
                    <p className="text-sm text-gray-600">Import flow definition</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className={`p-4 cursor-pointer border-2 ${
                  importType === 'drawio' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
                onClick={() => setImportType('drawio')}
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Draw.io XML</h4>
                    <p className="text-sm text-gray-600">Import from Draw.io</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Content</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={importType === 'json' ? '.json' : '.xml,.drawio'}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                importType === 'json' 
                  ? 'Paste JSON flow definition here...'
                  : 'Paste Draw.io XML content here...'
              }
              className="min-h-32 font-mono text-sm"
            />
          </div>

          {/* Import Report */}
          {report && (
            <div className="space-y-4">
              <h3 className="font-medium">Import Report</h3>
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">{report.mapped} items imported successfully</span>
                  </div>
                  
                  {report.skipped > 0 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{report.skipped} items skipped</span>
                    </div>
                  )}
                  
                  {report.warnings.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Warnings:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {report.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
        
        <div className="flex justify-between gap-2 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={resetDialog}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!content.trim() || importing}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};