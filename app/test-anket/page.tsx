"use client";

import React, { useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { supabase } from "../../src/lib/supabase"; 

const surveyJson = {
  title: "KAPSA & Bilişsel Psikoloji - Sistem Testi",
  description: "Bu anket SurveyJS mantık motoru ve Supabase veritabanı entegrasyonunu test etmektedir.",
  elements: [
    {
      name: "memnuniyet",
      title: "Sistem mimarisinden (React + Supabase) ne kadar memnunsunuz?",
      type: "rating",
      rateMin: 1,
      rateMax: 5,
      minRateDescription: "Hiç Memnun Değilim",
      maxRateDescription: "Çok Memnunum"
    },
    {
      name: "ek_yorum",
      title: "Puanınızı açıklamak ister misiniz?",
      type: "text",
      visibleIf: "{memnuniyet} < 5"
    }
  ]
};

export default function TestAnketSayfasi() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const survey = new Model(surveyJson);
  
  survey.onComplete.add(async (sender) => {
    setIsSubmitting(true);
    const answers = sender.data;
    
    const { data, error } = await supabase
      .from('responses')
      .insert([
        { 
          session_id: crypto.randomUUID(), 
          answer_payload: answers 
        }
      ]);

    if (error) {
      console.error("Veritabanı Hatası:", error);
      alert("Hata: " + error.message);
    } else {
      alert("Başarılı! Cevaplarınız Supabase veritabanına kaydedildi.");
    }
    
    setIsSubmitting(false);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-black py-10">
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        
        {/* SurveyJS'in 2026 standartlarındaki modern temasını doğrudan çekiyoruz */}
        <link rel="stylesheet" href="https://unpkg.com/survey-core/defaultV2.min.css" />
        
        {isSubmitting && (
          <div className="text-center mb-6 text-indigo-600 font-semibold bg-indigo-50 p-3 rounded">
            Buluta kaydediliyor, lütfen bekleyin...
          </div>
        )}
        
        <div className="survey-container">
           <Survey model={survey} />
        </div>
      </div>
    </div>
  );
}