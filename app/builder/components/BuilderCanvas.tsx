import VignetteEditor from './VignetteEditor';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";
import { 
  Trash2, Plus, ChevronUp, ChevronDown, Copy, 
  Type, AlignLeft, Circle, CheckSquare, ChevronDownSquare, 
  SlidersHorizontal, Grid, LayoutGrid, Upload, Star, BookOpen, SeparatorHorizontal, MoveHorizontal} from 'lucide-react';

// TÜM SORU TİPLERİ
const QUESTION_TYPES = [
  { value: 'short_text', label: 'Kısa Yanıt', icon: <Type size={16}/> },
  { value: 'paragraph', label: 'Paragraf', icon: <AlignLeft size={16}/> },
  { value: 'multiple_choice', label: 'Çoktan Seçmeli (Tek Yanıt)', icon: <Circle size={16}/> },
  { value: 'checkboxes', label: 'Onay Kutuları (Birden Çok Yanıt)', icon: <CheckSquare size={16}/> },
  { value: 'dropdown', label: 'Açılır Menü', icon: <ChevronDownSquare size={16}/> },
  { value: 'linear_scale', label: 'Doğrusal Ölçek (Likert)', icon: <SlidersHorizontal size={16}/> },
  { value: 'multiple_choice_grid', label: 'Çoktan Seçmeli Tablo', icon: <Grid size={16}/> },
  { value: 'tickbox_grid', label: 'Onay Kutusu Tablosu', icon: <LayoutGrid size={16}/> },
  { value: 'file_upload', label: 'Dosya Yükleme', icon: <Upload size={16}/> },
  { value: 'rating', label: 'Puanlama (Yıldız)', icon: <Star size={16}/> },
  { value: 'vignette', label: 'Vinyet / Senaryo Bloğu', icon: <BookOpen size={16}/> },
  { value: 'slider', label: 'Kaydırıcı (Slider)', icon: <MoveHorizontal size={16}/> },
  { value: 'page_break', label: 'Bölüm Sonu (Yeni Sayfa)', icon: <SeparatorHorizontal size={16}/> },
];

