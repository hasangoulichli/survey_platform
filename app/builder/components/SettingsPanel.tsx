import React from 'react';
import { Node } from 'reactflow';
import { Trash2, Plus, AlignLeft } from 'lucide-react';

interface SettingsPanelProps {
  selectedNode: Node;
  updateNodeData: (key: string, value: any) => void;
  closePanel: () => void;
}

export default function SettingsPanel({ selectedNode, updateNodeData, closePanel }: SettingsPanelProps) {
  const isChoiceQuestion = selectedNode.data.questionType === 'checkbox' || selectedNode.data.questionType === 'radio';
  const isVignette = selectedNode.data.questionType === 'vignette';
  
  const choices: string[] = selectedNode.data.choices || [];
  // Vinyet ise varyasyonları al, yoksa varsayılan metni ilk varyasyon yap
  const variations: string[] = selectedNode.data.variations || [selectedNode.data.label];

  const handleChoiceChange = (index: number, newValue: string) => {
    const newChoices = [...choices];
    newChoices[index] = newValue;
    updateNodeData('choices', newChoices);
  };

  const handleVariationChange = (index: number, newValue: string) => {
    const newVars = [...variations];
    newVars[index] = newValue;
    updateNodeData('variations', newVars);
    if (index === 0) updateNodeData('label', newValue); // Tuvalde ilk varyasyon görünsün
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col shadow-lg z-20 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="font-bold text-gray-800">
          {isVignette ? 'Vinyet / Senaryo Ayarları' : 'Soru Ayarları'}
        </h3>
        <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
      </div>

      <div className="flex flex-col gap-5">
        
        {/* STANDART SORULAR İÇİN METİN ALANI */}
        {!isVignette && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Soru Metni</label>
            <textarea 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              value={selectedNode.data.label}
              onChange={(e) => updateNodeData('label', e.target.value)}
            />
          </div>
        )}

        {/* VINYETLER (SENARYOLAR) İÇİN VARYASYON ALANI */}
        {isVignette && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <p className="text-xs text-blue-700 mb-4 font-medium flex items-center gap-2">
              <AlignLeft size={14}/> Sistem bu senaryolardan sadece birini katılımcıya rastgele gösterecektir.
            </p>
            <div className="flex flex-col gap-4">
              {variations.map((variation, index) => (
                <div key={index} className="flex flex-col gap-1 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600">Varyasyon {index + 1}</label>
                    {variations.length > 1 && (
                      <button onClick={() => {
                        const newVars = variations.filter((_, i) => i !== index);
                        updateNodeData('variations', newVars);
                      }} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={variation}
                    onChange={(e) => handleVariationChange(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows={4}
                    placeholder="Senaryo metnini buraya girin..."
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={() => updateNodeData('variations', [...variations, `Yeni Senaryo Varyasyonu`])}
              className="mt-4 flex items-center justify-center gap-1 w-full py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition"
            >
              <Plus size={16} /> Yeni Varyasyon Ekle
            </button>
          </div>
        )}

        {/* ZORUNLU SORU (Vinyet değilse göster) */}
        {!isVignette && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
            <span className="text-sm font-medium text-gray-700">Zorunlu Soru</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              checked={selectedNode.data.required || false}
              onChange={(e) => updateNodeData('required', e.target.checked)}
            />
          </div>
        )}

        {/* ÇOKTAN SEÇMELİ ŞIKLAR */}
        {isChoiceQuestion && (
          <div className="mt-2 border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Seçenekler</label>
            <div className="flex flex-col gap-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button onClick={() => {
                    const newChoices = choices.filter((_, i) => i !== index);
                    updateNodeData('choices', newChoices);
                  }} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => updateNodeData('choices', [...choices, `Seçenek ${choices.length + 1}`])}
              className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition"
            >
              <Plus size={16} /> Seçenek Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}