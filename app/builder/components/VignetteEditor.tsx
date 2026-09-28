import React from 'react';
import { Trash2, Plus, Circle, BookOpen } from 'lucide-react';

export default function VignetteEditor({ el, updateElement }: any) {
  // Eski düz metin formatını yeni objeli (sorulu) formata çevirme koruması
  const variations = (el.variations || []).map((v: any) => 
    typeof v === 'string' ? { id: crypto.randomUUID(), text: v, questions: [] } : v
  );

  const handleChange = (newVars: any[]) => updateElement(el.id, 'variations', newVars);

  const addVariation = () => handleChange([...variations, { id: crypto.randomUUID(), text: '', questions: [] }]);
  
  const addQuestion = (vIndex: number) => {
    const newVars = [...variations];
    newVars[vIndex].questions.push({ id: crypto.randomUUID(), title: '', choices: ['Seçenek 1', 'Seçenek 2'] });
    handleChange(newVars);
  };

  const updateQuestion = (vIndex: number, qIndex: number, key: string, val: any) => {
    const newVars = [...variations];
    newVars[vIndex].questions[qIndex][key] = val;
    handleChange(newVars);
  };

  return (
    <div className="flex flex-col gap-5 bg-blue-50 p-5 rounded-lg border border-blue-200 shadow-inner">
      <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><BookOpen size={18}/> Varyasyon Yöneticisi</p>
      
      {variations.map((v: any, vIndex: number) => (
        <div key={v.id} className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-black text-indigo-700">Varyasyon {vIndex + 1}</span>
            {variations.length > 1 && <button onClick={() => handleChange(variations.filter((_:any, i:number) => i !== vIndex))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>}
          </div>
          
          <textarea 
            value={v.text} 
            onChange={(e) => { const n = [...variations]; n[vIndex].text = e.target.value; handleChange(n); }} 
            className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
            rows={3} placeholder="Senaryo metnini buraya yazın..."
          />

          {/* VARYASYONA ÖZEL SORULAR */}
          {v.questions?.map((q: any, qIndex: number) => (
            <div key={q.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 ml-4 border-l-4 border-l-indigo-400">
              <div className="flex items-center justify-between mb-2">
                <input 
                  type="text" value={q.title} placeholder="Soru metni (Örn: Ahmet ne yaptı?)"
                  onChange={(e) => updateQuestion(vIndex, qIndex, 'title', e.target.value)}
                  className="flex-1 bg-transparent border-b border-gray-300 focus:border-indigo-600 outline-none text-sm font-bold text-gray-800 pb-1"
                />
                <button onClick={() => { const n = [...variations]; n[vIndex].questions.splice(qIndex, 1); handleChange(n); }} className="text-gray-400 hover:text-red-500 ml-2"><Trash2 size={14}/></button>
              </div>
              
              <div className="flex flex-col gap-1 mt-2">
                {q.choices.map((choice: string, cIndex: number) => (
                  <div key={cIndex} className="flex items-center gap-2">
                    <Circle size={14} className="text-gray-300"/>
                    <input 
                      type="text" value={choice} placeholder={`Seçenek ${cIndex + 1}`}
                      onChange={(e) => { const c = [...q.choices]; c[cIndex] = e.target.value; updateQuestion(vIndex, qIndex, 'choices', c); }}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none text-sm text-gray-700"
                    />
                  </div>
                ))}
                <button onClick={() => updateQuestion(vIndex, qIndex, 'choices', [...q.choices, 'Yeni Seçenek'])} className="text-indigo-600 text-xs font-bold mt-1 text-left hover:underline">Seçenek Ekle</button>
              </div>
            </div>
          ))}
          <button onClick={() => addQuestion(vIndex)} className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-md text-sm font-bold mt-1 self-start transition flex items-center gap-1"><Plus size={14}/> Soru Ekle</button>
        </div>
      ))}
      <button onClick={addVariation} className="text-blue-700 bg-blue-100 hover:bg-blue-200 py-2.5 rounded-md text-sm font-bold mt-2 transition shadow-sm border border-blue-200">Yeni Varyasyon Ekle</button>
    </div>
  );
}