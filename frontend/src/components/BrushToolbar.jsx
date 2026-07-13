import React from 'react';
import { Undo, Redo, Trash2, Paintbrush, Eraser, PaintBucket } from 'lucide-react';

const COLORS = [
  '#000000', '#7F7F7F', '#880015', '#ED1C24', '#FF7F27', '#FFF200', '#22B14C', '#00A2E8', '#3F48CC', '#A349A4',
  '#FFFFFF', '#C3C3C3', '#B97A57', '#FFAEC9', '#FFC90E', '#EFE4B0', '#B5E61D', '#99D9EA', '#7092BE', '#C8BFE7',
  '#FF5555', '#55FF55', '#55FFFF', '#FF55FF'
];

const BRUSH_SIZES = [
  { size: 2, label: 'S' },
  { size: 5, label: 'M' },
  { size: 8, label: 'L' },
  { size: 12, label: 'XL' },
  { size: 20, label: 'XXL' }
];

export default function BrushToolbar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  tool,
  setTool
}) {
  const triggerUndo = () => window.dispatchEvent(new CustomEvent('canvas-undo'));
  const triggerRedo = () => window.dispatchEvent(new CustomEvent('canvas-redo'));
  const triggerClear = () => window.dispatchEvent(new CustomEvent('canvas-clear'));

  return (
    <div className="flex flex-col gap-4 p-4 glass-card rounded-xl border border-white/10 shadow-lg text-white">
      {/* Tools & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
        <div className="flex gap-1">
          <button
            onClick={() => setTool('brush')}
            className={`p-2 rounded-lg transition ${tool === 'brush' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
            title="Brush"
          >
            <Paintbrush className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition ${tool === 'eraser' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
            title="Eraser"
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('fill')}
            className={`p-2 rounded-lg transition ${tool === 'fill' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
            title="Flood Fill"
          >
            <PaintBucket className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1">
          <button
            onClick={triggerUndo}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={triggerRedo}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>
          <button
            onClick={triggerClear}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition"
            title="Clear Canvas"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Brush Size Picker */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-300">Brush Size</span>
        <div className="flex justify-between items-center gap-1 bg-black/25 p-1 rounded-lg">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.size}
              onClick={() => setBrushSize(b.size)}
              className={`flex-1 py-1 text-xs font-bold rounded-md transition ${
                brushSize === b.size ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {b.label} ({b.size}px)
            </button>
          ))}
        </div>
      </div>

      {/* Colors Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300">Color Palette</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Custom:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => {
                setBrushColor(e.target.value);
                if (tool === 'eraser') setTool('brush');
              }}
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1.5 p-2 bg-black/20 rounded-lg">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setBrushColor(c);
                if (tool === 'eraser') setTool('brush');
              }}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-md border border-black/40 hover:scale-110 active:scale-95 transition-transform ${
                brushColor === c && tool !== 'eraser' ? 'ring-2 ring-purple-400 scale-105' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
