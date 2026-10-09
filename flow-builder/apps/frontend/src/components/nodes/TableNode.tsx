import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StyledNodeWrapper } from './StyledNodeWrapper';
import { Table } from 'lucide-react';

interface TableNodeProps {
  data: {
    label: string;
    rows?: number;
    cols?: number;
    cells?: string[][];
    columnWidths?: number[];
    rowHeights?: number[];
    style?: {
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
      textColor?: string;
      fontSize?: number;
    };
    onChange?: (updates: any) => void;
  };
  selected?: boolean;
}

export function TableNode({ data, selected }: TableNodeProps) {
  const {
    rows = 3,
    cols = 3,
    cells = [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3']
    ],
    columnWidths = [80, 80, 80],
    rowHeights = [30, 30, 30],
    style = {}
  } = data;

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setEditValue(cells[row]?.[col] || '');
  };

  const handleEditSave = () => {
    if (editingCell && data.onChange) {
      const newCells = cells.map((row, r) =>
        row.map((cell, c) =>
          r === editingCell.row && c === editingCell.col ? editValue : cell
        )
      );
      data.onChange({ cells: newCells });
    }
    setEditingCell(null);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  // Calculate cell position
  const getCellPosition = (row: number, col: number) => {
    const x = columnWidths.slice(0, col).reduce((sum, width) => sum + width, 0);
    const y = rowHeights.slice(0, row).reduce((sum, height) => sum + height, 0);
    return { x, y };
  };

  return (
    <div className="relative">
      <StyledNodeWrapper
        color={style.fillColor || '#ffffff'}
        border={style.borderColor || '#e2e8f0'}
        textColor={style.textColor || '#1e293b'}
        icon={<Table className="w-4 h-4" />}
        label={data.label || 'Table'}
        shape="rectangle"
        selected={selected}
        ports="none"
      >
        <div className="mt-2">
          <svg 
            width={totalWidth} 
            height={totalHeight}
            className="border border-slate-300 bg-white"
          >
            {/* Render cells */}
            {cells.map((row, r) =>
              row.map((cell, c) => {
                const { x, y } = getCellPosition(r, c);
                const isEditing = editingCell?.row === r && editingCell?.col === c;
                
                return (
                  <g key={`${r}-${c}`}>
                    {/* Cell background */}
                    <rect
                      x={x}
                      y={y}
                      width={columnWidths[c]}
                      height={rowHeights[r]}
                      fill={isEditing ? '#eff6ff' : 'white'}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      className="cursor-pointer hover:fill-slate-50"
                      onDoubleClick={() => handleCellDoubleClick(r, c)}
                    />
                    
                    {/* Cell text */}
                    {!isEditing && (
                      <text
                        x={x + 8}
                        y={y + rowHeights[r] / 2 + 4}
                        fontSize={style.fontSize || 12}
                        fill={style.textColor || '#1e293b'}
                        className="pointer-events-none select-none"
                      >
                        {cell}
                      </text>
                    )}
                  </g>
                );
              })
            )}
            
            {/* Grid lines */}
            {/* Vertical lines */}
            {columnWidths.map((_, i) => {
              const x = columnWidths.slice(0, i + 1).reduce((sum, width) => sum + width, 0);
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={totalHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}
            
            {/* Horizontal lines */}
            {rowHeights.map((_, i) => {
              const y = rowHeights.slice(0, i + 1).reduce((sum, height) => sum + height, 0);
              return (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={y}
                  x2={totalWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      </StyledNodeWrapper>

      {/* Inline editor overlay */}
      {editingCell && (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleKeyDown}
          className="absolute border border-blue-500 bg-white px-2 text-sm z-10"
          style={{
            left: getCellPosition(editingCell.row, editingCell.col).x + 40, // Offset for node padding
            top: getCellPosition(editingCell.row, editingCell.col).y + 80, // Offset for node header
            width: columnWidths[editingCell.col] - 4,
            height: rowHeights[editingCell.row] - 4,
          }}
        />
      )}

      {/* React Flow handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-slate-600 bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-slate-600 bg-white"
      />
    </div>
  );
}