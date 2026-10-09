import { Handle, Position } from '@xyflow/react';

export type FlowPortVariant = 'in-out' | 'out' | 'in' | 'decision' | 'join' | 'none';

const portClass =
  '!h-2.5 !w-2.5 !border-2 !border-slate-600 !bg-white hover:!border-blue-600 hover:!bg-blue-50';

export function FlowPorts({ variant = 'in-out' }: { variant?: FlowPortVariant }) {
  if (variant === 'none') return null;

  return (
    <>
      {variant !== 'out' && (
        <Handle type="target" position={Position.Left} id="in" className={portClass} role="button" aria-label="Input port" />
      )}
      {variant !== 'in' && (
        <Handle type="source" position={Position.Right} id="out" className={portClass} role="button" aria-label="Output port" />
      )}
      {variant === 'decision' && (
        <Handle type="source" position={Position.Bottom} id="no" className={portClass} />
      )}
      {variant === 'join' && (
        <Handle type="target" position={Position.Top} id="in2" className={portClass} role="button" aria-label="Second input port" />
      )}
    </>
  );
}
