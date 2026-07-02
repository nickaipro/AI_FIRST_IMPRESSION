import { NextRequest, NextResponse } from "next/server";
import { analysisRequestSchema } from "@/lib/validation";
import { performAnalysis } from "@/lib/analyzer";
import type { AnalysisResponse } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = analysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    const { url, targetAudience, pageGoal } = validationResult.data;

    const analysis = await performAnalysis(url, targetAudience, pageGoal);

    return NextResponse.json<AnalysisResponse>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
