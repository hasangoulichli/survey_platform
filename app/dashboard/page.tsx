"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase"; 
import { FileText, Plus, Copy, ExternalLink, Download } from "lucide-react";
import { useRouter } from "next/navigation";

type Survey = {
  id: string;
  title: string;
  created_at: string;
  response_count?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  // Güvenlik Kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      }
    });
  }, [router]);

  // Anketleri Çekme İşlemi
  useEffect(() => {
    async function fetchSurveys() {
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (surveyError || !surveyData) {
        console.error("Anketler çekilemedi:", surveyError);
        setLoading(false);
        return;
      }

      const surveysWithCounts = await Promise.all(
        surveyData.map(async (survey) => {
          const { count } = await supabase
            .from("responses")
            .select("*", { count: "exact", head: true })
            .eq("survey_id", survey.id);

          return {
            ...survey,
            response_count: count || 0,
          };
        })
      );

      setSurveys(surveysWithCounts);
      setLoading(false);
    }

    fetchSurveys();
  }, []);

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    alert("Katılımcı linki panoya kopyalandı:\n" + url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Araştırmacı Paneli</h1>
            <p className="text-gray-500 mt-1">Psikoloji çalışmalarınızı ve toplanan verileri buradan yönetin.</p>
          </div>
          <Link href="/builder">
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm">
              <Plus size={20} />
              Yeni Anket Tasarla
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Sistem verileri yükleniyor...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Henüz hiç anketiniz yok</h3>
            <p className="text-gray-500 mt-1">Hemen yeni bir tasarım oluşturarak veri toplamaya başlayın.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div key={survey.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" title={survey.title}>
                  {survey.title || "İsimsiz Anket"}
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  Oluşturulma: {new Date(survey.created_at).toLocaleDateString("tr-TR")}
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-full text-sm font-semibold">
                      {survey.response_count} Yanıt Toplandı
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => copyToClipboard(survey.id)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition"
                    >
                      <Copy size={18} /> Katılımcı Linkini Kopyala
                    </button>
                    
                    <div className="flex gap-2">
                      <Link href={`/s/${survey.id}`} target="_blank" className="flex-1">
                        <button className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition">
                          <ExternalLink size={18} /> Anketi Gör
                        </button>
                      </Link>
                      
                      <button 
                        onClick={() => window.open(`https://survey-api-kyse.onrender.com/api/export_csv/${survey.id}`, '_blank')}
                        className="flex items-center justify-center gap-2 flex-1 py-2.5 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition"
                      >
                        <Download size={18} /> Veriyi İndir
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