import React, { useMemo } from 'react';
import { Star, Upload, BookOpen } from 'lucide-react';

const formatText = (text: string) => {
  if (!text || typeof text !== 'string') return { __html: '' };
  let html = text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>');
  return { __html: html };
};

// YENİ: FISHER-YATES KARIŞTIRICI FONKSİYONU
const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function QuestionRenderer({ el, answer, onChange, assignedVariation }: any) {
  const type = el.type;

  // YENİ: EĞER KARIŞTIRMA İSTENMİŞSE, ŞIKLARI VEYA SATIRLARI SADECE BİR KERE (useMemo ile) KARIŞTIR
  const displayChoices = useMemo(() => {
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(type) && el.shuffleOptions && el.choices) {
      return shuffleArray(el.choices);
    }
    return el.choices || [];
  }, [el.choices, el.shuffleOptions, type]);

  const displayRows = useMemo(() => {
    if (['multiple_choice_grid', 'tickbox_grid'].includes(type) && el.shuffleOptions && el.gridConfig?.rows) {
      return shuffleArray(el.gridConfig.rows);
    }
    return el.gridConfig?.rows || [];
  }, [el.gridConfig?.rows, el.shuffleOptions, type]);


  if (type === 'vignette' || type === 'vignette_text') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl text-gray-900 leading-relaxed text-justify text-base shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-sm"><BookOpen size={18} /> Araştırma Senaryosu</div>
        <div dangerouslySetInnerHTML={formatText(el.text || assignedVariation || 'Senaryo metni bulunamadı...')} />
      </div>
    );
  }

  if (type === 'info_block') {
    return (
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {el.title && <h2 className="text-xl font-bold text-gray-900" dangerouslySetInnerHTML={formatText(el.title)} />}
        {el.description && <div className="text-gray-700 leading-relaxed text-justify" dangerouslySetInnerHTML={formatText(el.description)} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-gray-900 leading-snug">
        <span dangerouslySetInnerHTML={formatText(el.title)} /> {el.required && <span className="text-red-500 font-bold">*</span>}
      </h3>

      {type === 'short_text' && <input type="text" className="w-full md:w-1/2 border border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none" value={answer || ''} onChange={e => onChange(e.target.value)} />}
      {type === 'paragraph' && <textarea className="w-full border border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none" rows={4} value={answer || ''} onChange={e => onChange(e.target.value)} />}

      {/* YENİ: displayChoices KULLANILIYOR */}
      {(type === 'multiple_choice' || type === 'checkboxes') && (
        <div className="flex flex-col gap-3">
          {displayChoices.map((c: string, i: number) => (
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
              <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={formatText(c)} />
            </label>
          ))}
        </div>
      )}

      {/* YENİ: displayChoices KULLANILIYOR */}
      {type === 'dropdown' && (
        <select className="w-full md:w-1/2 border border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none" value={answer || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Seçiniz...</option>
          {displayChoices.map((c: string, i: number) => <option key={i} value={c}>{c}</option>)}
        </select>
      )}

      {type === 'linear_scale' && (
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between w-full mt-2">
          <span className="text-gray-700 font-medium text-center md:text-left" dangerouslySetInnerHTML={formatText(el.scaleConfig?.minLabel)} />
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({length: (el.scaleConfig?.max || 5) - (el.scaleConfig?.min || 1) + 1}).map((_, i) => {
              const val = i + (el.scaleConfig?.min || 1);
              return (
                <button key={val} onClick={() => onChange(val)} className={`w-12 h-12 rounded-full border-2 font-bold transition ${answer === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'}`}>
                  {val}
                </button>
              );
            })}
          </div>
          <span className="text-gray-700 font-medium text-center md:text-right" dangerouslySetInnerHTML={formatText(el.scaleConfig?.maxLabel)} />
        </div>
      )}

      {type === 'slider' && (
        <div className="flex flex-col gap-4 px-2 mt-2 w-full md:w-3/4">
          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-bold text-sm" dangerouslySetInnerHTML={formatText(el.sliderConfig?.minLabel || el.sliderConfig?.min?.toString() || '0')} />
            <input type="range" min={el.sliderConfig?.min || 0} max={el.sliderConfig?.max || 100} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={answer !== undefined ? answer : (el.sliderConfig?.min || 0)} onChange={(e) => onChange(parseInt(e.target.value))} />
            <span className="text-gray-500 font-bold text-sm" dangerouslySetInnerHTML={formatText(el.sliderConfig?.maxLabel || el.sliderConfig?.max?.toString() || '100')} />
          </div>
          <div className="text-center font-black text-indigo-600 text-3xl">{answer !== undefined ? answer : (el.sliderConfig?.min || 0)}</div>
        </div>
      )}

      {(type === 'multiple_choice_grid' || type === 'tickbox_grid') && (
        <div className="overflow-x-auto w-full border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse min-w-150 bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3"></th>
                {el.gridConfig?.columns?.map((c: string, i: number) => <th key={i} className="p-3 text-center text-sm font-semibold text-gray-700"><span dangerouslySetInnerHTML={formatText(c)}/></th>)}
              </tr>
            </thead>
            <tbody>
              {/* YENİ: displayRows KULLANILIYOR */}
              {displayRows.map((r: string, rIndex: number) => (
                <tr key={rIndex} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-medium text-gray-900 w-1/3"><span dangerouslySetInnerHTML={formatText(r)}/></td>
                  {el.gridConfig?.columns?.map((c: string, cIndex: number) => (
                    <td key={cIndex} className="text-center p-3">
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

      {type === 'rating' && (
        <div className="flex gap-2 justify-center md:justify-start">
          {Array.from({length: el.ratingConfig?.max || 5}).map((_, i) => <Star key={i} size={36} className={`cursor-pointer transition hover:scale-110 ${answer && answer > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => onChange(i + 1)}/>)}
        </div>
      )}
      {type === 'file_upload' && (
        <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition bg-white w-full md:w-1/2">
          <Upload size={32} className="text-indigo-500"/><span className="text-sm font-medium text-gray-600">Dosya yüklemek için tıklayın (Yakında)</span><input type="file" className="hidden" disabled />
        </label>
      )}
    </div>
  );
}