export default function BuilderCanvas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [elements, setElements] = useState<any[]>([]);
  const [surveyTitle, setSurveyTitle] = useState(`Araştırma Anketi - ${new Date().toLocaleDateString('tr-TR')}`);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else if (editId) loadSurvey(editId);
      else if (elements.length === 0) addElement('multiple_choice');
    });
  }, [router, editId]);

  const loadSurvey = async (surveyId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
    if (data?.survey_payload) {
      setSurveyTitle(data.title);
      setElements(data.survey_payload.elements || []);
    } else {
      alert("Anket yüklenemedi!");
    }
    setIsLoading(false);
  };

  // Yeni eleman oluştururken tipi için gerekli varsayılan verileri sağlar
  const getDefaultDataForType = (type: string) => {
    return {
      sliderConfig: { min: 0, max: 100, minLabel: 'En Düşük', maxLabel: 'En Yüksek' },
      choices: ['Seçenek 1'],
      scaleConfig: { min: 1, max: 5, minLabel: '', maxLabel: '' },
      gridConfig: { rows: ['Satır 1'], columns: ['Sütun 1'] },
      variations: [{ id: crypto.randomUUID(), text: '', questions: [] }],
      ratingConfig: { max: 5 }
    };
  };

  const addElement = (type: string, insertIndex?: number) => {
    const newElement = {
      id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      title: '',
      required: false,
      ...getDefaultDataForType(type)
    };

    const newElements = [...elements];
    if (insertIndex !== undefined) newElements.splice(insertIndex + 1, 0, newElement);
    else newElements.push(newElement);
    
    setElements(newElements);
    setSelectedId(newElement.id);
  };

  // Soru Tipi değiştirildiğinde sistemin çökmemesi için gerekli verileri doldurur
  const handleTypeChange = (id: string, newType: string, el: any) => {
    let updates: any = { type: newType };
    const defaults = getDefaultDataForType(newType);
    
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(newType) && !el.choices) updates.choices = defaults.choices;
    if (['multiple_choice_grid', 'tickbox_grid'].includes(newType) && !el.gridConfig) updates.gridConfig = defaults.gridConfig;
    if (newType === 'linear_scale' && !el.scaleConfig) updates.scaleConfig = defaults.scaleConfig;
    if (newType === 'rating' && !el.ratingConfig) updates.ratingConfig = defaults.ratingConfig;
    if (newType === 'vignette' && !el.variations) updates.variations = defaults.variations;
    if (newType === 'slider' && !el.sliderConfig) updates.sliderConfig = defaults.sliderConfig;
    
    setElements(elements.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const updateElement = (id: string, key: string, value: any) => {
    setElements(elements.map(el => el.id === id ? { ...el, [key]: value } : el));
  };

  const duplicateElement = (index: number) => {
    const elToCopy = elements[index];
    const newEl = { ...elToCopy, id: `q_${Date.now()}` };
    const newElements = [...elements];
    newElements.splice(index + 1, 0, newEl);
    setElements(newElements);
    setSelectedId(newEl.id);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveElement = (index: number, direction: 'up' | 'down') => {
    const newElements = [...elements];
    if (direction === 'up' && index > 0) {
      [newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]];
    } else if (direction === 'down' && index < newElements.length - 1) {
      [newElements[index + 1], newElements[index]] = [newElements[index], newElements[index + 1]];
    }
    setElements(newElements);
  };

  const saveSurvey = async (publish: boolean) => {
    setIsSaving(true);
    const finalJSON = { title: surveyTitle, elements };
    
    try {
      if (editId) await supabase.from('surveys').update({ title: surveyTitle, survey_payload: finalJSON, is_active: publish }).eq('id', editId);
      else await supabase.from('surveys').insert([{ title: surveyTitle, survey_payload: finalJSON, is_active: publish }]);
      alert(`Başarılı! Anket ${publish ? 'yayınlandı' : 'kaydedildi'}.`);
      router.push('/dashboard');
    } catch (err) {
      alert("Kayıt sırasında hata oluştu.");
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-blue-50 text-blue-600 font-medium">Anket Yükleniyor...</div>;

  return (
    <div className="flex flex-col h-screen bg-indigo-50 font-sans">
      
      {/* ÜST BAR */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10 shrink-0">
        <input 
          type="text" 
          value={surveyTitle}
          onChange={(e) => setSurveyTitle(e.target.value)}
          className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-2 py-1 w-1/2 transition"
          placeholder="Araştırma Başlığı"
        />
        <div className="flex gap-3">
          <button onClick={() => saveSurvey(false)} disabled={isSaving} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition">
            Taslağı Kaydet
          </button>
          <button onClick={() => saveSurvey(true)} disabled={isSaving} className="px-5 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition shadow-sm">
            {editId ? 'Güncelle ve Yayınla' : 'Yayınla'}
          </button>
        </div>
      </div>

      {/* ANA TUVAL ALANI */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center pb-32">
        <div className="w-full max-w-3xl flex flex-col gap-5">
          
          {elements.map((el, index) => {
            const isSelected = selectedId === el.id;

            return (
              <div 
                key={el.id} 
                onClick={() => setSelectedId(el.id)}
                className={`relative bg-white rounded-xl border transition-all duration-200 shadow-sm ${isSelected ? 'border-l-8 border-indigo-600 shadow-md ring-1 ring-indigo-100' : 'border-l-8 border-transparent hover:border-gray-300 cursor-pointer'}`}
              >
                
                {/* YUKARI / AŞAĞI BUTONLARI */}
                {isSelected && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    <button onClick={(e) => { e.stopPropagation(); moveElement(index, 'up'); }} disabled={index === 0} className="p-2 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30"><ChevronUp size={18}/></button>
                    <button onClick={(e) => { e.stopPropagation(); moveElement(index, 'down'); }} disabled={index === elements.length - 1} className="p-2 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30"><ChevronDown size={18}/></button>
                  </div>
                )}

                <div className="p-6">
                  {isSelected ? (
                    <div className="flex flex-col gap-6">
                      
                      {/* BAŞLIK VE TİP SEÇİCİ */}
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 w-full">
                          <input 
                            type="text" 
                            value={el.title} 
                            onChange={(e) => updateElement(el.id, 'title', e.target.value)} 
                            placeholder={el.type === 'page_break' ? 'Bölüm Başlığı (İsteğe Bağlı)' : 'Soru Metni'} 
                            className="w-full text-lg font-medium text-gray-900 bg-gray-50 border-b border-gray-400 focus:border-indigo-600 focus:bg-gray-100 outline-none p-3 rounded-t-md transition"
                            autoFocus
                          />
                        </div>
                        <select 
                          value={el.type} 
                          onChange={(e) => handleTypeChange(el.id, e.target.value, el)}
                          className="w-full md:w-64 p-3 border border-gray-300 rounded-md bg-white text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {QUESTION_TYPES.map(qt => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                        </select>
                      </div>

                      {/* --- TİPE ÖZEL DİNAMİK AYARLAR --- */}

                      {/* 1. KISA YANIT / PARAGRAF (Görsel Önizleme) */}
                      {['short_text', 'paragraph'].includes(el.type) && (
                        <div className={`border-b border-dotted border-gray-400 pb-2 text-gray-400 ${el.type === 'short_text' ? 'w-1/2' : 'w-full'}`}>
                          {el.type === 'short_text' ? 'Kısa yanıt metni' : 'Uzun yanıt metni'}
                        </div>
                      )}

                      {/* 2. LİSTE SEÇENEKLERİ (Çoktan Seçmeli, Onay Kutusu, Dropdown) */}
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
                                    // YENİ: Seçeneğin adı değişirse, mantık haritasındaki (logicMap) adını da eşzamanlı güncelle
                                    let newLogicMap = { ...(el.logicMap || {}) };
                                    if (el.logicMap && el.logicMap[choice]) {
                                      newLogicMap[e.target.value] = el.logicMap[choice];
                                      delete newLogicMap[choice];
                                    }
                                    newChoices[cIndex] = e.target.value;
                                    setElements(elements.map(eItem => eItem.id === el.id ? { ...eItem, choices: newChoices, logicMap: newLogicMap } : eItem));
                                  }}
                                  className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none py-1 text-gray-900"
                                  placeholder={`Seçenek ${cIndex + 1}`}
                                />
                                {el.choices.length > 1 && (
                                  <button onClick={() => updateElement(el.id, 'choices', el.choices.filter((_:any, i:number) => i !== cIndex))} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                                )}
                              </div>
                              
                              {/* YENİ: KOŞULLU MANTIK YÖNLENDİRİCİSİ */}
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
                                    {elements.filter(e => e.type === 'page_break').map((pb, i) => (
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

                      {/* 3. DOĞRUSAL ÖLÇEK (Likert) */}
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

                      {/* KAYDIRICI (Slider) AYARLARI */}
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

                      {/* 4. TABLOLAR (Multiple Choice Grid & Tickbox Grid) */}
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

                      {/* 5. PUANLAMA (Yıldız) */}
                      {el.type === 'rating' && (
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <span className="text-gray-700 font-medium">Maksimum Yıldız Sayısı:</span>
                          <select value={el.ratingConfig?.max || 5} onChange={(e) => updateElement(el.id, 'ratingConfig', { max: parseInt(e.target.value) })} className="border border-gray-300 rounded p-2 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value={5}>5 Yıldız</option>
                            <option value={10}>10 Yıldız</option>
                          </select>
                        </div>
                      )}

                      {/* 6. DOSYA YÜKLEME */}
                      {el.type === 'file_upload' && (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 gap-2">
                          <Upload size={32} className="text-indigo-400"/>
                          <p className="text-sm font-medium">Katılımcılar bu alana dosya yükleyebilecek.</p>
                        </div>
                      )}

                      {/* 7. VİNYET / SENARYO (Artık kendi ayrı dosyasında yönetiliyor) */}
{el.type === 'vignette' && (
  <VignetteEditor el={el} updateElement={updateElement} />
)}

                      {/* ALT ÇUBUK: ZORUNLULUK, KOPYALA, SİL */}
                      <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                        {/* YENİ: MANTIK AKTİFLEŞTİRME BUTONU */}
                        {['multiple_choice', 'dropdown'].includes(el.type) && (
                          <button 
                            onClick={() => updateElement(el.id, 'logicEnabled', !el.logicEnabled)} 
                            className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${el.logicEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            Yanıta Göre Bölüme Git
                          </button>
                        )}
                        <button onClick={() => duplicateElement(index)} className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1" title="Kopyala"><Copy size={20}/></button>
                        <button onClick={() => removeElement(el.id)} className="text-gray-500 hover:text-red-500 transition flex items-center gap-1" title="Sil"><Trash2 size={20}/></button>
                        
                        {el.type !== 'page_break' && (
                          <>
                            <div className="w-px h-6 bg-gray-300 mx-2"></div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <span className="text-sm font-semibold text-gray-700">Gerekli</span>
                              <div className={`w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition duration-300 ${el.required ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <input type="checkbox" checked={el.required} onChange={(e) => updateElement(el.id, 'required', e.target.checked)} className="hidden"/>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${el.required ? 'translate-x-4' : ''}`}></div>
                              </div>
                            </label>
                          </>
                        )}
                      </div>

                    </div>
                  ) : (
                    
                    /* OKUMA (PREVIEW) MODU - Sorunun seçili olmadığı anki görünümü */
                    <div className="flex flex-col gap-4">
                      {el.type === 'page_break' ? (
                        <div className="flex flex-col items-center">
                          <div className="w-full border-t-4 border-indigo-600 rounded-t-md"></div>
                          <div className="bg-indigo-50 w-full p-4 rounded-b-md">
                            <h3 className="text-lg font-bold text-indigo-900 text-center">{el.title || 'Yeni Bölüm'}</h3>
                          </div>
                        </div>
                      ) : (
                        <h3 className="text-base font-semibold text-gray-900">
                          {el.title || <span className="text-gray-400 italic">Soru metni girilmemiş</span>} 
                          {el.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                      )}
                      
                      {el.type === 'short_text' && <div className="border-b border-dotted border-gray-400 w-1/2 pb-2 text-gray-400 text-sm">Kısa yanıt metni</div>}
                      {el.type === 'paragraph' && <div className="border-b border-dotted border-gray-400 w-full pb-6 text-gray-400 text-sm">Uzun yanıt metni</div>}
                      
                      {['multiple_choice', 'checkboxes'].includes(el.type) && (
                        <div className="flex flex-col gap-3">
                          {el.choices?.map((c:string, i:number) => (
                            <div key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                              {el.type === 'multiple_choice' ? <Circle size={18} className="text-gray-400"/> : <CheckSquare size={18} className="text-gray-400"/>} {c || `Seçenek ${i+1}`}
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
                          <span>{el.scaleConfig?.minLabel}</span>
                          <div className="flex gap-2">
                            {Array.from({length: (el.scaleConfig?.max || 5) - (el.scaleConfig?.min || 1) + 1}).map((_, i) => (
                              <div key={i} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center bg-gray-50 text-gray-900">{i + (el.scaleConfig?.min || 1)}</div>
                            ))}
                          </div>
                          <span>{el.scaleConfig?.maxLabel}</span>
                        </div>
                      )}

                      {/* KAYDIRICI ÖNİZLEME */}
                      {el.type === 'slider' && (
                        <div className="flex items-center gap-4 w-full md:w-3/4">
                          <span className="text-gray-500 text-sm font-bold">{el.sliderConfig?.minLabel || el.sliderConfig?.min}</span>
                          <input type="range" disabled min={el.sliderConfig?.min || 0} max={el.sliderConfig?.max || 100} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none" />
                          <span className="text-gray-500 text-sm font-bold">{el.sliderConfig?.maxLabel || el.sliderConfig?.max}</span>
                        </div>
                      )}

                      {/* 4. TABLOLAR (Multiple Choice Grid & Tickbox Grid) */}
                      {['multiple_choice_grid', 'tickbox_grid'].includes(el.type) && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr>
                                <th></th>
                                {/* Tailwind düzeltmesi: min-w-[80px] yerine min-w-20 kullanıldı */}
                                {el.gridConfig?.columns?.map((c:string, i:number) => <th key={i} className="font-medium text-gray-700 text-center p-2 min-w-20">{c}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {el.gridConfig?.rows?.map((r:string, rIndex:number) => (
                                <tr key={rIndex} className="border-t border-gray-100 hover:bg-gray-50">
                                  <td className="p-3 font-medium text-gray-800">{r}</td>
                                  {/* TypeScript düzeltmesi: _ ve cIndex için any tipi eklendi */}
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
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="h-32"></div> {/* Scroll için boşluk */}
        </div>
      </div>

      {/* SAĞ YÜZER MENÜ (YENİ SORU EKLEME) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col p-2 gap-2 z-50">
        <button onClick={() => addElement('multiple_choice')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Soru Ekle">
          <Plus size={24} />
        </button>
        <button onClick={() => addElement('vignette')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Senaryo / Vinyet Ekle">
          <BookOpen size={24} />
        </button>
        <button onClick={() => addElement('page_break')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Bölüm (Sayfa) Ekle">
          <SeparatorHorizontal size={24} />
        </button>
      </div>

    </div>
  );
}