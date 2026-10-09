import React from 'react';
import { FlowPorts } from './FlowPorts';
import { Database } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DatabaseNodeProps {
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

export function DatabaseNode({ data, selected }: DatabaseNodeProps) {
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : Database;
  
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
      {/* Database Cylinder Shape */}
      <svg width="120" height="80" viewBox="0 0 120 80" className="overflow-visible">
        {/* Top ellipse */}
        <ellipse cx="60" cy="15" rx="50" ry="15" style={nodeStyle} />
        {/* Body rectangle */}
        <rect x="10" y="15" width="100" height="50" style={nodeStyle} />
        {/* Bottom ellipse */}
        <ellipse cx="60" cy="65" rx="50" ry="15" style={nodeStyle} />
        {/* Side lines to complete cylinder */}
        <line x1="10" y1="15" x2="10" y2="65" style={{stroke: nodeStyle.stroke, strokeWidth: nodeStyle.strokeWidth}} />
        <line x1="110" y1="15" x2="110" y2="65" style={{stroke: nodeStyle.stroke, strokeWidth: nodeStyle.strokeWidth}} />
      </svg>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center px-3" style={textStyle}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <IconComponent className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase tracking-wide">Database</span>
          </div>
          <div className="text-xs font-medium truncate">{data.label}</div>
        </div>
      </div>
      
      <FlowPorts variant="in-out" />
    </div>
  );
}