import React from 'react';
import { StyledNodeWrapper } from './StyledNodeWrapper';
import { drawioNodeStyles } from '../../config/nodeStyles';
import { Play } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface StartNodeProps {
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

export function StartNode({ data, selected }: StartNodeProps) {
  const nodeStyle = drawioNodeStyles.start;
  const style = data.style || {};
  const IconComponent = style.icon && (LucideIcons as any)[style.icon] ? (LucideIcons as any)[style.icon] : Play;
  
  return (
    <div className="relative">
      <StyledNodeWrapper
        color={style.fillColor || nodeStyle.background}
        border={style.borderColor || nodeStyle.border}
        textColor={style.textColor || nodeStyle.textColor}
        icon={<IconComponent className="w-4 h-4" />}
        label={data.label || 'Start'}
        shape={nodeStyle.shape}
        selected={selected}
        ports="out"
      />
    </div>
  );
}