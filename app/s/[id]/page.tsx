"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // URL'deki id'yi almak için
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { supabase } from "../../../src/lib/supabase";
// Not: Klasör derine indiği için ../ sayısını bir artırdık. Hata verirse "../../../src/lib/supabase" deneyin.

export default function KatilimciEkrani() {
  const params = useParams();
  const surveyId = params.id; // URL'deki [id] kısmını yakalar

  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function fetchSurvey() {
      if (!surveyId) return;

      // 1. URL'deki ID'ye göre anketi veritabanından çek
      const { data, error } = await supabase
        .from("surveys")
        .select("survey_payload")
        .eq("id", surveyId)
        .single(); // Sadece tek bir eşleşme getir

      if (error || !data) {
        setError("Anket bulunamadı, adresi yanlış yazmış olabilirsiniz veya anket yayından kaldırılmış olabilir.");
        setLoading(false);
        return;
      }

      // 2. Gelen JSON şemasıyla SurveyJS motorunu başlat
      const model = new Model(data.survey_payload);

      // 3. Katılımcı anketi bitirdiğinde çalışacak kayıt mekanizması
      model.onComplete.add(async (sender) => {
        const answers = sender.data;
        
        await supabase
          .from("responses")
          .insert([
            {
              survey_id: surveyId, // Hangi anket olduğunu kaydediyoruz
              session_id: crypto.randomUUID(),
              answer_payload: answers
            }
          ]);
          
        setIsCompleted(true);
      });

      setSurveyModel(model);
      setLoading(false);
    }

    fetchSurvey();
  }, [surveyId]);

  // Ekran Durumları (Yükleniyor, Hata, Bitti)
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Anket yükleniyor...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600 font-medium">{error}</div>;
  if (isCompleted) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-green-600 font-bold text-xl">Katılımınız için teşekkürler. Yanıtlarınız kaydedildi.</div>;
  if (!surveyModel) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-black py-10">
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        
        {/* SurveyJS Modern Teması */}
        <link rel="stylesheet" href="https://unpkg.com/survey-core/defaultV2.min.css" />
        
        <div className="survey-container">
           <Survey model={surveyModel} />
        </div>
        
      </div>
    </div>
  );
}