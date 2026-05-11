import type { AIResponse } from "./types";

export function parseAIResponse(raw: string): AIResponse | null {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.phase === "number" &&
      typeof parsed.message === "string" &&
      Array.isArray(parsed.confidence_flags) &&
      Array.isArray(parsed.assumed_flags)
    ) {
      return parsed as AIResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateXMLExport(xml: string): string {
  return xml;
}

export function generateJSONExport(json: object): string {
  return JSON.stringify(json, null, 2);
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
