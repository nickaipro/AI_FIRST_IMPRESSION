"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types";

interface AnalysisFormProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export default function AnalysisForm({ onAnalysisComplete }: AnalysisFormProps) {
  const [url, setUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [pageGoal, setPageGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          targetAudience,
          pageGoal: pageGoal || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "El análisis falló");
      }

      onAnalysisComplete(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              URL del sitio web <span className="text-primary-600">*</span>
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Incluye http:// o https://
            </p>
          </div>

          <div>
            <label
              htmlFor="targetAudience"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Público objetivo <span className="text-primary-600">*</span>
            </label>
            <input
              type="text"
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="ej: dueños de pequeñas empresas, gerentes de marketing, diseñadores freelance"
              required
              minLength={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              ¿A quién está dirigido este sitio web?
            </p>
          </div>

          <div>
            <label
              htmlFor="pageGoal"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Objetivo de la página <span className="text-gray-400">(Opcional)</span>
            </label>
            <input
              type="text"
              id="pageGoal"
              value={pageGoal}
              onChange={(e) => setPageGoal(e.target.value)}
              placeholder="ej: agendar una demo, comprar un producto, suscribirse al newsletter"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              ¿Qué deberían hacer los visitantes?
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analizando primera impresión...
              </span>
            ) : (
              "Analizar mi web"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
