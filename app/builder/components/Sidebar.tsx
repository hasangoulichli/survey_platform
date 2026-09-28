import React from 'react';
import { Type, Star, CheckSquare, SlidersHorizontal, AlignLeft } from 'lucide-react';

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 shadow-sm z-20">
      <h3 className="font-semibold text-gray-700 mb-2 border-b pb-2">Soru Tipleri</h3>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100"
           onDragStart={(event) => onDragStart(event, 'rating', 'Puanlama')} draggable>
        <Star size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Puanlama</span>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100"
           onDragStart={(event) => onDragStart(event, 'text', 'Açık Metin')} draggable>
        <Type size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Açık Metin</span>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100"
           onDragStart={(event) => onDragStart(event, 'checkbox', 'Çoklu Seçim')} draggable>
        <CheckSquare size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Çoklu Seçim</span>
      </div>

    {/* YENİ: Slider Aracı */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100"
           onDragStart={(event) => onDragStart(event, 'slider', 'Kaydırıcı (0-100)')} draggable>
        <SlidersHorizontal size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Kaydırıcı (0-100)</span>
      </div>

      {/* YENİ: Vinyet / Metin Bloğu Aracı */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100"
           onDragStart={(event) => onDragStart(event, 'vignette', 'Metin Bloğu / Vinyet')} draggable>
        <AlignLeft size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Metin Bloğu</span>
      </div>
    </div>
  );
}