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
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [assignedVariations, setAssignedVariations] = useState<Record<string, string>>({});
  const [reactionTimes, setReactionTimes] = useState<Record<string, number>>({});
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<any[][]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState(""); // YENİ: Hata mesajı için state

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    async function fetchSurvey() {
      const { data, error: fetchError } = await supabase.from("surveys").select("*").eq("id", id).single();
      
      if (fetchError || !data) {
        setError("Anket bulunamadı veya silinmiş.");
        setLoading(false);
        return;
      }

      if (!data.is_active) {
        setError("Bu araştırma şu anda veri alımına kapalıdır.");
        setLoading(false);
        return;
      }

      setSurvey(data);
      
      const variationsObj: Record<string, string> = {};
      data.survey_payload.elements.forEach((el: any) => {
        if (el.type === 'vignette' && el.variations && el.variations.length > 0) {
          const randomIndex = Math.floor(Math.random() * el.variations.length);
          variationsObj[el.name] = el.variations[randomIndex];
        }
      });
      setAssignedVariations(variationsObj);

      const groupedPages: any[][] = [];
      let currentPageElements: any[] = [];

      data.survey_payload.elements.forEach((el: any) => {
        if (el.type === 'page_break') {
          if (currentPageElements.length > 0) {
            groupedPages.push([...currentPageElements]);
            currentPageElements = [];
          }
        } else {
          currentPageElements.push(el);
        }
      });
      if (currentPageElements.length > 0) {
        groupedPages.push(currentPageElements);
      }

      setPages(groupedPages);
      startTimeRef.current = performance.now();
      setLoading(false);
    }

    if (id) fetchSurvey();
  }, [id]);

  const handleAnswerChange = (questionId: string, value: any) => {
    const currentTime = performance.now();
    const rt_ms = Math.round(currentTime - startTimeRef.current);
    
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setReactionTimes(prev => ({ ...prev, [questionId]: rt_ms }));
    setValidationError(""); // Kullanıcı bir cevap verdiğinde hata mesajını temizle
  };

  // YENİ: Mevcut sayfadaki zorunlu soruların cevaplanıp cevaplanmadığını kontrol eder
  const validateCurrentPage = () => {
    const currentElements = pages[currentPage] || [];
    for (const el of currentElements) {
      if (el.required) {
        const answer = answers[el.name];
        // Soru tipine göre boşluk kontrolü (Metin için boş string, Checkbox için boş array)
        const isUnanswered = 
            answer === undefined || 
            answer === null || 
            (typeof answer === 'string' && answer.trim() === '') || 
            (Array.isArray(answer) && answer.length === 0);

        if (isUnanswered) {
          return false; // Cevaplanmamış zorunlu soru var
        }
      }
    }
    return true; // Tüm zorunlu sorular cevaplanmış
  };

  const handleNextPage = () => {
    if (!validateCurrentPage()) {
      setValidationError("Lütfen devam etmeden önce tüm zorunlu (*) soruları yanıtlayınız.");
      return;
    }

    setValidationError("");

    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0); // Yeni sayfaya geçerken yukarı kaydır
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
     if (!validateCurrentPage()) {
      setValidationError("Lütfen göndermeden önce tüm zorunlu (*) soruları yanıtlayınız.");
      return;
    }

    setIsSubmitting(true);
    const sessionId = crypto.randomUUID();

    const finalPayload = {
      yanitlar: answers,
      gosterilen_senaryo: assignedVariations,
      reaksiyon_sureleri_ms: reactionTimes,    
      toplam_sure_ms: Math.round(performance.now() - startTimeRef.current)
    };

    const { error } = await supabase.from("responses").insert([
      { survey_id: id, session_id: sessionId, answer_payload: finalPayload }
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

  const currentElements = pages[currentPage] || [];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
        
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}></div>
        </div>

        <div className="bg-indigo-600 p-6 text-white text-center">
          <h1 className="text-xl font-bold leading-tight">{survey.survey_payload.title || "Bilimsel Araştırma"}</h1>
        </div>
        
        <div className="p-6 md:p-8 flex flex-col gap-10 flex-1">
          {currentElements.map((el: any) => (
            <div key={el.name} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
              
              {el.type === 'vignette' ? (
                // RENK DÜZELTMESİ: text-gray-900 (Koyu Siyah)
                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg text-gray-900 leading-relaxed text-justify text-sm md:text-base shadow-sm">
                  {assignedVariations[el.name]}
                </div>
              ) : (
                 // RENK DÜZELTMESİ: text-gray-900
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-5 leading-snug">
                  {el.title} {el.required && <span className="text-red-500 font-bold ml-1">*</span>}
                </h3>
              )}

              {el.type === 'text' && (
                <textarea 
                  // RENK DÜZELTMESİ: text-gray-900
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-base text-gray-900"
                  rows={3}
                  value={answers[el.name] || ""}
                  onChange={(e) => handleAnswerChange(el.name, e.target.value)}
                  placeholder="Yanıtınızı buraya yazınız..."
                />
              )}

              {el.type === 'slider' && (
                <div className="flex flex-col gap-4 px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-bold text-sm">0</span>
                    <input 
                      type="range" min="0" max="100" 
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      value={answers[el.name] || 0}
                      onChange={(e) => handleAnswerChange(el.name, parseInt(e.target.value))}
                    />
                    <span className="text-gray-600 font-bold text-sm">100</span>
                  </div>
                  <div className="text-center font-black text-indigo-600 text-2xl">{answers[el.name] || 0}</div>
                </div>
              )}

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
                      {/* RENK DÜZELTMESİ: text-gray-900 */}
                      <span className="text-gray-900 text-base font-medium">{choice}</span>
                    </label>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>

        {/* YENİ: Hata Mesajı Gösterimi */}
        {validationError && (
            <div className="px-6 py-3 bg-red-50 text-red-600 text-sm font-semibold text-center border-t border-red-100">
                {validationError}
            </div>
        )}

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500 font-medium">Sayfa {currentPage + 1} / {pages.length}</span>
          </div>
          <button 
            onClick={handleNextPage}
            disabled={isSubmitting}
            className={`px-8 py-3 text-white rounded-lg font-bold text-sm transition shadow-md ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
          >
            {currentPage < pages.length - 1 ? 'İleri' : (isSubmitting ? 'Gönderiliyor...' : 'Yanıtları Gönder')}
          </button>
        </div>

      </div>
    </div>
  );
}