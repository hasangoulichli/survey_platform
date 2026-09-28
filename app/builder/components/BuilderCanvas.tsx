import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";
import { 
  Trash2, Plus, ChevronUp, ChevronDown, Copy, 
  Type, AlignLeft, Circle, CheckSquare, ChevronDownSquare, 
  SlidersHorizontal, Grid, LayoutGrid, Upload, Star, BookOpen, SeparatorHorizontal, MoveHorizontal, FileText, Shuffle 
} from 'lucide-react';
import ElementEditor from './ElementEditor';

// TÜM SORU TİPLERİ
const QUESTION_TYPES = [
  { value: 'info_block', label: 'Açıklama / Bilgi Metni', icon: <FileText size={16}/> },
  { value: 'short_text', label: 'Kısa Yanıt', icon: <Type size={16}/> },
  { value: 'paragraph', label: 'Paragraf', icon: <AlignLeft size={16}/> },
  { value: 'multiple_choice', label: 'Çoktan Seçmeli', icon: <Circle size={16}/> },
  { value: 'checkboxes', label: 'Onay Kutuları', icon: <CheckSquare size={16}/> },
  { value: 'dropdown', label: 'Açılır Menü', icon: <ChevronDownSquare size={16}/> },
  { value: 'linear_scale', label: 'Doğrusal Ölçek (Likert)', icon: <SlidersHorizontal size={16}/> },
  { value: 'multiple_choice_grid', label: 'Çoktan Seçmeli Tablo', icon: <Grid size={16}/> },
  { value: 'tickbox_grid', label: 'Onay Kutusu Tablosu', icon: <LayoutGrid size={16}/> },
  { value: 'file_upload', label: 'Dosya Yükleme', icon: <Upload size={16}/> },
  { value: 'rating', label: 'Puanlama', icon: <Star size={16}/> },
  { value: 'vignette', label: 'Vinyet / Senaryo Bloğu', icon: <BookOpen size={16}/> },
  { value: 'slider', label: 'Kaydırıcı', icon: <MoveHorizontal size={16}/> },
  { value: 'page_break', label: 'Bölüm Sonu', icon: <SeparatorHorizontal size={16}/> },
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

  const getDefaultDataForType = (type: string) => {
    return {
      sliderConfig: { min: 0, max: 100, minLabel: 'En Düşük', maxLabel: 'En Yüksek' },
      choices: ['Seçenek 1'],
      scaleConfig: { min: 1, max: 5, minLabel: '', maxLabel: '' },
      gridConfig: { rows: ['Satır 1'], columns: ['Sütun 1'] },
      variations: [{ id: crypto.randomUUID(), text: '', questions: [] }],
      ratingConfig: { max: 5 },
      shuffleOptions: false, // Seçenekleri/Satırları Karıştır
      shuffleQuestions: false // Sadece Page Break için: Soruları Karıştır
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
          type="text" value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)}
          className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none px-2 py-1 w-1/2 transition"
          placeholder="Araştırma Başlığı"
        />
        <div className="flex gap-3">
          <button onClick={() => saveSurvey(false)} disabled={isSaving} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition">Taslağı Kaydet</button>
          <button onClick={() => saveSurvey(true)} disabled={isSaving} className="px-5 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition shadow-sm">{editId ? 'Güncelle ve Yayınla' : 'Yayınla'}</button>
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
                            type="text" value={el.title} onChange={(e) => updateElement(el.id, 'title', e.target.value)} 
                            placeholder={el.type === 'page_break' ? 'Bölüm Başlığı (İsteğe Bağlı)' : 'Soru veya Başlık Metni'} 
                            className="w-full text-lg font-medium text-gray-900 bg-gray-50 border-b border-gray-400 focus:border-indigo-600 focus:bg-gray-100 outline-none p-3 rounded-t-md transition"
                            autoFocus
                          />
                          <p className="text-xs text-gray-400 mt-1 pl-1">💡 İpucu: **kalın**, *italik* veya __altı çizili__ yapmak için işaretleri kullanın.</p>

                          {el.type === 'info_block' && (
                            <div className="w-full mt-3">
                              <textarea 
                                value={el.description || ''} onChange={(e) => updateElement(el.id, 'description', e.target.value)} 
                                placeholder="Uzun açıklama, onam formu veya kapanış metnini buraya yazın..." 
                                className="w-full text-base text-gray-900 bg-white border border-gray-300 focus:border-indigo-600 outline-none p-3 rounded-md transition" rows={6}
                              />
                            </div>
                          )}
                        </div>
                        
                        <select 
                          value={el.type} onChange={(e) => handleTypeChange(el.id, e.target.value, el)}
                          className="w-full md:w-64 p-3 border border-gray-300 rounded-md bg-white text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {QUESTION_TYPES.map(qt => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                        </select>
                      </div>

                      {/* İÇERİK (Yeni ElementEditor bileşeni ile render ediliyor) */}
                      <ElementEditor el={el} updateElement={updateElement} isSelected={true} elements={elements} />

                      {/* ALT ÇUBUK: ZORUNLULUK, KOPYALA, SİL VE KARIŞTIRMA (SHUFFLE) */}
                      <div className="flex flex-wrap justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                        
                        {/* KARIŞTIRMA (SHUFFLE) AYARLARI */}
                        {el.type === 'page_break' && (
                          <label className="flex items-center gap-2 cursor-pointer mr-auto bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100">
                            <Shuffle size={14} className="text-indigo-600"/>
                            <span className="text-sm font-semibold text-indigo-800">Bu bölümdeki soruları karıştır</span>
                            <input type="checkbox" checked={el.shuffleQuestions || false} onChange={(e) => updateElement(el.id, 'shuffleQuestions', e.target.checked)} className="accent-indigo-600 w-4 h-4 ml-1"/>
                          </label>
                        )}
                        {['multiple_choice', 'checkboxes', 'dropdown'].includes(el.type) && (
                          <label className="flex items-center gap-2 cursor-pointer mr-auto bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition">
                            <Shuffle size={14} className="text-gray-500"/>
                            <span className="text-sm font-semibold text-gray-700">Seçenekleri karıştır</span>
                            <input type="checkbox" checked={el.shuffleOptions || false} onChange={(e) => updateElement(el.id, 'shuffleOptions', e.target.checked)} className="accent-indigo-600 w-4 h-4 ml-1"/>
                          </label>
                        )}
                        {['multiple_choice_grid', 'tickbox_grid'].includes(el.type) && (
                          <label className="flex items-center gap-2 cursor-pointer mr-auto bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition">
                            <Shuffle size={14} className="text-gray-500"/>
                            <span className="text-sm font-semibold text-gray-700">Satırları karıştır</span>
                            <input type="checkbox" checked={el.shuffleOptions || false} onChange={(e) => updateElement(el.id, 'shuffleOptions', e.target.checked)} className="accent-indigo-600 w-4 h-4 ml-1"/>
                          </label>
                        )}

                        {/* KOŞULLU MANTIK BUTONU */}
                        {['multiple_choice', 'dropdown'].includes(el.type) && (
                          <button onClick={() => updateElement(el.id, 'logicEnabled', !el.logicEnabled)} className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${el.logicEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            Yanıta Göre Bölüme Git
                          </button>
                        )}
                        
                        <button onClick={() => duplicateElement(index)} className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1" title="Kopyala"><Copy size={20}/></button>
                        <button onClick={() => removeElement(el.id)} className="text-gray-500 hover:text-red-500 transition flex items-center gap-1" title="Sil"><Trash2 size={20}/></button>
                        
                        {el.type !== 'page_break' && el.type !== 'info_block' && (
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
                    /* PREVIEW MODU (ElementEditor ile render ediliyor) */
                    <ElementEditor el={el} isSelected={false} elements={elements} />
                  )}
                </div>
              </div>
            );
          })}
          <div className="h-32"></div>
        </div>
      </div>

      {/* SAĞ YÜZER MENÜ */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col p-2 gap-2 z-50">
        <button onClick={() => addElement('multiple_choice')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Soru Ekle"><Plus size={24} /></button>
        <button onClick={() => addElement('vignette')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Senaryo / Vinyet Ekle"><BookOpen size={24} /></button>
        <button onClick={() => addElement('page_break')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Bölüm (Sayfa) Ekle"><SeparatorHorizontal size={24} /></button>
        <button onClick={() => addElement('info_block')} className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Bilgi / Açıklama Metni Ekle"><FileText size={24} /></button>
      </div>

    </div>
  );
}