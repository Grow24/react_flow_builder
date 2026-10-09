import React from 'react';
import { FlowPorts } from './FlowPorts';

interface GroupNodeProps {
  data: {
    label: string;
    nodeIds: string[];
    style?: {
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderStyle?: string;
    };
  };
  selected?: boolean;
}

export function GroupNode({ data, selected }: GroupNodeProps) {
  const style = data.style || {};
  
  const nodeStyle = {
    backgroundColor: style.fillColor || 'rgba(59, 130, 246, 0.1)',
    borderColor: style.borderColor || '#3b82f6',
    borderWidth: `${style.borderWidth || 2}px`,
    borderStyle: style.borderStyle === 'dashed' ? 'dashed' : 'solid',
  };

  return (
    <div 
      className={`relative min-w-[200px] min-h-[150px] rounded-lg border-2 transition-all duration-200 ${
        selected ? 'shadow-xl' : 'hover:shadow-lg'
      }`}
      style={nodeStyle}
    >
      {/* Group Header */}
      <div className="absolute -top-6 left-0 px-2 py-1 bg-blue-600 text-white text-xs rounded-t">
        {data.label} ({data.nodeIds.length} items)
      </div>
      
      {/* Group Frame */}
      <div className="w-full h-full rounded-lg border-2 border-dashed border-blue-300 opacity-50" />
      
      <FlowPorts variant="in-out" />
    </div>
  );
}