import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";
import { 
  Trash2, Plus, GripVertical, ChevronUp, ChevronDown, Copy, 
  Type, AlignLeft, Circle, CheckSquare, ChevronDownSquare, 
  SlidersHorizontal, Grid, LayoutGrid, Upload, Star, BookOpen, SeparatorHorizontal
} from 'lucide-react';

// TÜM SORU TİPLERİ LİSTESİ
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
      else {
        // Yeni anket açıldığında varsayılan bir soru ekle
        addElement('multiple_choice');
      }
    });
  }, [router, editId]);

  const loadSurvey = async (surveyId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
    if (data && data.survey_payload) {
      setSurveyTitle(data.title);
      setElements(data.survey_payload.elements || []);
    } else {
      alert("Anket yüklenemedi!");
    }
    setIsLoading(false);
  };

  // YENİ ELEMAN EKLEME FONKSİYONU
  const addElement = (type: string, insertIndex?: number) => {
    const newElement = {
      id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      title: '',
      description: '',
      required: false,
      choices: ['Seçenek 1'], // Seçmeli sorular için
      scaleConfig: { min: 1, max: 5, minLabel: 'Hiç Katılmıyorum', maxLabel: 'Tamamen Katılıyorum' }, // Likert için
      gridConfig: { rows: ['Satır 1'], columns: ['Sütun 1'] }, // Tablolar için
      variations: [''] // Vinyetler için
    };

    let newElements = [...elements];
    if (insertIndex !== undefined) {
      newElements.splice(insertIndex + 1, 0, newElement);
    } else {
      newElements.push(newElement);
    }
    
    setElements(newElements);
    setSelectedId(newElement.id);
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
      if (editId) {
        await supabase.from('surveys').update({ title: surveyTitle, survey_payload: finalJSON, is_active: publish }).eq('id', editId);
      } else {
        await supabase.from('surveys').insert([{ title: surveyTitle, survey_payload: finalJSON, is_active: publish }]);
      }
      alert(`Başarılı! Anket ${publish ? 'yayınlandı' : 'kaydedildi'}.`);
      router.push('/dashboard');
    } catch (err) {
      alert("Kayıt sırasında hata oluştu.");
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-blue-50 text-blue-600 font-medium">Anket Yükleniyor...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
      {/* ÜST BAR */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10 shrink-0">
        <input 
          type="text" 
          value={surveyTitle}
          onChange={(e) => setSurveyTitle(e.target.value)}
          className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-2 py-1 w-1/2 transition"
          placeholder="Araştırma Başlığı"
        />
        <div className="flex gap-3">
          <button onClick={() => saveSurvey(false)} disabled={isSaving} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition">
            Taslağı Kaydet
          </button>
          <button onClick={() => saveSurvey(true)} disabled={isSaving} className="px-5 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition">
            {editId ? 'Güncelle ve Yayınla' : 'Yayınla'}
          </button>
        </div>
      </div>

      {/* ANA TUVAL ALANI */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center pb-32">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          
          {elements.map((el, index) => {
            const isSelected = selectedId === el.id;

            return (
              <div 
                key={el.id} 
                onClick={() => setSelectedId(el.id)}
                className={`relative bg-white rounded-lg border transition-all duration-200 shadow-sm ${isSelected ? 'border-l-8 border-indigo-600 shadow-md ring-1 ring-indigo-100' : 'border-l-8 border-transparent hover:border-gray-300 cursor-pointer'}`}
              >
                
                {/* YUKARI / AŞAĞI TAŞIMA BUTONLARI */}
                {isSelected && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <button onClick={(e) => { e.stopPropagation(); moveElement(index, 'up'); }} disabled={index === 0} className="p-1.5 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30"><ChevronUp size={16}/></button>
                    <button onClick={(e) => { e.stopPropagation(); moveElement(index, 'down'); }} disabled={index === elements.length - 1} className="p-1.5 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30"><ChevronDown size={16}/></button>
                  </div>
                )}

                <div className="p-6">
                  {/* EDIT MODU */}
                  {isSelected ? (
                    <div className="flex flex-col gap-6">
                      
                      {/* Başlık ve Tip Seçici */}
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
                          onChange={(e) => updateElement(el.id, 'type', e.target.value)}
                          className="w-full md:w-64 p-3 border border-gray-300 rounded-md bg-white text-gray-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {QUESTION_TYPES.map(qt => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                        </select>
                      </div>

                      {/* TİPE GÖRE ÖZEL AYARLAR */}

                      {/* 1. SEÇMELİ SORULAR (Multiple Choice, Checkbox, Dropdown) */}
                      {['multiple_choice', 'checkboxes', 'dropdown'].includes(el.type) && (
                        <div className="flex flex-col gap-2">
                          {el.choices.map((choice: string, cIndex: number) => (
                            <div key={cIndex} className="flex items-center gap-3">
                              {el.type === 'multiple_choice' ? <Circle size={20} className="text-gray-300"/> : el.type === 'checkboxes' ? <CheckSquare size={20} className="text-gray-300"/> : <span className="text-gray-400 font-bold">{cIndex + 1}.</span>}
                              <input 
                                type="text" value={choice} 
                                onChange={(e) => {
                                  const newChoices = [...el.choices];
                                  newChoices[cIndex] = e.target.value;
                                  updateElement(el.id, 'choices', newChoices);
                                }}
                                className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none py-1 text-gray-800"
                                placeholder={`Seçenek ${cIndex + 1}`}
                              />
                              {el.choices.length > 1 && (
                                <button onClick={() => updateElement(el.id, 'choices', el.choices.filter((_:any, i:number) => i !== cIndex))} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                              )}
                            </div>
                          ))}
                          <div className="flex items-center gap-3 mt-2">
                            <Plus size={20} className="text-gray-300"/>
                            <button onClick={() => updateElement(el.id, 'choices', [...el.choices, `Seçenek ${el.choices.length + 1}`])} className="text-indigo-600 text-sm font-medium hover:underline">
                              Seçenek Ekle
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. DOĞRUSAL ÖLÇEK (LIKERT) */}
                      {el.type === 'linear_scale' && (
                        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-4">
                            <select value={el.scaleConfig?.min || 1} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, min: parseInt(e.target.value)})} className="border p-2 rounded">
                              <option value={0}>0</option>
                              <option value={1}>1</option>
                            </select>
                            <span className="text-gray-500">ile</span>
                            <select value={el.scaleConfig?.max || 5} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, max: parseInt(e.target.value)})} className="border p-2 rounded">
                              {[2,3,4,5,6,7,8,9,10,100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span className="text-gray-500">Arası</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center font-bold text-gray-500">{el.scaleConfig?.min || 1}</span>
                              <input type="text" placeholder="Alt Sınır Etiketi (Örn: Hiç Katılmıyorum)" value={el.scaleConfig?.minLabel || ''} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, minLabel: e.target.value})} className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none py-1 bg-transparent"/>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center font-bold text-gray-500">{el.scaleConfig?.max || 5}</span>
                              <input type="text" placeholder="Üst Sınır Etiketi (Örn: Tamamen Katılıyorum)" value={el.scaleConfig?.maxLabel || ''} onChange={(e) => updateElement(el.id, 'scaleConfig', {...el.scaleConfig, maxLabel: e.target.value})} className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none py-1 bg-transparent"/>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. VİNYET / SENARYO */}
                      {el.type === 'vignette' && (
                        <div className="flex flex-col gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <p className="text-xs font-bold text-blue-700">Sistem bu senaryolardan sadece BİRİNİ katılımcıya rastgele gösterecektir.</p>
                          {el.variations.map((v: string, vIndex: number) => (
                            <div key={vIndex} className="flex flex-col gap-1">
                              <div className="flex justify-between">
                                <span className="text-xs font-bold text-blue-900">Varyasyon {vIndex + 1}</span>
                                {el.variations.length > 1 && <button onClick={() => updateElement(el.id, 'variations', el.variations.filter((_:any, i:number) => i !== vIndex))} className="text-red-500"><Trash2 size={14}/></button>}
                              </div>
                              <textarea value={v} onChange={(e) => {
                                const newVars = [...el.variations];
                                newVars[vIndex] = e.target.value;
                                updateElement(el.id, 'variations', newVars);
                              }} className="w-full border rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" rows={3} placeholder="Senaryo metni..."/>
                            </div>
                          ))}
                          <button onClick={() => updateElement(el.id, 'variations', [...el.variations, ''])} className="text-blue-700 text-sm font-bold mt-2 hover:underline">Varyasyon Ekle</button>
                        </div>
                      )}

                      {/* ALT ÇUBUK: ZORUNLULUK, KOPYALA, SİL */}
                      <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        <button onClick={() => duplicateElement(index)} className="text-gray-400 hover:text-gray-800 transition" title="Kopyala"><Copy size={20}/></button>
                        <button onClick={() => removeElement(el.id)} className="text-gray-400 hover:text-red-500 transition" title="Sil"><Trash2 size={20}/></button>
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-gray-700">Gerekli (Zorunlu) Soru</span>
                          <div className={`w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition ${el.required ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                             <input type="checkbox" checked={el.required} onChange={(e) => updateElement(el.id, 'required', e.target.checked)} className="hidden"/>
                             <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${el.required ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>

                    </div>
                  ) : (
                    /* OKUMA (PREVIEW) MODU */
                    <div className="flex flex-col gap-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {el.title || <span className="text-gray-400 italic">Soru metni girilmemiş</span>} 
                        {el.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      
                      {el.type === 'short_text' && <div className="border-b border-dotted border-gray-400 w-1/2 pb-4 text-gray-400 text-sm">Kısa yanıt metni</div>}
                      {el.type === 'paragraph' && <div className="border-b border-dotted border-gray-400 w-full pb-8 text-gray-400 text-sm">Uzun yanıt metni</div>}
                      {['multiple_choice', 'checkboxes'].includes(el.type) && (
                        <div className="flex flex-col gap-2">
                          {el.choices.map((c:string, i:number) => (
                            <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                              {el.type === 'multiple_choice' ? <Circle size={16}/> : <CheckSquare size={16}/>} {c || `Seçenek ${i+1}`}
                            </div>
                          ))}
                        </div>
                      )}
                      {el.type === 'linear_scale' && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{el.scaleConfig?.minLabel}</span>
                          <div className="flex gap-2">
                            {Array.from({length: (el.scaleConfig?.max || 5) - (el.scaleConfig?.min || 1) + 1}).map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full border flex items-center justify-center bg-gray-50">{i + (el.scaleConfig?.min || 1)}</div>
                            ))}
                          </div>
                          <span>{el.scaleConfig?.maxLabel}</span>
                        </div>
                      )}
                      {el.type === 'vignette' && <div className="text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded border border-blue-100 flex items-center gap-2"><BookOpen size={16}/> {el.variations?.length} farklı senaryo varyasyonu içeriyor.</div>}
                      {el.type === 'page_break' && <div className="text-sm font-bold text-center text-gray-400 uppercase tracking-widest border-b-2 border-dashed border-gray-200 pb-2">Yeni Bölüm / Sayfa Sonu</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="h-20"></div> {/* Scroll boşluğu */}
        </div>
      </div>

      {/* SAĞ YÜZER MENÜ (YENİ SORU EKLEME) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col p-2 gap-2">
        <button onClick={() => addElement('multiple_choice')} className="p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition group relative" title="Soru Ekle">
          <Plus size={24} />
        </button>
        <button onClick={() => addElement('vignette')} className="p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Senaryo / Vinyet Ekle">
          <BookOpen size={24} />
        </button>
        <button onClick={() => addElement('page_break')} className="p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Sayfa Sonu Ekle">
          <SeparatorHorizontal size={24} />
        </button>
      </div>

    </div>
  );
}