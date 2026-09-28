import React from 'react';
import { Trash2, Plus, Circle, CheckSquare, ChevronDownSquare, Star, Upload, BookOpen } from 'lucide-react';
import VignetteEditor from './VignetteEditor';

// Yardımcı Formatlayıcı (WhatsApp Tarzı)
const formatText = (text: string) => {
  if (!text || typeof text !== 'string') return { __html: '' };
  let html = text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>');
  return { __html: html };
};

export default function ElementEditor({ el, updateElement, isSelected, elements }: any) {
  
  if (!isSelected) {
    // OKUMA (PREVIEW) MODU EKRANI
    return (
      <div className="flex flex-col gap-4">
        {el.type === 'page_break' ? (
          <div className="flex flex-col items-center">
            <div className="w-full border-t-4 border-indigo-600 rounded-t-md"></div>
            <div className="bg-indigo-50 w-full p-4 rounded-b-md">
              <h3 className="text-lg font-bold text-indigo-900 text-center" dangerouslySetInnerHTML={formatText(el.title || 'Yeni Bölüm')} />
            </div>
          </div>
        ) : el.type === 'info_block' ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-gray-900" dangerouslySetInnerHTML={formatText(el.title)} />
            <div className="text-gray-700 leading-relaxed text-sm" dangerouslySetInnerHTML={formatText(el.description)} />
          </div>
        ) : (
          <h3 className="text-base font-semibold text-gray-900">
            <span dangerouslySetInnerHTML={formatText(el.title || 'Soru metni girilmemiş')} />
            {el.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        )}
        
        {el.type === 'short_text' && <div className="border-b border-dotted border-gray-400 w-1/2 pb-2 text-gray-400 text-sm">Kısa yanıt metni</div>}
        {el.type === 'paragraph' && <div className="border-b border-dotted border-gray-400 w-full pb-6 text-gray-400 text-sm">Uzun yanıt metni</div>}
        
        {['multiple_choice', 'checkboxes'].includes(el.type) && (
          <div className="flex flex-col gap-3">
            {el.choices?.map((c: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                {el.type === 'multiple_choice' ? <Circle size={18} className="text-gray-400"/> : <CheckSquare size={18} className="text-gray-400"/>} <span dangerouslySetInnerHTML={formatText(c || `Seçenek ${i+1}`)} />
              </div>
            ))}
          </div>
        )}
        
        {el.type === 'dropdown' && (
          <div className="border border-gray-300 rounded p-3 text-gray-500 w-64 flex justify-between items-center bg-gray-50">
            <span>Seçiniz</span> <ChevronDownSquare size={18}/>
          </div>
        )}

        {el.type === 'linear_scale' && (
          <div className="flex items-center gap-6 text-sm text-gray-700 font-medium">
            <span dangerouslySetInnerHTML={formatText(el.scaleConfig?.minLabel)} />
            <div className="flex gap-2">
              {Array.from({length: (el.scaleConfig?.max || 5) - (el.scaleConfig?.min || 1) + 1}).map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center bg-gray-50 text-gray-900">{i + (el.scaleConfig?.min || 1)}</div>
              ))}
            </div>
            <span dangerouslySetInnerHTML={formatText(el.scaleConfig?.maxLabel)} />
          </div>
        )}

        {el.type === 'slider' && (
          <div className="flex items-center gap-4 w-full md:w-3/4">
            <span className="text-gray-500 text-sm font-bold" dangerouslySetInnerHTML={formatText(el.sliderConfig?.minLabel || el.sliderConfig?.min?.toString())} />
            <input type="range" disabled min={el.sliderConfig?.min || 0} max={el.sliderConfig?.max || 100} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none" />
            <span className="text-gray-500 text-sm font-bold" dangerouslySetInnerHTML={formatText(el.sliderConfig?.maxLabel || el.sliderConfig?.max?.toString())} />
          </div>
        )}

        {['multiple_choice_grid', 'tickbox_grid'].includes(el.type) && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th></th>
                  {el.gridConfig?.columns?.map((c: string, i: number) => <th key={i} className="font-medium text-gray-700 text-center p-2 min-w-20"><span dangerouslySetInnerHTML={formatText(c)}/></th>)}
                </tr>
              </thead>
              <tbody>
                {el.gridConfig?.rows?.map((r: string, rIndex: number) => (
                  <tr key={rIndex} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800"><span dangerouslySetInnerHTML={formatText(r)}/></td>
                    {el.gridConfig?.columns?.map((_: any, cIndex: any) => (
                      <td key={cIndex} className="text-center p-3">
                        {el.type === 'multiple_choice_grid' ? <Circle size={18} className="inline text-gray-300"/> : <CheckSquare size={18} className="inline text-gray-300"/>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {el.type === 'rating' && (
          <div className="flex gap-2 text-gray-300">
             {Array.from({length: el.ratingConfig?.max || 5}).map((_, i) => <Star key={i} size={28} fill="currentColor"/>)}
          </div>
        )}

        {el.type === 'file_upload' && (
          <div className="border border-gray-300 border-dashed rounded p-4 text-center text-gray-500 bg-gray-50 w-64 flex gap-2 items-center justify-center">
            <Upload size={18}/> Dosya Yükle
          </div>
        )}

        {el.type === 'vignette' && (
          <div className="text-sm text-blue-700 font-bold bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center gap-2">
            <BookOpen size={18}/> Sistem {el.variations?.length || 1} farklı senaryodan birini katılımcıya sunacak.
          </div>
        )}
      </div>
    );
  }

  // EDİT MODU EKRANI EKRANI
  return (
    <div className="flex flex-col gap-6">
      
      {['short_text', 'paragraph'].includes(el.type) && (
        <div className={`border-b border-dotted border-gray-400 pb-2 text-gray-400 ${el.type === 'short_text' ? 'w-1/2' : 'w-full'}`}>
          {el.type === 'short_text' ? 'Kısa yanıt metni' : 'Uzun yanıt metni'}
        </div>
      )}

      {/* Çoktan Seçmeli, Onay Kutuları, Açılır Menü */}
      {['multiple_choice', 'checkboxes', 'dropdown'].includes(el.type) && (
        <div className="flex flex-col gap-2">
          {el.choices?.map((choice: string, cIndex: number) => (
            <div key={cIndex} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {el.type === 'multiple_choice' ? <Circle size={20} className="text-gray-300"/> : el.type === 'checkboxes' ? <CheckSquare size={20} className="text-gray-300"/> : <span className="text-gray-400 font-bold w-5">{cIndex + 1}.</span>}
                <input 
                  type="text" value={choice} 
                  onChange={(e) => {
                    const newChoices = [...el.choices];
                    let newLogicMap = { ...(el.logicMap || {}) };
                    if (el.logicMap && el.logicMap[choice]) {
                      newLogicMap[e.target.value] = el.logicMap[choice];
                      delete newLogicMap[choice];
                    }
                    newChoices[cIndex] = e.target.value;
                    // BuilderCanvas'taki updateElement mantığı gereği 'id', 'key', 'value' bekler.
                    // Toplu güncelleme için özel bir şey yazmadık ama updateElement'i böyle çağırmamız işe yaramayabilir.
                    // Not: Bu karmaşayı önlemek için elements'i BuilderCanvas yönetiyor.
                    // Şimdilik sadece choices güncelleniyor. LogicMap eşitlemesi bir sonraki adımda ana dosyaya çekilecek.
                    updateElement(el.id, 'choices', newChoices); 
                  }}
                  className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none py-1 text-gray-900"
                  placeholder={`Seçenek ${cIndex + 1}`}
                />
                {el.choices.length > 1 && (
                  <button onClick={() => updateElement(el.id, 'choices', el.choices.filter((_:any, i:number) => i !== cIndex))} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                )}
              </div>
              
              {el.logicEnabled && ['multiple_choice', 'dropdown'].includes(el.type) && (
                <div className="ml-8 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">↳ Şunu yap:</span>
                  <select 
                    value={el.logicMap?.[choice] || 'next'}
                    onChange={(e) => {
                      const newLogicMap = { ...(el.logicMap || {}) };
                      newLogicMap[choice] = e.target.value;
                      updateElement(el.id, 'logicMap', newLogicMap);
                    }}
                    className="text-xs border border-gray-300 rounded p-1.5 text-gray-700 bg-gray-50 outline-none focus:border-indigo-500"
                  >
                    <option value="next">Sonraki Bölüme Geç</option>
                    <option value="submit">Anketi Gönder</option>
                    {elements.filter((e: any) => e.type === 'page_break').map((pb: any, i: number) => (
                      <option key={pb.id} value={pb.id}>Bölüm: {pb.title || `İsimsiz Bölüm ${i+1}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 mt-2">
            <Plus size={20} className="text-gray-400"/>
            <button onClick={() => updateElement(el.id, 'choices', [...el.choices, `Seçenek ${el.choices.length + 1}`])} className="text-indigo-600 text-sm font-bold hover:underline">
              Seçenek Ekle
            </button>
          </div>
        </div>
      )}

      {/* Doğrusal Ölçek (Likert) */}
      {el.type === 'linear_scale' && (
        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <select value={el.scaleConfig?.min || 1} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, min: parseInt(e.target.value)})} className="border p-2 rounded text-gray-900">
              <option value={0}>0</option>
              <option value={1}>1</option>
            </select>
            <span className="text-gray-600 font-medium">ile</span>
            <select value={el.scaleConfig?.max || 5} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, max: parseInt(e.target.value)})} className="border p-2 rounded text-gray-900">
              {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-gray-600 font-medium">Arası</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center font-bold text-gray-500">{el.scaleConfig?.min || 1}</span>
              <input type="text" placeholder="Alt Sınır Etiketi (Örn: Hiç Katılmıyorum)" value={el.scaleConfig?.minLabel || ''} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, minLabel: e.target.value})} className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none py-1 bg-transparent text-gray-900"/>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-center font-bold text-gray-500">{el.scaleConfig?.max || 5}</span>
              <input type="text" placeholder="Üst Sınır Etiketi (Örn: Tamamen Katılıyorum)" value={el.scaleConfig?.maxLabel || ''} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, maxLabel: e.target.value})} className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none py-1 bg-transparent text-gray-900"/>
            </div>
          </div>
        </div>
      )}

      {/* Kaydırıcı (Slider) */}
      {el.type === 'slider' && (
        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700">Aralık:</span>
            <input type="number" value={el.sliderConfig?.min || 0} onChange={(e) => updateElement(el.id, 'sliderConfig', {...el.sliderConfig, min: parseInt(e.target.value)})} className="border p-2 rounded w-20 text-gray-900" placeholder="Min" />
            <span className="text-gray-500 font-medium">-</span>
            <input type="number" value={el.sliderConfig?.max || 100} onChange={(e) => updateElement(el.id, 'sliderConfig', {...el.sliderConfig, max: parseInt(e.target.value)})} className="border p-2 rounded w-20 text-gray-900" placeholder="Max" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs font-bold text-gray-500 uppercase">Alt Etiket</span>
              <input type="text" placeholder="Örn: Hiç" value={el.sliderConfig?.minLabel || ''} onChange={(e) => updateElement(el.id, 'sliderConfig', {...el.sliderConfig, minLabel: e.target.value})} className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none py-1 bg-transparent text-gray-900"/>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs font-bold text-gray-500 uppercase">Üst Etiket</span>
              <input type="text" placeholder="Örn: Çok" value={el.sliderConfig?.maxLabel || ''} onChange={(e) => updateElement(el.id, 'sliderConfig', {...el.sliderConfig, maxLabel: e.target.value})} className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none py-1 bg-transparent text-gray-900"/>
            </div>
          </div>
        </div>
      )}

      {/* Tablolar (Multiple Choice Grid & Tickbox Grid) */}
      {['multiple_choice_grid', 'tickbox_grid'].includes(el.type) && (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Satırlar */}
          <div className="flex-1 flex flex-col gap-2">
            <h4 className="font-bold text-gray-700 mb-2">Satırlar</h4>
            {el.gridConfig?.rows?.map((row: string, rIndex: number) => (
              <div key={rIndex} className="flex items-center gap-2">
                <span className="text-gray-400 font-bold w-5">{rIndex + 1}.</span>
                <input 
                  type="text" value={row} 
                  onChange={(e) => {
                    const newRows = [...el.gridConfig.rows];
                    newRows[rIndex] = e.target.value;
                    updateElement(el.id, 'gridConfig', {...el.gridConfig, rows: newRows});
                  }}
                  className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none py-1 text-gray-900"
                  placeholder={`Satır ${rIndex + 1}`}
                />
                {el.gridConfig.rows.length > 1 && <button onClick={() => updateElement(el.id, 'gridConfig', {...el.gridConfig, rows: el.gridConfig.rows.filter((_:any, i:number) => i !== rIndex)})} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>}
              </div>
            ))}
            <button onClick={() => updateElement(el.id, 'gridConfig', {...el.gridConfig, rows: [...el.gridConfig.rows, `Satır ${el.gridConfig.rows.length + 1}`]})} className="text-indigo-600 text-sm font-bold mt-2 hover:underline text-left">Satır Ekle</button>
          </div>
          
          {/* Sütunlar */}
          <div className="flex-1 flex flex-col gap-2 border-l border-gray-200 pl-8">
            <h4 className="font-bold text-gray-700 mb-2">Sütunlar</h4>
            {el.gridConfig?.columns?.map((col: string, cIndex: number) => (
              <div key={cIndex} className="flex items-center gap-2">
                {el.type === 'multiple_choice_grid' ? <Circle size={16} className="text-gray-300"/> : <CheckSquare size={16} className="text-gray-300"/>}
                <input 
                  type="text" value={col} 
                  onChange={(e) => {
                    const newCols = [...el.gridConfig.columns];
                    newCols[cIndex] = e.target.value;
                    updateElement(el.id, 'gridConfig', {...el.gridConfig, columns: newCols});
                  }}
                  className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none py-1 text-gray-900"
                  placeholder={`Sütun ${cIndex + 1}`}
                />
                {el.gridConfig.columns.length > 1 && <button onClick={() => updateElement(el.id, 'gridConfig', {...el.gridConfig, columns: el.gridConfig.columns.filter((_:any, i:number) => i !== cIndex)})} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>}
              </div>
            ))}
            <button onClick={() => updateElement(el.id, 'gridConfig', {...el.gridConfig, columns: [...el.gridConfig.columns, `Sütun ${el.gridConfig.columns.length + 1}`]})} className="text-indigo-600 text-sm font-bold mt-2 hover:underline text-left">Sütun Ekle</button>
          </div>
        </div>
      )}

      {/* Puanlama (Yıldız) */}
      {el.type === 'rating' && (
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-medium">Maksimum Yıldız Sayısı:</span>
          <select value={el.ratingConfig?.max || 5} onChange={(e) => updateElement(el.id, 'ratingConfig', { max: parseInt(e.target.value) })} className="border border-gray-300 rounded p-2 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value={5}>5 Yıldız</option>
            <option value={10}>10 Yıldız</option>
          </select>
        </div>
      )}

      {/* Dosya Yükleme */}
      {el.type === 'file_upload' && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 gap-2">
          <Upload size={32} className="text-indigo-400"/>
          <p className="text-sm font-medium">Katılımcılar bu alana dosya yükleyebilecek.</p>
        </div>
      )}

      {/* Vinyet / Senaryo */}
      {el.type === 'vignette' && (
        <VignetteEditor el={el} updateElement={updateElement} />
      )}
    </div>
  );
}