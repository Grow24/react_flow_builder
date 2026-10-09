import React from 'react';
import { FlowPorts } from './FlowPorts';
import { ArrowRightLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface InputOutputNodeProps {
  data: {
    label: string;
    shapeType?: string;
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

export function InputOutputNode({ data, selected }: InputOutputNodeProps) {
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : ArrowRightLeft;
  
  const nodeStyle = {
    fill: style.fillColor || '#ffffff',
    stroke: style.borderColor || '#64748b',
    strokeWidth: style.borderWidth || 2,
    strokeDasharray: style.borderStyle === 'dashed' ? '5,5' : style.borderStyle === 'dotted' ? '2,2' : 'none',
    filter: style.shadow ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none'
  };

  const textStyle = {
    color: style.textColor || '#1e293b',
    fontSize: `${style.fontSize || 14}px`
  };

  return (
    <div className={`relative transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-102'}`}>
      {/* Parallelogram Shape */}
      <svg width="140" height="70" viewBox="0 0 140 70" className="overflow-visible">
        <path
          d="M20 10 L130 10 L120 60 L10 60 Z"
          style={nodeStyle}
        />
      </svg>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center px-3" style={textStyle}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <IconComponent className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase tracking-wide">Input/Output</span>
          </div>
          <div className="text-xs font-medium truncate">{data.label}</div>
        </div>
      </div>
      
      <FlowPorts variant="in-out" />
    </div>
  );
}