import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { StyledNodeWrapper } from './StyledNodeWrapper';
import { Table, Square, Circle, Triangle } from 'lucide-react';
import { useTableResize } from '../../hooks/useTableResize';
import { useTableContainer, TableChild } from '../../hooks/useTableContainer';
import '../../styles/tableNode.css';

interface TableNodeProps {
  id: string;
  data: {
    label: string;
    rows?: number;
    cols?: number;
    cells?: string[][];
    columnWidths?: number[];
    rowHeights?: number[];
    children?: TableChild[];
    mergedCells?: Array<{ start: [number, number]; end: [number, number] }>;
    config?: {
      headerRow?: boolean;
      cellPadding?: number;
      textAlign?: 'left' | 'center' | 'right';
      borderStyle?: 'solid' | 'dashed' | 'none';
      borderColor?: string;
      containerMode?: boolean;
      showRowHeaders?: boolean;
      showColumnHeaders?: boolean;
    };
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

export function TableNode({ id, data, selected }: TableNodeProps) {
  // Table node with container functionality
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
    children = [],
    mergedCells = [],
    config = {},
    style = {}
  } = data;

  const { addNode, deleteElements } = useReactFlow();
  const { 
    addChild, 
    removeChild, 
    updateChild, 
    getChildrenInCell 
  } = useTableContainer(data, data.onChange);
  
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);

  // Resize functionality
  const { isResizing, resizeType, resizeIndex, handleResizeStart } = useTableResize({
    columnWidths,
    rowHeights,
    onResize: (newColumnWidths, newRowHeights) => {
      if (data.onChange) {
        data.onChange({
          columnWidths: newColumnWidths,
          rowHeights: newRowHeights
        });
      }
    }
  });

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellDoubleClick = (row: number, col: number) => {
    // Only allow text editing if not in container mode
    if (!config.containerMode) {
      setEditingCell({ row, col });
      setEditValue(cells[row]?.[col] || '');
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && config.containerMode) {
      const cellData = over.data.current as { row: number; col: number };
      const draggedItem = active.data.current;
      
      if (cellData && draggedItem) {
        addChild({
          row: cellData.row,
          col: cellData.col,
          type: draggedItem.type || 'shape',
          nodeType: draggedItem.nodeType || 'rectangle',
          data: draggedItem.data || {},
          position: { x: 0, y: 0 }
        });
      }
    }
  };
  
  const handleAddShape = (row: number, col: number, shapeType: string) => {
    if (config.containerMode) {
      addChild({
        row,
        col,
        type: 'shape',
        nodeType: shapeType,
        data: { label: `${shapeType} ${row}-${col}` }
      });
    }
  };
  
  const handleAddNodeToCell = (row: number, col: number, nodeType: string) => {
    if (!config.containerMode) return;
    
    // Add node to cell
    addChild({
      row,
      col,
      type: 'node',
      nodeType: nodeType,
      data: { label: `${nodeType} in cell ${row}-${col}` }
    });
    
    // Auto-resize cell to fit content
    const minCellWidth = 120;
    const minCellHeight = 60;
    
    if (data.onChange) {
      const newColumnWidths = [...columnWidths];
      const newRowHeights = [...rowHeights];
      
      if (newColumnWidths[col] < minCellWidth) {
        newColumnWidths[col] = minCellWidth;
      }
      if (newRowHeights[row] < minCellHeight) {
        newRowHeights[row] = minCellHeight;
      }
      
      data.onChange({
        columnWidths: newColumnWidths,
        rowHeights: newRowHeights
      });
    }
  };
  
  const handleCellClick = (e: React.MouseEvent, row: number, col: number) => {
    if (config.containerMode && e.shiftKey) {
      handleAddShape(row, col, 'rectangle');
    }
  };
  
