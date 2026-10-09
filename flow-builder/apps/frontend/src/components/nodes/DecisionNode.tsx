import React from 'react';
import { StyledNodeWrapper } from './StyledNodeWrapper';
import { drawioNodeStyles } from '../../config/nodeStyles';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

interface DecisionNodeProps {
  data: {
    label: string;
    conditions?: Array<{
      id: string;
      label: string;
      expression: string;
    }>;
    defaultPath?: string;
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

export function DecisionNode({ data, selected }: DecisionNodeProps) {
  const conditions = data.conditions || [];
  const nodeStyle = drawioNodeStyles.decision;
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : HelpCircle;
  
  return (
    <div className="relative">
      <StyledNodeWrapper
        color={style.fillColor || nodeStyle.background}
        border={style.borderColor || nodeStyle.border}
        textColor={style.textColor || nodeStyle.textColor}
        icon={<IconComponent className="w-4 h-4" />}
        label={data.label || 'Decision'}
        shape={nodeStyle.shape}
        selected={selected}
        ports="decision"
      >
        {conditions.length > 0 && (
          <div className="text-xs opacity-75 mt-1">
            {conditions.length} condition{conditions.length > 1 ? 's' : ''}
          </div>
        )}
      </StyledNodeWrapper>
    </div>
  );
}