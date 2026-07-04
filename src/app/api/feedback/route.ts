import { NextRequest, NextResponse } from "next/server";

interface FeedbackPayload {
  rating: "useful" | "not_useful";
  comment?: string | null;
  email?: string | null;
  analyzedDomain: string;
  score: number;
  pageType?: string;
  targetAudience: string;
  timestamp: string;
}

// Validación básica de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar payload
    if (!body.rating || !["useful", "not_useful"].includes(body.rating)) {
      return NextResponse.json(
        { error: "Rating inválido. Debe ser 'useful' o 'not_useful'" },
        { status: 400 }
      );
    }

    if (!body.analyzedDomain || !body.score || !body.targetAudience) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validar email si viene
    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn(
        "⚠️  FEEDBACK_WEBHOOK_URL no está configurada. El feedback no se enviará."
      );
      return NextResponse.json(
        {
          error:
            "El webhook de feedback no está configurado. Contacta al administrador.",
        },
        { status: 503 }
      );
    }

    // Preparar payload limpio
    const payload: FeedbackPayload = {
      rating: body.rating,
      comment: body.comment || null,
      email: body.email || null,
      analyzedDomain: body.analyzedDomain,
      score: body.score,
      pageType: body.pageType || "unknown",
      targetAudience: body.targetAudience,
      timestamp: new Date().toISOString(),
    };

    // Enviar al webhook con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `❌ Webhook respondió con status ${response.status}:`,
          await response.text()
        );
        return NextResponse.json(
          { error: "Error al enviar feedback al webhook" },
          { status: 502 }
        );
      }

      console.log(
        `✅ Feedback enviado exitosamente: ${payload.rating} (${payload.analyzedDomain})`
      );

      return NextResponse.json({
        success: true,
        message: "Feedback enviado correctamente",
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("❌ Timeout al enviar feedback al webhook");
        return NextResponse.json(
          { error: "El webhook tardó demasiado en responder" },
          { status: 504 }
        );
      }

      console.error("❌ Error al enviar feedback al webhook:", fetchError);
      return NextResponse.json(
        { error: "Error de red al enviar feedback" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("❌ Error procesando feedback:", error);
    return NextResponse.json(
      { error: "Error interno al procesar feedback" },
      { status: 500 }
    );
  }
}
