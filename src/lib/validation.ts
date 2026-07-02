import { z } from "zod";

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

export const urlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();
      
      for (const pattern of PRIVATE_IP_RANGES) {
        if (pattern.test(hostname)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  },
  {
    message:
      "URL must use http/https and cannot be localhost or a private IP address",
  }
);

export const analysisRequestSchema = z.object({
  url: urlSchema,
  targetAudience: z.string().min(3, "Target audience must be at least 3 characters"),
  pageGoal: z.string().optional(),
});

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    urlSchema.parse(url);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid URL" };
  }
}
