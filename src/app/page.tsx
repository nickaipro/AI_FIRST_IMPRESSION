"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import AnalysisForm from "@/components/AnalysisForm";
import AnalysisReport from "@/components/AnalysisReport";
import type { AnalysisResult } from "@/types";

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleReset = () => {
    // Track: usuario quiere analizar otro sitio
    track("analyze_another");
    setAnalysisResult(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!analysisResult ? (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-block px-4 py-2 bg-primary-100 rounded-full mb-4">
                <span className="text-primary-700 font-semibold text-sm">
                  ✨ Análisis impulsado por IA
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
                AI First Impression
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Analiza tu sitio web desde la perspectiva de tu cliente ideal
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <AnalysisForm onAnalysisComplete={setAnalysisResult} />
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ¿Cómo funciona?
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Ingresa la URL</p>
                        <p className="text-sm text-gray-600">Del sitio web que quieres analizar</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Define tu audiencia</p>
                        <p className="text-sm text-gray-600">¿A quién quieres atraer?</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Objetivo opcional</p>
                        <p className="text-sm text-gray-600">Qué debe hacer el visitante</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Recibe tu análisis</p>
                        <p className="text-sm text-gray-600">Con recomendaciones accionables</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnalysisReport result={analysisResult} onReset={handleReset} />
        )}
      </div>

      <footer className="mt-20 pb-8 text-center">
        <p className="text-sm text-gray-500">
          AI First Impression · Powered by OpenRouter
        </p>
      </footer>
    </main>
  );
}
