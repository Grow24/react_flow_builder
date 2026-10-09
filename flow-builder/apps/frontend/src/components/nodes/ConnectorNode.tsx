import React from 'react';
import { FlowPorts } from './FlowPorts';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface ConnectorNodeProps {
  data: {
    label: string;
    style?: {
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderStyle?: string;
      textColor?: string;
      fontSize?: number;
      icon?: string;
      shadow?: boolean;
    };
  };
  selected?: boolean;
}

export function ConnectorNode({ data, selected }: ConnectorNodeProps) {
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : ArrowRight;
  
  const nodeStyle = {
    backgroundColor: style.fillColor || '#ffffff',
    borderColor: style.borderColor || '#64748b',
    borderWidth: `${style.borderWidth || 2}px`,
    borderStyle: style.borderStyle || 'solid',
    color: style.textColor || '#64748b',
    boxShadow: style.shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div className="relative">
      {/* Circular connector */}
      <div 
        className={`w-12 h-12 rounded-full border flex items-center justify-center ${
          selected ? 'shadow-xl' : 'hover:shadow-xl'
        }`}
        style={nodeStyle}
      >
        <IconComponent className="w-4 h-4" />
      </div>
      
      {/* Label */}
      {data.label && data.label !== 'New connector' && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap">
          {data.label}
        </div>
      )}
      
      <FlowPorts variant="in-out" />
    </div>
  );
}