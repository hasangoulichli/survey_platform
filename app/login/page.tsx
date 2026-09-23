"use client";

import React, { useState } from "react";
import { supabase } from "../../src/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Giriş başarısız. E-posta veya şifre hatalı.");
      setLoading(false);
    } else {
      // Giriş başarılıysa paneli aç
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <Lock size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">KAPSA Platformu</h2>
        <p className="text-center text-gray-500 mb-8">Araştırmacı paneline erişmek için giriş yapın.</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-medium transition ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}