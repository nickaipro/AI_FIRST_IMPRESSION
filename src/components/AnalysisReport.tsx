"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@vercel/analytics";
import type { AnalysisResult } from "@/types";
import { getGradeTierColor } from "@/lib/rubric";
import FeedbackSection from "./FeedbackSection";

// Lazy-load del componente PDF (solo se carga cuando el usuario descarga)
// PDFReport es un named export, no default
const PDFReport = dynamic(
  () => import("./PDFReport").then(mod => mod.PDFReport),
  { ssr: false }
);

interface AnalysisReportProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function AnalysisReport({ result, onReset }: AnalysisReportProps) {
  const { evaluationSummary, pageContext, dimensionScores, findings, personaInsights, priorityActions, heroRewrite, reasonsToLeave, conversionOpportunities } = result;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const getScoreGradientClass = (score: number) => {
    if (score >= 90) return "bg-gradient-to-br from-emerald-500 to-emerald-600";
    if (score >= 80) return "bg-gradient-to-br from-green-500 to-green-600";
    if (score >= 70) return "bg-gradient-to-br from-blue-500 to-blue-600";
    if (score >= 60) return "bg-gradient-to-br from-yellow-500 to-yellow-600";
    if (score >= 50) return "bg-gradient-to-br from-orange-500 to-orange-600";
    if (score >= 30) return "bg-gradient-to-br from-red-500 to-red-600";
    return "bg-gradient-to-br from-rose-500 to-rose-600";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "critical") return "bg-red-100 text-red-800 border-red-300";
    if (severity === "high") return "bg-orange-100 text-orange-800 border-orange-300";
    if (severity === "medium") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (severity === "low") return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getImpactColor = (impact: string) => {
    if (impact === "high") return "bg-rose-100 text-rose-800 border-rose-300";
    if (impact === "medium") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "easy") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (difficulty === "medium") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-rose-100 text-rose-800 border-rose-300";
  };

  const copyReport = () => {
    const text = `AI First Impression - Análisis Profesional

Score: ${evaluationSummary.totalScore}/100 (${evaluationSummary.gradeTier})
Tiempo de comprensión: ${evaluationSummary.understandingTimeSeconds} segundos

RESUMEN EJECUTIVO:
${evaluationSummary.executiveSummary}

${evaluationSummary.calibrationNote ? `NOTA DE CALIBRACIÓN:\n${evaluationSummary.calibrationNote}\n` : ""}

PUNTAJES POR DIMENSIÓN:
- Claridad: ${dimensionScores.clarity.score}/${dimensionScores.clarity.maxScore}
- Confianza: ${dimensionScores.trust.score}/${dimensionScores.trust.maxScore}
- Conversión: ${dimensionScores.conversion.score}/${dimensionScores.conversion.maxScore}
- UX: ${dimensionScores.ux.score}/${dimensionScores.ux.maxScore}
- Ajuste al nicho: ${dimensionScores.nicheFit.score}/${dimensionScores.nicheFit.maxScore}
- Copy y navegación: ${dimensionScores.copyNavigation.score}/${dimensionScores.copyNavigation.maxScore}

ACCIONES PRIORITARIAS:
${priorityActions.map((action, i) => `${i + 1}. ${action.title} [${action.severity}]\n   ${action.explanation}`).join("\n\n")}

HERO RECOMENDADO:
Título: ${heroRewrite.headline}
Subtítulo: ${heroRewrite.subheadline}
CTA: ${heroRewrite.cta}`;

    navigator.clipboard.writeText(text);
    
    // Track: informe copiado
    track("report_copied", {
      score: evaluationSummary.totalScore,
    });
    
    alert("¡Informe copiado al portapapeles!");
  };

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Lazy-load de @react-pdf/renderer (solo cuando se descarga)
      const { pdf } = await import("@react-pdf/renderer");
      
      // Extraer dominio para el nombre del archivo
      const domain = pageContext.url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `informe-${domain}-${date}.pdf`;
      
      // Fecha formateada para mostrar en el PDF
      const generatedDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Generar el PDF
      const blob = await pdf(
        <PDFReport result={result} generatedDate={generatedDate} />
      ).toBlob();

      // Descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Track: PDF descargado exitosamente
      track("pdf_downloaded", {
        score: evaluationSummary.totalScore,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('No se pudo generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold text-gray-900">Informe profesional</h2>
          <p className="text-gray-600 mt-1">Evaluación basada en rúbrica estructurada</p>
        </div>
        <button
          onClick={onReset}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Analizar otro sitio
        </button>
      </div>

      {/* Score principal */}
      <div className={`${getScoreGradientClass(evaluationSummary.totalScore)} rounded-3xl shadow-xl p-8 text-white`}>
        <div className="text-center">
          <div className="text-8xl font-bold mb-3">
            {evaluationSummary.totalScore}
            <span className="text-4xl opacity-80">/100</span>
          </div>
          <div className="inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 font-bold text-xl mb-4">
            {evaluationSummary.gradeTier}
          </div>
          <p className="text-white/90 text-lg font-medium mt-4">
            Tiempo para entender: <strong className="text-white">{evaluationSummary.understandingTimeSeconds} segundos</strong>
          </p>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Resumen ejecutivo</h3>
        <p className="text-gray-700 leading-relaxed text-lg">{evaluationSummary.executiveSummary}</p>
        
        {evaluationSummary.calibrationNote && (
          <div className="mt-4 p-4 bg-primary-50 border-2 border-primary-200 rounded-xl">
            <p className="text-sm text-primary-900">
              <strong className="font-semibold">Nota de calibración:</strong> {evaluationSummary.calibrationNote}
            </p>
          </div>
        )}
      </div>

      {/* Contexto de la página */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md border-2 border-blue-200 p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Contexto de evaluación</h3>
        <div className="space-y-3 text-sm">
          <p><strong>Público objetivo:</strong> {pageContext.targetAudience}</p>
          {pageContext.pageGoal && <p><strong>Objetivo:</strong> {pageContext.pageGoal}</p>}
          <p><strong>Tipo de página detectado:</strong> {pageContext.detectedPageType}</p>
          
          {pageContext.nicheAssumptions && pageContext.nicheAssumptions.length > 0 && (
            <div>
              <strong className="block mb-2">Consideraciones del nicho:</strong>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                {pageContext.nicheAssumptions.map((assumption, i) => (
                  <li key={i}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Puntajes por dimensión */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-5">Puntajes por dimensión</h3>
        <div className="space-y-4">
          {Object.entries(dimensionScores).map(([key, dimension]) => {
            const percentage = (dimension.score / dimension.maxScore) * 100;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">{key === 'clarity' ? 'Claridad' : key === 'trust' ? 'Confianza' : key === 'conversion' ? 'Conversión' : key === 'ux' ? 'UX' : key === 'nicheFit' ? 'Ajuste al nicho' : 'Copy y navegación'}</span>
                  <span className="text-lg font-bold text-gray-900">{dimension.score}/{dimension.maxScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{dimension.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hallazgos críticos */}
      {findings.filter(f => f.severity === "critical" || f.severity === "high").length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-red-200 p-6">
          <h3 className="text-xl font-bold text-red-700 mb-4">Hallazgos importantes</h3>
          <div className="space-y-4">
            {findings.filter(f => f.severity === "critical" || f.severity === "high").map((finding, i) => (
              <div key={i} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-1 rounded-full border font-bold ${getSeverityColor(finding.severity)}`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <h4 className="font-semibold text-gray-900">{finding.criterionName}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-1">{finding.evidence}</p>
                <p className="text-sm text-blue-700"><strong>Recomendación:</strong> {finding.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones prioritarias */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-5">Acciones prioritarias</h3>
        <div className="space-y-4">
          {priorityActions.slice(0, 5).map((action, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h4 className="font-bold text-gray-900 text-lg">{action.title}</h4>
                <div className="flex gap-2 flex-shrink-0">
                  <span className={`text-xs px-3 py-1.5 rounded-full border-2 font-bold ${getImpactColor(action.impact)}`}>
                    {action.impact === "high" ? "ALTO" : action.impact === "medium" ? "MEDIO" : "BAJO"}
                  </span>
                  <span className={`text-xs px-3 py-1.5 rounded-full border-2 font-bold ${getDifficultyColor(action.difficulty)}`}>
                    {action.difficulty === "easy" ? "FÁCIL" : action.difficulty === "medium" ? "MEDIO" : "DIFÍCIL"}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 mb-2">{action.explanation}</p>
              {action.exampleFix && (
                <p className="text-sm text-primary-700 bg-primary-50 p-3 rounded-lg"><strong>Ejemplo:</strong> {action.exampleFix}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hero recomendado */}
      <div className="bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl shadow-md border-2 border-primary-200 p-8">
        <h3 className="text-2xl font-bold text-primary-900 mb-6">
          Reescritura recomendada del hero
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-2 uppercase tracking-wide">Título</label>
            <p className="text-2xl font-bold text-gray-900">{heroRewrite.headline}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-2 uppercase tracking-wide">Subtítulo</label>
            <p className="text-lg text-gray-700">{heroRewrite.subheadline}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-2 uppercase tracking-wide">Call to Action</label>
            <button className="px-8 py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-colors">
              {heroRewrite.cta}
            </button>
          </div>
        </div>
      </div>

      {/* Insights de personas */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-5">Perspectivas por perfil</h3>
        <div className="space-y-4">
          {personaInsights.map((insight, i) => (
            <div key={i} className="border-l-4 border-primary-500 pl-5 py-3 bg-gray-50 rounded-r-xl">
              <h4 className="font-bold text-gray-900 mb-2">{insight.persona}</h4>
              <p className="text-sm text-gray-600 mb-1.5">
                <strong>Primera reacción:</strong> {insight.firstReaction}
              </p>
              <p className="text-sm text-gray-600 mb-1.5">
                <strong>Sobre confianza:</strong> {insight.trustReaction}
              </p>
              <p className="text-sm text-gray-600 mb-1.5">
                <strong>Preocupación:</strong> {insight.mainConcern}
              </p>
              <p className="text-sm text-primary-700 font-medium">
                <strong>Recomendación:</strong> {insight.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Razones de abandono */}
      {reasonsToLeave.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-amber-200 p-6">
          <h3 className="text-xl font-bold text-amber-700 mb-4">Razones potenciales de abandono</h3>
          <ul className="space-y-3">
            {reasonsToLeave.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-amber-500 mt-1">→</span>
                <div>
                  <span className="text-gray-700">{item.reason}</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full border ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Oportunidades de conversión */}
      {conversionOpportunities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-primary-200 p-6">
          <h3 className="text-xl font-bold text-primary-700 mb-4">Oportunidades de conversión</h3>
          <ul className="space-y-3">
            {conversionOpportunities.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">💡</span>
                <div>
                  <span className="text-gray-700">{item.opportunity}</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full border ${getImpactColor(item.expectedImpact)}`}>
                    Impacto: {item.expectedImpact}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sección de feedback */}
      <FeedbackSection
        analyzedDomain={(() => {
          try {
            const parsedUrl = new URL(pageContext.url);
            return parsedUrl.hostname.replace(/^www\./, "");
          } catch {
            return "unknown";
          }
        })()}
        score={evaluationSummary.totalScore}
        pageType={pageContext.detectedPageType}
        targetAudience={pageContext.targetAudience}
      />

      {/* Botones de acción */}
      <div className="flex gap-4">
        <button
          onClick={copyReport}
          className="flex-1 px-6 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
        >
          📋 Copiar informe
        </button>
        <button
          onClick={downloadPDF}
          disabled={isGeneratingPDF}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPDF ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generando PDF...
            </span>
          ) : (
            "📄 Descargar PDF"
          )}
        </button>
        <button
          onClick={onReset}
          className="px-6 py-4 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Analizar otro sitio
        </button>
      </div>
    </div>
  );
}
