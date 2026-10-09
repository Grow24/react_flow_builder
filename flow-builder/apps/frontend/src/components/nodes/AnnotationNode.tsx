import React from 'react';
import { FlowPorts } from './FlowPorts';
import { StickyNote } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AnnotationNodeProps {
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

export function AnnotationNode({ data, selected }: AnnotationNodeProps) {
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : StickyNote;
  
  const nodeStyle = {
    fill: style.fillColor || '#fef3c7',
    stroke: style.borderColor || '#f59e0b',
    strokeWidth: style.borderWidth || 2,
    strokeDasharray: style.borderStyle === 'dashed' ? '5,5' : style.borderStyle === 'dotted' ? '2,2' : 'none',
    filter: style.shadow ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none'
  };

  const textStyle = {
    color: style.textColor || '#92400e',
    fontSize: `${style.fontSize || 14}px`
  };

  return (
    <div className={`relative transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-102'}`}>
      {/* Sticky Note Shape with folded corner */}
      <svg width="120" height="100" viewBox="0 0 120 100" className="overflow-visible">
        <path
          d="M10 10 L110 10 L110 70 L90 70 L90 90 L10 90 Z"
          style={nodeStyle}
        />
        {/* Folded corner */}
        <path
          d="M90 70 L110 70 L90 90 Z"
          style={{...nodeStyle, fill: style.borderColor || '#f59e0b', opacity: 0.3}}
        />
      </svg>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center px-3" style={textStyle}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <IconComponent className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase tracking-wide">Note</span>
          </div>
          <div className="text-xs font-medium truncate">{data.label}</div>
        </div>
      </div>
      
      <FlowPorts variant="in-out" />
    </div>
  );
}