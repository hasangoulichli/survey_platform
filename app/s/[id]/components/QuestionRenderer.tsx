import React from 'react';
import { Star, Upload, BookOpen } from 'lucide-react';

export default function QuestionRenderer({ el, answer, onChange, assignedVariation }: any) {
  const type = el.type;

  // 1. VİNYET / SENARYO METNİ (Sorun Buradaydı, vignette_text eklendi)
  if (type === 'vignette' || type === 'vignette_text') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl text-gray-900 leading-relaxed text-justify text-base shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-sm">
           <BookOpen size={18} /> Araştırma Senaryosu
        </div>
        {/* el.text yeni sistemden, assignedVariation eski sistemden gelir */}
        {el.text || assignedVariation || <span className="text-gray-400 italic">Senaryo metni bulunamadı...</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SORU BAŞLIĞI */}
      <h3 className="text-lg font-medium text-gray-900 leading-snug">
        {el.title} {el.required && <span className="text-red-500 font-bold">*</span>}
      </h3>

      {/* 2. KISA VE UZUN METİN */}
      {type === 'short_text' && <input type="text" className="w-full md:w-1/2 border border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none" value={answer || ''} onChange={e => onChange(e.target.value)} />}
      {type === 'paragraph' && <textarea className="w-full border border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none" rows={4} value={answer || ''} onChange={e => onChange(e.target.value)} />}

      {/* 3. SEÇMELİ SORULAR (Tekli ve Çoklu) */}
      {(type === 'multiple_choice' || type === 'checkboxes') && (
        <div className="flex flex-col gap-3">
          {el.choices?.map((c: string, i: number) => (
            <label key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition border border-transparent hover:border-gray-200">
              <input type={type === 'multiple_choice' ? 'radio' : 'checkbox'} name={el.id} className="w-5 h-5 accent-indigo-600 cursor-pointer"
                checked={type === 'multiple_choice' ? answer === c : (answer || []).includes(c)}
                onChange={(e) => {
                  if (type === 'multiple_choice') onChange(c);
                  else {
                    const curr = answer || [];
                    onChange(e.target.checked ? [...curr, c] : curr.filter((x: any) => x !== c));
                  }
                }}
              />
              <span className="text-gray-900 font-medium">{c}</span>
            </label>
          ))}
        </div>
      )}

      {/* 4. AÇILIR MENÜ (Dropdown) */}
      {type === 'dropdown' && (
        <select className="w-full md:w-1/2 border border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none" value={answer || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Seçiniz...</option>
          {el.choices?.map((c: string, i: number) => <option key={i} value={c}>{c}</option>)}
        </select>
      )}

      {/* 5. DOĞRUSAL ÖLÇEK (Likert) */}
      {type === 'linear_scale' && (
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between w-full mt-2">
          <span className="text-gray-700 font-medium text-center md:text-left">{el.scaleConfig?.minLabel}</span>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({length: (el.scaleConfig?.max || 5) - (el.scaleConfig?.min || 1) + 1}).map((_, i) => {
              const val = i + (el.scaleConfig?.min || 1);
              const isSelected = answer === val;
              return (
                <button key={val} onClick={() => onChange(val)} className={`w-12 h-12 rounded-full border-2 font-bold transition ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'}`}>
                  {val}
                </button>
              );
            })}
          </div>
          <span className="text-gray-700 font-medium text-center md:text-right">{el.scaleConfig?.maxLabel}</span>
        </div>
      )}

      {/* 6. TABLOLAR (Grid) */}
      {(type === 'multiple_choice_grid' || type === 'tickbox_grid') && (
        <div className="overflow-x-auto w-full border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse min-w-150 bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3"></th>
                {el.gridConfig?.columns?.map((c: string, i: number) => <th key={i} className="p-3 text-center text-sm font-semibold text-gray-700">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {el.gridConfig?.rows?.map((r: string, rIndex: number) => (
                <tr key={rIndex} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-medium text-gray-900 w-1/3">{r}</td>
                  {el.gridConfig?.columns?.map((c: string, cIndex: number) => (
                    <td key={cIndex} className="p-4 text-center">
                      <input type={type === 'multiple_choice_grid' ? 'radio' : 'checkbox'} name={`${el.id}_${rIndex}`} className="w-5 h-5 accent-indigo-600 cursor-pointer"
                        checked={type === 'multiple_choice_grid' ? (answer?.[r] === c) : (answer?.[r] || []).includes(c)}
                        onChange={(e) => {
                          const curr = answer || {};
                          if (type === 'multiple_choice_grid') onChange({...curr, [r]: c});
                          else {
                            const rowArr = curr[r] || [];
                            onChange({...curr, [r]: e.target.checked ? [...rowArr, c] : rowArr.filter((x: any) => x !== c)});
                          }
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. PUANLAMA (Yıldız) */}
      {type === 'rating' && (
        <div className="flex gap-2 justify-center md:justify-start">
          {Array.from({length: el.ratingConfig?.max || 5}).map((_, i) => (
            <Star key={i} size={36} className={`cursor-pointer transition hover:scale-110 ${answer && answer > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => onChange(i + 1)}/>
          ))}
        </div>
      )}

      {/* 8. DOSYA YÜKLEME */}
      {type === 'file_upload' && (
        <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition bg-white w-full md:w-1/2">
          <Upload size={32} className="text-indigo-500"/>
          <span className="text-sm font-medium text-gray-600">Dosya yüklemek için tıklayın (Yakında)</span>
          <input type="file" className="hidden" disabled />
        </label>
      )}
    </div>
  );
}