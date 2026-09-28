"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../../src/lib/supabase";
import { useParams } from "next/navigation";
import QuestionRenderer from "./components/QuestionRenderer";

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
  const [validationError, setValidationError] = useState("");

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    async function fetchSurvey() {
      const { data, error: fetchError } = await supabase.from("surveys").select("*").eq("id", id).single();
      
      if (fetchError || !data) return finishLoading("Anket bulunamadı veya silinmiş.");
      if (!data.is_active) return finishLoading("Bu araştırma şu anda veri alımına kapalıdır.");
      
      setSurvey(data);
      
      // VİNYET RASTGELE SEÇİMİ VE ZEKİ GENİŞLETİLMESİ (EXPANSION)
      const expandedElements: any[] = [];
      const variationsObj: Record<string, string> = {};

      data.survey_payload.elements.forEach((el: any) => {
        if (el.type === 'vignette') {
          const vars = el.variations || [];
          if (vars.length > 0) {
            const randomIndex = Math.floor(Math.random() * vars.length);
            const selectedVar = vars[randomIndex];
            
            // Eski/Yeni veri tipi kontrolü
            const isLegacy = typeof selectedVar === 'string';
            const varText = isLegacy ? selectedVar : selectedVar.text;
            const varQuestions = isLegacy ? [] : (selectedVar.questions || []);

            variationsObj[el.id] = varText;

            // 1. Senaryo Metnini Kendi Başına Ekle
            expandedElements.push({ id: el.id, type: 'vignette_text', text: varText });

            // 2. Eğer bu senaryoya özel sorular eklenmişse:
            if (varQuestions.length > 0) {
              // Araya görünmez bir Sayfa Sonu at
              expandedElements.push({ id: `pb_auto_${el.id}`, type: 'page_break' });
              
              // Soruları sanki normal çoktan seçmeli sorularymış gibi sisteme yedir
              varQuestions.forEach((q: any) => {
                expandedElements.push({
                  id: `${el.id}_vq_${q.id}`, // Benzersiz ID
                  type: 'multiple_choice',
                  title: q.title,
                  choices: q.choices,
                  required: true // Manipülasyon kontrolleri araştırmalarda zorunludur
                });
              });
            }
          }
        } else {
          expandedElements.push(el);
        }
      });

      setAssignedVariations(variationsObj);

      // SAYFALANDIRMA (PAGINATION) MANTIĞINI ARTIK expandedElements ÜZERİNDEN YAPIYORUZ
      const groupedPages: any[][] = [];
      let currentGroup: any[] = [];

      expandedElements.forEach((el: any) => {
        if (el.type === 'page_break') {
          if (currentGroup.length > 0) groupedPages.push([...currentGroup]);
          currentGroup = [];
        } else {
          currentGroup.push(el);
        }
      });
      if (currentGroup.length > 0) groupedPages.push(currentGroup);

      setPages(groupedPages);
      startTimeRef.current = performance.now();
      setLoading(false);
    }
    if (id) fetchSurvey();
  }, [id]);

  const finishLoading = (errMsg: string) => {
    setError(errMsg);
    setLoading(false);
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    const rt_ms = Math.round(performance.now() - startTimeRef.current);
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setReactionTimes(prev => ({ ...prev, [questionId]: rt_ms }));
    setValidationError(""); 
  };

  // ZORUNLU SORU KONTROLÜ
  const validateCurrentPage = () => {
    const currentElements = pages[currentPage] || [];
    for (const el of currentElements) {
      if (el.required) {
        const ans = answers[el.id];
        let isUnanswered = ans === undefined || ans === null || ans === '';
        
        if (Array.isArray(ans) && ans.length === 0) isUnanswered = true;
        
        // Tablo (Grid) sorusu ise her satırın işaretlenmesi zorunludur
        if (['multiple_choice_grid', 'tickbox_grid'].includes(el.type)) {
          const rowCount = el.gridConfig?.rows?.length || 0;
          const ansCount = ans ? Object.keys(ans).length : 0;
          if (ansCount < rowCount) isUnanswered = true;
        }

        if (isUnanswered) return false;
      }
    }
    return true; 
  };

  const handleNextPage = () => {
    if (!validateCurrentPage()) {
      setValidationError("Lütfen devam etmeden önce tüm zorunlu (*) soruları yanıtlayınız.");
      return;
    }
    setValidationError("");
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0); 
    } else {
      submitSurvey();
    }
  };

  const submitSurvey = async () => {
    if (!validateCurrentPage()) {
      setValidationError("Lütfen göndermeden önce tüm zorunlu (*) soruları yanıtlayınız.");
      return;
    }

    setIsSubmitting(true);
    const finalPayload = {
      yanitlar: answers,
      gosterilen_senaryo: assignedVariations,
      reaksiyon_sureleri_ms: reactionTimes,    
      toplam_sure_ms: Math.round(performance.now() - startTimeRef.current)
    };

    const { error } = await supabase.from("responses").insert([{ survey_id: id, session_id: crypto.randomUUID(), answer_payload: finalPayload }]);
    setIsSubmitting(false);

    if (error) alert("Sunucu Hatası: " + error.message);
    else setIsSubmitted(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Araştırma yükleniyor...</div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4"><h2 className="text-2xl font-bold text-gray-800 mb-2">Erişim Engellendi</h2><p className="text-gray-600 text-center">{error}</p></div>;
  if (isSubmitted) return <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4"><h2 className="text-3xl font-bold text-green-700 mb-2">Teşekkürler!</h2><p className="text-green-600 text-center">Yanıtlarınız bilimsel araştırmamız için başarıyla kaydedilmiştir.</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
        
        {/* İlerleme Çubuğu */}
        <div className="h-1.5 bg-gray-200 w-full">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}></div>
        </div>

        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-2xl font-bold leading-tight">{survey.survey_payload.title || "Bilimsel Araştırma"}</h1>
        </div>
        
        <div className="p-6 md:p-10 flex flex-col gap-10 flex-1">
          {(pages[currentPage] || []).map((el: any) => (
            <div key={el.id} className="border-b border-gray-100 pb-10 last:border-0 last:pb-0">
              <QuestionRenderer 
                el={el} 
                answer={answers[el.id]} 
                onChange={(val: any) => handleAnswerChange(el.id, val)} 
                assignedVariation={assignedVariations[el.id]} 
              />
            </div>
          ))}
        </div>

        {validationError && (
          <div className="px-6 py-4 bg-red-50 text-red-600 text-sm font-semibold text-center border-t border-red-100">
            {validationError}
          </div>
        )}

        {/* ALT BUTON ALANI */}
        <div className="p-6 md:px-10 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500 font-medium">Sayfa {currentPage + 1} / {pages.length}</span>
          <button 
            onClick={handleNextPage}
            disabled={isSubmitting}
            className={`px-8 py-3 text-white rounded-lg font-bold transition shadow-sm ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
          >
            {currentPage < pages.length - 1 ? 'İleri' : (isSubmitting ? 'Gönderiliyor...' : 'Yanıtları Gönder')}
          </button>
        </div>

      </div>
    </div>
  );
}