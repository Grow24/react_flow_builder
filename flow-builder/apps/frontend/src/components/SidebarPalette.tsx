import React from 'react';
import { Play, Square, Zap, Circle, Diamond, Layout, Maximize, FileText, Database, ArrowRightLeft, StickyNote, Type, MessageSquare, Image, Menu, Table, Filter, GitMerge, Monitor } from 'lucide-react';

interface SidebarPaletteProps {
  onAddNode: (type: string) => void;
  onAutoLayout?: () => void;
  onFitView?: () => void;
  onNodeDragStart?: (type: string) => void;
  onNodeDragEnd?: () => void;
}

export function SidebarPalette({ onAddNode, onAutoLayout, onFitView, onNodeDragStart, onNodeDragEnd }: SidebarPaletteProps) {
  const nodeTypes = [
    { type: 'start', label: 'Start', icon: <Play className="w-4 h-4 text-green-600" />, bgColor: 'bg-green-100' },
    { type: 'importtable', label: 'Import table', icon: <Table className="w-4 h-4 text-blue-600" />, bgColor: 'bg-blue-100' },
    { type: 'filter', label: 'Filter', icon: <Filter className="w-4 h-4 text-amber-600" />, bgColor: 'bg-amber-100' },
    { type: 'join', label: 'Join', icon: <GitMerge className="w-4 h-4 text-violet-600" />, bgColor: 'bg-violet-100' },
    { type: 'display', label: 'Display', icon: <Monitor className="w-4 h-4 text-teal-600" />, bgColor: 'bg-teal-100' },
    { type: 'decision', label: 'Decision', icon: <Diamond className="w-4 h-4 text-amber-600" />, bgColor: 'bg-amber-100' },
    { type: 'action', label: 'Action', icon: <Zap className="w-4 h-4 text-blue-600" />, bgColor: 'bg-blue-100' },
    { type: 'activity', label: 'Activity', icon: <Menu className="w-4 h-4 text-purple-600" />, bgColor: 'bg-purple-100' },
    { type: 'process', label: 'Process', icon: <Square className="w-4 h-4 text-purple-600" />, bgColor: 'bg-purple-100' },
    { type: 'connector', label: 'Connector', icon: <Circle className="w-4 h-4 text-slate-600" />, bgColor: 'bg-slate-100' },
    { type: 'end', label: 'End', icon: <Square className="w-4 h-4 text-red-600" />, bgColor: 'bg-red-100' },
    { type: 'document', label: 'Document', icon: <FileText className="w-4 h-4 text-slate-600" />, bgColor: 'bg-slate-100' },
    { type: 'database', label: 'Database', icon: <Database className="w-4 h-4 text-indigo-600" />, bgColor: 'bg-indigo-100' },
    { type: 'inputoutput', label: 'Input/Output', icon: <ArrowRightLeft className="w-4 h-4 text-teal-600" />, bgColor: 'bg-teal-100' },
    { type: 'annotation', label: 'Annotation', icon: <StickyNote className="w-4 h-4 text-yellow-600" />, bgColor: 'bg-yellow-100' },
    { type: 'stickynote', label: 'Sticky Note', icon: <StickyNote className="w-4 h-4 text-yellow-600" />, bgColor: 'bg-yellow-100' },
    { type: 'text', label: 'Text', icon: <Type className="w-4 h-4 text-gray-600" />, bgColor: 'bg-gray-100' },
    { type: 'callout', label: 'Callout', icon: <MessageSquare className="w-4 h-4 text-orange-600" />, bgColor: 'bg-orange-100' },
    { type: 'image', label: 'Image', icon: <Image className="w-4 h-4 text-blue-600" />, bgColor: 'bg-blue-100' },
    { type: 'table', label: 'Table', icon: <Table className="w-4 h-4 text-emerald-600" />, bgColor: 'bg-emerald-100' }
  ];

  return (
    <div className="fixed left-0 top-16 bottom-0 w-12 hover:w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/60 shadow-xl flex flex-col transition-all duration-300 ease-out z-40 group backdrop-blur-sm">
      {/* Hamburger Icon */}
      <div className="p-3 border-b border-slate-100/80">
        <div className="w-6 h-6 flex items-center justify-center text-slate-500 group-hover:text-slate-700 transition-colors">
          <Menu className="w-5 h-5" />
        </div>
      </div>

      {/* Shapes Grid */}
      <div className="flex-1 overflow-hidden hover:overflow-y-auto scrollbar-hide">
        <div className="p-2">
          <div className="grid grid-cols-1 gap-0.5">
            {nodeTypes.map((nodeType) => (
              <div
                key={nodeType.type}
                draggable
                role="button"
                aria-label={nodeType.label}
                onClick={() => onAddNode(nodeType.type)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', nodeType.type);
                  onNodeDragStart?.(nodeType.type);
                }}
                onDragEnd={() => onNodeDragEnd?.()}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100/70 cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-95"
                title={nodeType.label}
              >
                <div className={`w-8 h-8 ${nodeType.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50`}>
                  {nodeType.icon}
                </div>
                <span className="text-sm font-medium text-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
                  {nodeType.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools */}
      {(onAutoLayout || onFitView) && (
        <div className="border-t border-slate-100/80 p-2 bg-slate-50/30">
          <div className="space-y-0.5">
            {onAutoLayout && (
              <button
                onClick={onAutoLayout}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100/70 transition-all duration-200 hover:shadow-sm active:scale-95"
                title="Auto Layout"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50">
                  <Layout className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
                  Auto Layout
                </span>
              </button>
            )}
            {onFitView && (
              <button
                onClick={onFitView}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100/70 transition-all duration-200 hover:shadow-sm active:scale-95"
                title="Fit View"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50">
                  <Maximize className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
                  Fit View
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}