import React, { useState } from 'react';
import { ProtocolBlock, BlockType } from '../types';
import { Trash2, Plus, ChevronRight, ChevronDown, GripVertical, Box, List, Cpu, FileType } from 'lucide-react';

interface BlockItemProps {
  block: ProtocolBlock;
  depth: number;
  onUpdate: (id: string, updates: Partial<ProtocolBlock>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onMove: (dragId: string, targetId: string) => void;
}

const getIcon = (type: BlockType) => {
  switch (type) {
    case BlockType.Struct: return <Box size={16} className="text-blue-400" />;
    case BlockType.List: return <List size={16} className="text-purple-400" />;
    case BlockType.Bitfield: return <Cpu size={16} className="text-orange-400" />;
    default: return <FileType size={16} className="text-green-400" />;
  }
};

export const BlockItem: React.FC<BlockItemProps> = ({ block, depth, onUpdate, onDelete, onAddChild, onMove }) => {
  const [expanded, setExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const isContainer = [BlockType.Struct, BlockType.List, BlockType.Bitfield].includes(block.type);
  const isBitfieldChild = block.type === BlockType.Bit;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate(block.id, { [name]: name === 'length' || name === 'bitSize' ? Number(value) : value });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: block.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.id && data.id !== block.id) {
        onMove(data.id, block.id);
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  return (
    <div 
      className={`flex flex-col select-none ${isDragOver ? 'border-t-2 border-blue-500' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className={`group flex items-center gap-2 p-2 rounded mb-1 border border-transparent hover:border-gray-700 hover:bg-gray-800 transition-colors ${depth === 0 ? 'bg-gray-800/50' : ''}`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {/* Expand/Collapse for Containers */}
        {isContainer ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-4" /> 
        )}

        <div className="text-gray-600 cursor-move cursor-grab active:cursor-grabbing"><GripVertical size={14} /></div>
        
        {/* Icon */}
        <div className="p-1 rounded bg-gray-900/50">{getIcon(block.type)}</div>

        {/* Name Input */}
        <input
          type="text"
          name="name"
          value={block.name}
          onChange={handleChange}
          className="bg-transparent text-sm font-medium text-gray-200 focus:outline-none focus:border-b border-blue-500 w-32 placeholder-gray-600"
          placeholder="Field Name"
        />

        {/* Type Select */}
        <select
          name="type"
          value={block.type}
          onChange={handleChange}
          className="bg-gray-900 text-xs text-gray-400 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
        >
          {Object.values(BlockType).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Extra Fields based on type */}
        {block.type === BlockType.String && (
           <input
           type="number"
           name="length"
           value={block.length || ''}
           onChange={handleChange}
           placeholder="Len (opt)"
           className="w-16 bg-gray-900 text-xs text-gray-300 rounded px-2 py-1 border border-gray-700"
         />
        )}
        {(block.type === BlockType.Bit || isBitfieldChild) && (
           <input
           type="number"
           name="bitSize"
           value={block.bitSize || 1}
           onChange={handleChange}
           placeholder="Bits"
           className="w-12 bg-gray-900 text-xs text-gray-300 rounded px-2 py-1 border border-gray-700"
         />
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isContainer && (
            <button 
              onClick={() => { setExpanded(true); onAddChild(block.id); }}
              className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded"
              title="Add Child"
            >
              <Plus size={14} />
            </button>
          )}
          <button 
            onClick={() => onDelete(block.id)}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
            title="Delete Block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children Rendering */}
      {isContainer && expanded && block.children && (
        <div className="flex flex-col border-l border-gray-700 ml-4 mb-2">
          {block.children.map(child => (
            <BlockItem 
              key={child.id} 
              block={child} 
              depth={depth + 1} 
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
            />
          ))}
          {block.children.length === 0 && (
             <div className="text-xs text-gray-600 italic ml-6 p-2">Empty container. Add fields.</div>
          )}
        </div>
      )}
    </div>
  );
};
