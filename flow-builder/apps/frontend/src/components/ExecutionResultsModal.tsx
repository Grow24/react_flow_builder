import React from 'react';
import { Button } from './ui/button';
import { X, CheckCircle, AlertCircle, Download, Play, Clock, Zap } from 'lucide-react';

interface ExecutionLog {
  step: number;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  message: string;
  duration: number;
  status: 'success' | 'error' | 'warning';
}

interface ExecutionResult {
  status: 'completed' | 'failed' | 'partial';
  executionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  logs: string[];
  outputContext: Record<string, any>;
  errors?: string[];
  prismaRunId?: number;
}

interface ExecutionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExecutionResult | null;
  flowName: string;
  onRunAgain: () => void;
  onExport: (format: string) => void;
}

export function ExecutionResultsModal({ 
  isOpen, 
  onClose, 
  result, 
  flowName, 
  onRunAgain, 
  onExport 
}: ExecutionResultsModalProps) {
  if (!isOpen || !result) return null;

  const getStatusIcon = () => {
    switch (result.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
      default:
        return <Clock className="w-6 h-6 text-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'completed': return 'from-green-500 to-green-600';
      case 'failed': return 'from-red-500 to-red-600';
      case 'partial': return 'from-amber-500 to-amber-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'completed': return 'Flow Completed Successfully';
      case 'failed': return 'Flow Execution Failed';
      case 'partial': return 'Flow Partially Completed';
      default: return 'Flow Execution Status Unknown';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: string) => {
    switch (format) {
      case 'json':
        downloadJSON(result, `${flowName.replace(/\s+/g, '_')}_execution_result.json`);
        break;
      case 'logs':
        const logsText = (result.logs || []).join('\n');
        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${flowName.replace(/\s+/g, '_')}_execution_logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
      case 'output':
        downloadJSON(result.outputContext, `${flowName.replace(/\s+/g, '_')}_output_data.json`);
        break;
    }
    onExport(format);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getStatusColor()} px-6 py-4 rounded-t-xl`}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <h2 className="text-xl font-semibold">{getStatusText()}</h2>
                  <p className="text-sm opacity-90">{flowName}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Execution Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Duration</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatDuration(result.duration || 0)}</div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Steps</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{result.logs?.length || 0}</div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Status</span>
                </div>
                <div className="text-lg font-semibold capitalize text-slate-900">{result.status}{result.prismaRunId ? ` · Prisma #${result.prismaRunId}` : ''}</div>
              </div>
            </div>

            {/* Execution Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Execution Timeline</h3>
              <div className="space-y-2">
                {(result.logs || []).map((log, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-sm text-slate-700">{log}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Data */}
            {result.outputContext && Object.keys(result.outputContext).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Output Data</h3>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono">
                    {JSON.stringify(result.outputContext, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-4">Errors</h3>
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">{error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Export Options:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('json')}
                  className="text-xs"
                >
                  Full Result (JSON)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('logs')}
                  className="text-xs"
                >
                  Execution Logs (TXT)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('output')}
                  className="text-xs"
                >
                  Output Data (JSON)
                </Button>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={onRunAgain} className="gap-2">
                  <Play className="w-4 h-4" />
                  Run Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}