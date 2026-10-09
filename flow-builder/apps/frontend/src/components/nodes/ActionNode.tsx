import React from 'react';
import { FlowPorts } from './FlowPorts';
import { Zap, Mail, Database, Globe } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    actionType?: string;
    config?: any;
    outputVar?: string;
    style?: {
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderStyle?: string;
      textColor?: string;
      fontSize?: number;
      icon?: string;
      shadow?: boolean;
      borderRadius?: number;
    };
  };
  selected?: boolean;
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : null;
  
  const getActionIcon = () => {
    if (IconComponent) return <IconComponent className="w-4 h-4" />;
    switch (data.actionType) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'db': return <Database className="w-4 h-4" />;
      case 'api': return <Globe className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };
  
  const getActionBadge = () => {
    if (!data.actionType) return null;
    const badges = {
      email: { icon: '📧', color: 'bg-green-500' },
      api: { icon: '🌐', color: 'bg-purple-500' },
      db: { icon: '🗄️', color: 'bg-orange-500' }
    };
    const badge = badges[data.actionType as keyof typeof badges];
    return badge ? (
      <div className={`absolute -top-2 -right-2 w-6 h-6 ${badge.color} rounded-full flex items-center justify-center text-xs border-2 border-white shadow-md`}>
        {badge.icon}
      </div>
    ) : null;
  };
  
  const nodeStyle = {
    backgroundColor: style.fillColor || '#3b82f6',
    borderColor: style.borderColor || '#2563eb',
    borderWidth: `${style.borderWidth || 2}px`,
    borderStyle: style.borderStyle || 'solid',
    color: style.textColor || '#ffffff',
    fontSize: `${style.fontSize || 14}px`,
    borderRadius: `${style.borderRadius || 8}px`,
    boxShadow: style.shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };
  
  return (
    <div className="relative">
      {/* Rectangle Shape */}
      <div 
        className={`w-44 h-20 border flex items-center justify-center transition-all duration-200 ${
          selected ? 'shadow-xl' : 'hover:shadow-xl'
        }`}
        style={nodeStyle}
      >
        <div className="text-center px-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            {getActionIcon()}
            <span className="font-semibold text-sm uppercase tracking-wide">Action</span>
          </div>
          <div className="text-xs font-medium truncate">{data.label}</div>
          {data.outputVar && (
            <div className="text-xs opacity-90 mt-1">→ {data.outputVar}</div>
          )}
        </div>
      </div>
      
      {/* Action Type Badge */}
      {getActionBadge()}
      
      <FlowPorts variant="in-out" />
    </div>
  );
}