import React from 'react';
import { FlowPorts, type FlowPortVariant } from './FlowPorts';

interface StyledNodeWrapperProps {
  children?: React.ReactNode;
  color: string;
  border: string;
  textColor?: string;
  icon?: React.ReactNode;
  label: string;
  shape?: 'rectangle' | 'oval' | 'diamond' | 'circle' | 'document' | 'process';
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ports?: FlowPortVariant;
}

export const StyledNodeWrapper: React.FC<StyledNodeWrapperProps> = ({
  children,
  color,
  border,
  textColor = '#374151',
  icon,
  label,
  shape = 'rectangle',
  selected = false,
  className = '',
  style = {},
  ports = 'in-out',
}) => {
  const getShapeStyle = () => {
    const baseStyle = {
      background: color,
      borderColor: border,
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 600,
      fontSize: '12px',
      border: '2px solid',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      ...style
    };

    switch (shape) {
      case 'oval':
        return {
          ...baseStyle,
          borderRadius: '50px',
          width: '120px',
          height: '50px'
        };
      case 'diamond':
        return {
          ...baseStyle,
          width: '96px',
          height: '96px',
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
          borderRadius: 0,
        };
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%',
          width: '50px',
          height: '50px'
        };
      case 'process':
        return {
          ...baseStyle,
          borderRadius: '15px',
          width: '120px',
          height: '50px'
        };
      case 'document':
        return {
          ...baseStyle,
          borderRadius: '8px 8px 0 0',
          width: '120px',
          height: '50px'
        };
      default:
        return {
          ...baseStyle,
          borderRadius: '8px',
          width: '120px',
          height: '50px'
        };
    }
  };

  const labelStyle = {
    textAlign: 'center' as const,
    fontSize: shape === 'diamond' ? '11px' : '12px',
    fontWeight: 600,
    lineHeight: '1.2',
    padding: shape === 'diamond' ? '0 18px' : '0 4px',
  };

  return (
    <div className="relative">
      <FlowPorts variant={ports} />
      {shape === 'diamond' ? (
        <div className={`relative ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${className}`} style={{ width: 96, height: 96 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: border,
              clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 3,
              background: color,
              clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center" style={{ ...labelStyle, color: textColor }}>
            <span>{label}</span>
          </div>
        </div>
      ) : (
        <div
          style={getShapeStyle()}
          className={`${selected ? 'ring-2 ring-blue-400' : ''} ${className}`}
        >
          <div style={labelStyle}>
            {icon && <span style={{ marginRight: '4px', fontSize: '10px' }}>{icon}</span>}
            {label}
          </div>
          {children}
        </div>
      )}
    </div>
  );
};