  const getNodeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'start': return '#10b981';
      case 'decision': return '#f59e0b';
      case 'action': return '#3b82f6';
      case 'process': return '#a855f7';
      case 'end': return '#ef4444';
      default: return '#6b7280';
    }
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

  // Context menu actions
  const handleAddRow = () => {
    if (!data.onChange) return;
    const newCells = [...cells, new Array(cols).fill('')];
    const newRowHeights = [...rowHeights, 30];
    data.onChange({
      rows: rows + 1,
      cells: newCells,
      rowHeights: newRowHeights
    });
  };

  const handleAddColumn = () => {
    if (!data.onChange) return;
    const newCells = cells.map(row => [...row, '']);
    const newColumnWidths = [...columnWidths, 80];
    data.onChange({
      cols: cols + 1,
      cells: newCells,
      columnWidths: newColumnWidths
    });
  };

  // Calculate cell position
  const getCellPosition = (row: number, col: number) => {
    const x = columnWidths.slice(0, col).reduce((sum, width) => sum + width, 0);
    const y = rowHeights.slice(0, row).reduce((sum, height) => sum + height, 0);
    return { x, y };
  };

  const getTextAnchor = () => {
    switch (config.textAlign) {
      case 'center': return 'middle';
      case 'right': return 'end';
      default: return 'start';
    }
  };

  const getTextX = (x: number, width: number) => {
    const padding = config.cellPadding || 8;
    switch (config.textAlign) {
      case 'center': return x + width / 2;
      case 'right': return x + width - padding;
      default: return x + padding;
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div 
        className="relative table-node"
        onDragOver={(e) => {
          if (config.containerMode) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDrop={(e) => {
          if (config.containerMode) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get the node type from drag data
            const nodeType = e.dataTransfer.getData('application/reactflow');
            if (nodeType) {
              // Calculate which cell the drop occurred in
              const rect = e.currentTarget.getBoundingClientRect();
              const tableRect = e.currentTarget.querySelector('.table-container')?.getBoundingClientRect();
              if (tableRect) {
                const x = e.clientX - tableRect.left;
                const y = e.clientY - tableRect.top;
                
                // Find the cell based on position
                let targetCol = 0;
                let targetRow = 0;
                let accumulatedWidth = 0;
                let accumulatedHeight = 0;
                
                for (let c = 0; c < cols; c++) {
                  if (x <= accumulatedWidth + columnWidths[c]) {
                    targetCol = c;
                    break;
                  }
                  accumulatedWidth += columnWidths[c];
                }
                
                for (let r = 0; r < rows; r++) {
                  if (y <= accumulatedHeight + rowHeights[r]) {
                    targetRow = r;
                    break;
                  }
                  accumulatedHeight += rowHeights[r];
                }
                
                handleAddNodeToCell(targetRow, targetCol, nodeType);
              }
            }
          }
        }}
      >
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
        <div 
          className="table-header" 
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
        />
        <div 
          className="mt-2"
          onDoubleClick={(e) => {
            // Allow double-click on table area (not cells) to open config
            if (!e.target || !(e.target as Element).closest('svg')) {
              e.stopPropagation();
            }
          }}
        >
          {config.containerMode && (
            <div className="text-xs text-slate-500 mb-1 px-2">
              Drag nodes from sidebar into cells • Drag resize handles to adjust size
            </div>
          )}
          <div 
            className="relative border border-slate-300 bg-white table-container"
            style={{ width: totalWidth, height: totalHeight }}
          >
            <svg 
              width={totalWidth} 
              height={totalHeight}
              className="absolute inset-0"
            >
            {/* Render cells */}
            {cells.map((row, r) =>
              row.map((cell, c) => {
                const { x, y } = getCellPosition(r, c);
                // Simple cell rendering without merging
                const cellSpan = { isTopLeft: true, colSpan: 1, rowSpan: 1 };
                const isEditing = editingCell?.row === r && editingCell?.col === c;
                const isSelected = false;
                const isHeader = config.headerRow && r === 0;
                const cellChildren = getChildrenInCell(r, c);
                
                if (!cellSpan.isTopLeft) return null;
                
                const cellWidth = columnWidths.slice(c, c + cellSpan.colSpan).reduce((sum, w) => sum + w, 0);
                const cellHeight = rowHeights.slice(r, r + cellSpan.rowSpan).reduce((sum, h) => sum + h, 0);
                
                return (
                  <g key={`${r}-${c}`}>
                    {config.containerMode ? (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={cellWidth}
                          height={cellHeight}
                          fill={cellChildren.length > 0 ? '#f8fafc' : '#fafbff'}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray={cellChildren.length === 0 ? '4 4' : 'none'}
                          className="cursor-pointer hover:fill-blue-50"
                          style={{ pointerEvents: 'all' }}
                        />
                        
                        {/* Render child shapes and nodes */}
                        {cellChildren.map((child, idx) => {
                          const childX = x + (child.position?.x || cellWidth / 2);
                          const childY = y + (child.position?.y || cellHeight / 2);
                          return (
                            <g key={child.id || idx}>
                              {/* Render shapes */}
                              {child.type === 'shape' && child.nodeType === 'rectangle' && (
                                <rect x={childX - 15} y={childY - 10} width={30} height={20} fill="#3b82f6" stroke="#1e40af" strokeWidth="1" rx="2" />
                              )}
                              {child.type === 'shape' && child.nodeType === 'circle' && (
                                <circle cx={childX} cy={childY} r={12} fill="#10b981" stroke="#059669" strokeWidth="1" />
                              )}
                              {child.type === 'shape' && child.nodeType === 'diamond' && (
                                <polygon points={`${childX},${childY-12} ${childX+12},${childY} ${childX},${childY+12} ${childX-12},${childY}`} fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
                              )}
                              
                              {/* Render flow nodes */}
                              {child.type === 'node' && (
                                <g>
                                  <rect 
                                    x={x + 5} 
                                    y={y + 5} 
                                    width={cellWidth - 10} 
                                    height={cellHeight - 10} 
                                    fill={getNodeColor(child.nodeType)} 
                                    stroke="#64748b" 
                                    strokeWidth="1" 
                                    rx="4" 
                                  />
                                  <text 
                                    x={x + cellWidth / 2} 
                                    y={y + cellHeight / 2} 
                                    fontSize="10" 
                                    fill="white" 
                                    textAnchor="middle" 
                                    dominantBaseline="middle"
                                  >
                                    {child.nodeType}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                        
                        {/* Add shape buttons - show on hover */}
                        <g className="opacity-0 hover:opacity-100 transition-opacity">
                          <rect x={x + cellWidth - 60} y={y + 2} width={18} height={16} fill="#3b82f6" rx="2" className="cursor-pointer" onClick={() => handleAddShape(r, c, 'rectangle')} />
                          <circle cx={x + cellWidth - 32} cy={y + 10} r={8} fill="#10b981" className="cursor-pointer" onClick={() => handleAddShape(r, c, 'circle')} />
                          <polygon points={`${x + cellWidth - 12},${y + 2} ${x + cellWidth - 2},${y + 10} ${x + cellWidth - 12},${y + 18} ${x + cellWidth - 22},${y + 10}`} fill="#f59e0b" className="cursor-pointer" onClick={() => handleAddShape(r, c, 'diamond')} />
                        </g>
                        
                        {cellChildren.length === 0 && (
                          <text x={x + cellWidth / 2} y={y + cellHeight / 2} fontSize="9" fill="#6b7280" textAnchor="middle" dominantBaseline="middle">
                            Hover to add shapes
                          </text>
                        )}
                      </g>
                    ) : (
                      <>
                        <rect
                          x={x}
                          y={y}
                          width={cellWidth}
                          height={cellHeight}
                          fill={isEditing ? '#eff6ff' : isHeader ? '#f8fafc' : 'white'}
                          stroke={config.borderColor || '#e2e8f0'}
                          strokeWidth="1"
                          className={`table-cell ${isSelected ? 'selected' : ''} ${isHeader ? 'header' : ''} cursor-pointer`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleCellDoubleClick(r, c);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(e, r, c);
                          }}
                          style={{ pointerEvents: 'all' }}
                        />
                        {!isEditing && (
                          <text
                            x={getTextX(x, cellWidth)}
                            y={y + cellHeight / 2 + 4}
                            fontSize={style.fontSize || 12}
                            fill={style.textColor || '#1e293b'}
                            textAnchor={getTextAnchor()}
                            className={`table-text ${isHeader ? 'header' : ''}`}
                          >
                            {cell}
                          </text>
                        )}
                      </>
                    )}
                  </g>
                );
              })
            )}
            
            {/* Resize handles */}
            {columnWidths.map((width, i) => {
              const x = columnWidths.slice(0, i + 1).reduce((sum, w) => sum + w, 0);
              return (
                <rect
                  key={`col-resize-${i}`}
                  x={x - 2}
                  y={0}
                  width={4}
                  height={totalHeight}
                  fill="rgba(59, 130, 246, 0.3)"
                  className={`resize-handle cursor-col-resize hover:fill-blue-500 ${isResizing && resizeType === 'column' && resizeIndex === i ? 'fill-blue-600' : ''}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeStart(e, 'column', i);
                  }}
                  style={{ pointerEvents: 'all' }}
                />
              );
            })}
            
            {rowHeights.map((height, i) => {
              const y = rowHeights.slice(0, i + 1).reduce((sum, h) => sum + h, 0);
              return (
                <rect
                  key={`row-resize-${i}`}
                  x={0}
                  y={y - 2}
                  width={totalWidth}
                  height={4}
                  fill="rgba(59, 130, 246, 0.3)"
                  className={`resize-handle cursor-row-resize hover:fill-blue-500 ${isResizing && resizeType === 'row' && resizeIndex === i ? 'fill-blue-600' : ''}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeStart(e, 'row', i);
                  }}
                  style={{ pointerEvents: 'all' }}
                />
              );
            })}
            </svg>
          </div>
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
            left: getCellPosition(editingCell.row, editingCell.col).x + 40,
            top: getCellPosition(editingCell.row, editingCell.col).y + 80,
            width: columnWidths[editingCell.col] - 4,
            height: rowHeights[editingCell.row] - 4,
          }}
        />
      )}

      {/* Simple table controls */}
      {config.containerMode && (
        <div className="absolute -top-8 left-0 flex gap-1 text-xs">
          <button onClick={handleAddRow} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+Row</button>
          <button onClick={handleAddColumn} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">+Col</button>
        </div>
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
    </DndContext>
  );
}