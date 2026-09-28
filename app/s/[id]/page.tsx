"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../../src/lib/supabase";
import { useParams } from "next/navigation";

export default function SurveyEngine() {
  const params = useParams();
  const id = params.id as string;

  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Katılımcı Verileri ve Araştırma Metrikleri
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [assignedVariations, setAssignedVariations] = useState<Record<string, string>>({});
  const [reactionTimes, setReactionTimes] = useState<Record<string, number>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // RT (Reaksiyon Süresi) ölçümü için sayfanın yüklenme anı (Donanım saati)
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    async function fetchSurvey() {
      const { data, error: fetchError } = await supabase.from("surveys").select("*").eq("id", id).single();
      
      if (fetchError || !data) {
        setError("Anket bulunamadı veya silinmiş.");
        setLoading(false);
        return;
      }

      // 1. GÜVENLİK DUVARI: Aktiflik Kontrolü
      if (!data.is_active) {
        setError("Bu araştırma şu anda veri alımına kapalıdır.");
        setLoading(false);
        return;
      }

      // 2. GÜVENLİK DUVARI: Süre Kontrolü (Bitiş tarihi varsa)
      if (data.expires_at) {
        const expiryDate = new Date(data.expires_at);
        const now = new Date();
        if (now > expiryDate) {
          setError("Bu araştırmanın veri toplama süresi dolmuştur.");
          setLoading(false);
          return;
        }
      }

      setSurvey(data);
      
      // 3. VİNYET RANDOMİZASYONU (Sihirli Kısım)
      const variationsObj: Record<string, string> = {};
      data.survey_payload.elements.forEach((el: any) => {
        // Eğer soru tipi 'vinyet' ise ve varyasyonları varsa
        if (el.type === 'vignette' && el.variations && el.variations.length > 0) {
          // İçlerinden tamamen rastgele bir tanesini (Örn: 9 taneden 1'ini) seç
          const randomIndex = Math.floor(Math.random() * el.variations.length);
          variationsObj[el.name] = el.variations[randomIndex];
        }
      });
      // Seçilen senaryoları katılımcının ekranına kilitle
      setAssignedVariations(variationsObj);
      
      // Süreyi başlat (Milisaniye hassasiyetinde)
      startTimeRef.current = performance.now();
      setLoading(false);
    }

    if (id) fetchSurvey();
  }, [id]);

  const handleAnswerChange = (questionId: string, value: any) => {
    // Katılımcının bu soruya cevap verdiği andaki reaksiyon süresini (RT) hesapla
    const currentTime = performance.now();
    const rt_ms = Math.round(currentTime - startTimeRef.current);
    
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setReactionTimes(prev => ({ ...prev, [questionId]: rt_ms }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Benzersiz bir session_id üret (Zorunlu sütun hatasını engeller)
    const sessionId = crypto.randomUUID();

    const finalPayload = {
      yanitlar: answers,
      gosterilen_senaryo: assignedVariations,
      reaksiyon_sureleri_ms: reactionTimes,    
      toplam_sure_ms: Math.round(performance.now() - startTimeRef.current)
    };

    const { error } = await supabase.from("responses").insert([
      { 
        survey_id: id, 
        session_id: sessionId, // YENİ: Zorunlu alanı doldurduk
        answer_payload: finalPayload 
      }
    ]);

    setIsSubmitting(false);
    if (error) {
      alert("Sunucu Hatası: " + error.message);
    } else {
      setIsSubmitted(true);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium animate-pulse">Araştırma yükleniyor...</div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4"><h2 className="text-2xl font-bold text-gray-800 mb-2">Erişim Engellendi</h2><p className="text-gray-600 text-center">{error}</p></div>;
  if (isSubmitted) return <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4"><h2 className="text-3xl font-bold text-green-700 mb-2">Teşekkürler!</h2><p className="text-green-600 text-center">Yanıtlarınız bilimsel araştırmamız için başarıyla kaydedilmiştir.</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h1 className="text-xl font-bold leading-tight">{survey.survey_payload.title || "Bilimsel Araştırma"}</h1>
        </div>
        
        <div className="p-6 md:p-8 flex flex-col gap-10">
          {survey.survey_payload.elements.map((el: any) => (
            <div key={el.name} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
              
              {/* VİNYET İSE RASTGELE SEÇİLENİ GÖSTER, DEĞİLSE SORU BAŞLIĞINI GÖSTER */}
              {el.type === 'vignette' ? (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg text-gray-800 leading-relaxed text-justify text-sm md:text-base shadow-sm">
                  {assignedVariations[el.name]}
                </div>
              ) : (
                <h3 className="text-base md:text-lg font-medium text-gray-800 mb-5 leading-snug">
                  {el.title} {el.required && <span className="text-red-500 font-bold ml-1">*</span>}
                </h3>
              )}

              {/* TİP 1: AÇIK METİN */}
              {el.type === 'text' && (
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                  rows={3}
                  value={answers[el.name] || ""}
                  onChange={(e) => handleAnswerChange(el.name, e.target.value)}
                  placeholder="Yanıtınızı buraya yazınız..."
                />
              )}

              {/* TİP 2: KAYDIRICI (SLIDER) - 0 ile 100 Arası */}
              {el.type === 'slider' && (
                <div className="flex flex-col gap-4 px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 font-bold text-sm">0</span>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      value={answers[el.name] || 0}
                      onChange={(e) => handleAnswerChange(el.name, parseInt(e.target.value))}
                    />
                    <span className="text-gray-400 font-bold text-sm">100</span>
                  </div>
                  <div className="text-center font-black text-indigo-600 text-2xl">
                    {answers[el.name] || 0}
                  </div>
                </div>
              )}

              {/* TİP 3: ÇOKLU SEÇİM (CHECKBOX / DEMOGRAFİK) */}
              {el.type === 'checkbox' && (
                <div className="flex flex-col gap-3">
                  {el.choices?.map((choice: string, i: number) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        checked={(answers[el.name] || []).includes(choice)}
                        onChange={(e) => {
                          const currentArr = answers[el.name] || [];
                          const newArr = e.target.checked ? [...currentArr, choice] : currentArr.filter((c: string) => c !== choice);
                          handleAnswerChange(el.name, newArr);
                        }}
                      />
                      <span className="text-gray-700 text-sm font-medium">{choice}</span>
                    </label>
                  ))}
                </div>
              )}

            </div>
          ))}

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 text-white rounded-lg font-bold text-lg mt-2 transition shadow-md ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Yanıtları Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}