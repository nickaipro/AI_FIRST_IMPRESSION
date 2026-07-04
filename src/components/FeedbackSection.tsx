"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

interface FeedbackSectionProps {
  analyzedDomain: string;
  score: number;
  pageType?: string;
  targetAudience: string;
}

type Rating = "useful" | "not_useful" | null;
type SubmissionState = "idle" | "sending" | "success" | "error";

export default function FeedbackSection({
  analyzedDomain,
  score,
  pageType,
  targetAudience,
}: FeedbackSectionProps) {
  const [rating, setRating] = useState<Rating>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRatingClick = async (selectedRating: "useful" | "not_useful") => {
    setRating(selectedRating);
    setErrorMessage("");

    // Enviar rating inmediatamente al backend
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          analyzedDomain,
          score,
          pageType,
          targetAudience,
        }),
      });

      // Track el voto inicial (sin esperar respuesta para no bloquear UX)
      try {
        track("feedback_submitted", {
          rating: selectedRating,
          hasComment: false,
          hasEmail: false,
        });
      } catch {
        // Silenciar errores de analytics
      }
    } catch (error) {
      console.error("Error al enviar rating inicial:", error);
      // No mostramos error aquí porque el usuario puede seguir completando el formulario
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionState("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          email: email.trim() || null,
          analyzedDomain,
          score,
          pageType,
          targetAudience,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar feedback");
      }

      setSubmissionState("success");

      // Track feedback completo
      try {
        track("feedback_submitted", {
          rating: rating!,
          hasComment: Boolean(comment.trim()),
          hasEmail: Boolean(email.trim()),
        });
      } catch {
        // Silenciar errores de analytics
      }
    } catch (error) {
      console.error("Error al enviar feedback:", error);
      setSubmissionState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo enviar. Intenta de nuevo."
      );
    }
  };

  // Si ya se envió con éxito, mostrar mensaje de agradecimiento
  if (submissionState === "success") {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl shadow-md border-2 border-primary-200 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-primary-900 mb-2">
            ¡Gracias por tu feedback!
          </h3>
          <p className="text-primary-700">
            Lo tendremos en cuenta para seguir mejorando.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl shadow-md border-2 border-primary-200 p-6 sm:p-8">
      <h3 className="text-xl sm:text-2xl font-bold text-primary-900 mb-6 text-center">
        ¿Qué te pareció este análisis?
      </h3>

      {/* Botones de rating */}
      {!rating ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleRatingClick("useful")}
            className="flex-1 sm:flex-none px-8 py-4 bg-white hover:bg-primary-100 border-2 border-primary-300 hover:border-primary-500 rounded-xl font-bold text-primary-900 transition-all shadow-sm hover:shadow-md text-lg"
          >
            👍 Útil
          </button>
          <button
            onClick={() => handleRatingClick("not_useful")}
            className="flex-1 sm:flex-none px-8 py-4 bg-white hover:bg-amber-50 border-2 border-amber-300 hover:border-amber-500 rounded-xl font-bold text-amber-900 transition-all shadow-sm hover:shadow-md text-lg"
          >
            👎 No tanto
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Indicador de selección */}
          <div className="text-center p-4 bg-white/60 rounded-xl border-2 border-primary-200">
            <p className="font-semibold text-primary-900">
              {rating === "useful"
                ? "👍 Marcaste este análisis como útil"
                : "👎 Marcaste este análisis como poco útil"}
            </p>
            <button
              onClick={() => {
                setRating(null);
                setComment("");
                setEmail("");
                setErrorMessage("");
              }}
              className="text-sm text-primary-600 hover:text-primary-800 underline mt-2"
            >
              Cambiar respuesta
            </button>
          </div>

          {/* Formulario opcional */}
          <form onSubmit={handleSubmitDetails} className="space-y-4">
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-semibold text-primary-900 mb-2"
              >
                {rating === "useful"
                  ? "¿Qué fue lo más útil?"
                  : "¿Qué esperabas que no encontraste?"}
                <span className="text-primary-600 font-normal ml-1">
                  (opcional)
                </span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Cuéntanos más..."
                className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
                disabled={submissionState === "sending"}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-primary-900 mb-2"
              >
                {rating === "useful"
                  ? "¿Podemos escribirte para entender mejor tu caso?"
                  : "¿Quieres que te avisemos cuando lo mejoremos?"}
                <span className="text-primary-600 font-normal ml-1">
                  (opcional)
                </span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                disabled={submissionState === "sending"}
              />
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-sm text-red-800 font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submissionState === "sending"}
              className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submissionState === "sending" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar feedback"
              )}
            </button>

            <p className="text-xs text-center text-primary-700">
              También puedes omitir esto. Ya registramos tu voto inicial.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
