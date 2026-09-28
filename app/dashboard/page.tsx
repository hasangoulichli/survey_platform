"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase"; 
import { FileText, Plus, Copy, ExternalLink, Download, Trash2, Edit, Play, Pause, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

type Survey = {
  id: string;
  title: string;
  created_at: string;
  response_count?: number;
  is_active: boolean;
  expires_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Silme işlemi için State: step 0 (normal), 1 (Emin misiniz?), 2 (Son karar mı?)
  const [deleteInfo, setDeleteInfo] = useState({ id: null as string | null, step: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else fetchSurveys();
    });
  }, [router]);

  async function fetchSurveys() {
    setLoading(true);
    const { data: surveyData, error: surveyError } = await supabase
      .from("surveys")
      .select("id, title, created_at, is_active, expires_at")
      .order("created_at", { ascending: false });

    if (surveyError || !surveyData) {
      console.error("Anketler çekilemedi:", surveyError);
      setLoading(false);
      return;
    }

    const surveysWithCounts = await Promise.all(
      surveyData.map(async (survey) => {
        const { count } = await supabase.from("responses").select("*", { count: "exact", head: true }).eq("survey_id", survey.id);
        return { ...survey, response_count: count || 0 };
      })
    );

    setSurveys(surveysWithCounts);
    setLoading(false);
  }

  // 1. AKTİF/PASİF YAPMA
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('surveys').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setSurveys(surveys.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  // 3. TARİH GÜNCELLEME
  const updateExpiry = async (id: string, dateStr: string) => {
    const { error } = await supabase.from('surveys').update({ expires_at: dateStr || null }).eq('id', id);
    if (!error) {
      setSurveys(surveys.map(s => s.id === id ? { ...s, expires_at: dateStr } : s));
    }
  };

  // 4. İKİ AŞAMALI SİLME İŞLEMİ
  const handleDelete = async (id: string) => {
    if (deleteInfo.id !== id) {
      setDeleteInfo({ id, step: 1 }); // 1. Tıklama
      return;
    }
    if (deleteInfo.step === 1) {
      setDeleteInfo({ id, step: 2 }); // 2. Tıklama
      return;
    }
    if (deleteInfo.step === 2) {
      // 3. Tıklama (Veritabanından tamamen sil)
      await supabase.from('responses').delete().eq('survey_id', id); // Önce yanıtları sil
      await supabase.from('surveys').delete().eq('id', id); // Sonra anketi sil
      setSurveys(surveys.filter(s => s.id !== id));
      setDeleteInfo({ id: null, step: 0 });
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    alert("Katılımcı linki panoya kopyalandı:\n" + url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Araştırmacı Paneli</h1>
            <p className="text-gray-500 mt-1">Araştırmalarınızı yönetin, tarihleri belirleyin ve veri toplayın.</p>
          </div>
          <Link href="/builder">
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm">
              <Plus size={20} /> Yeni Anket Tasarla
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Sistem verileri yükleniyor...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Henüz hiç anketiniz yok</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div key={survey.id} className={`bg-white p-6 rounded-xl border transition flex flex-col ${survey.is_active ? 'border-indigo-200 shadow-md' : 'border-gray-200 opacity-80'}`}>
                
                {/* ÜST BÖLÜM: BAŞLIK, DURUM VE SİLME */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2" title={survey.title}>
                      {survey.title}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1">Oluşturulma: {new Date(survey.created_at).toLocaleDateString("tr-TR")}</div>
                  </div>
                  
                  {/* SİLME BUTONU (ÇİFT ONAYLI) */}
                  <div className="flex flex-col items-end">
                    <button 
                      onClick={() => handleDelete(survey.id)}
                      onMouseLeave={() => setDeleteInfo({ id: null, step: 0 })}
                      className={`text-xs px-2 py-1 rounded font-bold transition ${deleteInfo.id === survey.id && deleteInfo.step === 1 ? 'bg-orange-100 text-orange-600' : deleteInfo.id === survey.id && deleteInfo.step === 2 ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      {deleteInfo.id === survey.id && deleteInfo.step === 1 ? 'Emin misiniz?' : deleteInfo.id === survey.id && deleteInfo.step === 2 ? 'Tüm veriler silinecek!' : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>

                {/* ORTA BÖLÜM: AKTİF/PASİF VE TARİH */}
                <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Durum:</span>
                    <button 
                      onClick={() => toggleStatus(survey.id, survey.is_active)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${survey.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {survey.is_active ? <><Play size={12}/> Veri Toplanıyor</> : <><Pause size={12}/> İnaktif</>}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Calendar size={14}/> Bitiş:</span>
                    <input 
                      type="date" 
                      value={survey.expires_at ? survey.expires_at.split('T')[0] : ''} 
                      onChange={(e) => updateExpiry(survey.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* ALT BÖLÜM: YANIT SAYISI VE BUTONLAR */}
                <div className="mt-auto border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-indigo-50 text-indigo-700 py-1 px-3 rounded-full text-sm font-bold">
                      {survey.response_count} Yanıt
                    </span>
                    {/* DÜZENLE BUTONU */}
                    <button onClick={() => alert("Anket düzenleme modülü (Builder-Edit) yakında eklenecektir.")} className="text-gray-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium">
                      <Edit size={16}/> Düzenle
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button onClick={() => copyToClipboard(survey.id)} disabled={!survey.is_active} className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold transition ${survey.is_active ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                      <Copy size={18} /> Linki Kopyala
                    </button>
                    
                    <div className="flex gap-2">
                      <Link href={`/s/${survey.id}`} target="_blank" className="flex-1">
                        <button className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition">
                          <ExternalLink size={18} /> Gör
                        </button>
                      </Link>
                      
                      <button onClick={() => window.open(`https://survey-api-kyse.onrender.com/export/csv/${survey.id}`, '_blank')} className="flex items-center justify-center gap-2 flex-1 py-2.5 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition">
                        <Download size={18} /> CSV
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}