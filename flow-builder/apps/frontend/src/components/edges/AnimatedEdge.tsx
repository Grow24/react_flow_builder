import React from 'react';
import { motion } from 'framer-motion';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getSmoothStepPath,
  EdgeProps
} from '@xyflow/react';

interface AnimatedEdgeProps extends EdgeProps {
  isActive?: boolean;
  isHighlighted?: boolean;
  cinematicMode?: boolean;
}

const COLORS = {
  active: '#007BFF',      // Royal Blue
  highlighted: '#00B67A', // Emerald
  default: '#B0B7C3',     // Gray
  dimmed: '#E5E7EB',      // Light Gray
  completed: '#A3BFFA'    // Blue-Gray
};

export const AnimatedEdge: React.FC<AnimatedEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  isActive = false,
  isHighlighted = false,
  cinematicMode = false
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = () => {
    if (isActive) return COLORS.active;
    if (isHighlighted) return COLORS.completed;
    if (cinematicMode && !isActive && !isHighlighted) return COLORS.dimmed;
    return COLORS.default;
  };

  const getEdgeOpacity = () => {
    if (cinematicMode && !isActive && !isHighlighted) return 0.3;
    return isActive || isHighlighted ? 1 : 0.6;
  };

  return (
    <>
      {/* Base Edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: getEdgeColor(),
          strokeWidth: isActive ? 4 : 2,
          opacity: getEdgeOpacity()
        }}
      />

      {/* Sharp Animated Flow Effect */}
      {isActive && (
        <motion.path
          d={edgePath}
          fill="none"
          stroke={`url(#gradient-${id})`}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}

      {/* Sharp Particle Animation */}
      {isActive && (
        <motion.circle
          r="4"
          fill={getEdgeColor()}
        >
          <motion.animateMotion
            dur="0.8s"
            repeatCount="1"
            path={edgePath}
          />
        </motion.circle>
      )}

      {/* Gradient Definition */}
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00E0FF" stopOpacity="1" />
          <stop offset="50%" stopColor="#007BFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#00E0FF" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <motion.div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className={`
              px-2 py-1 rounded-md text-xs font-medium
              ${isActive 
                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                : 'bg-white text-gray-600 border border-gray-200'
              }
            `}
            animate={{
              scale: isActive ? [1, 1.1, 1] : 1,
              boxShadow: isActive 
                ? [`0 2px 8px ${getEdgeColor()}40`, `0 4px 16px ${getEdgeColor()}60`, `0 2px 8px ${getEdgeColor()}40`]
                : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            transition={{
              duration: isActive ? 2 : 0.3,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {label}
          </motion.div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};