"use client";

import type { PromptPackage } from "@/lib/types";
import { downloadFile } from "@/lib/parser";

interface ExportButtonProps {
  promptPackage: PromptPackage;
  disabled?: boolean;
}

export default function ExportButton({ promptPackage, disabled }: ExportButtonProps) {
  function exportXML() {
    downloadFile(promptPackage.xml, "prompt_package.xml", "application/xml");
  }

  function exportJSON() {
    downloadFile(
      JSON.stringify(promptPackage.json, null, 2),
      "prompt_package.json",
      "application/json"
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportXML}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <span>⬇</span> Export XML
      </button>
      <button
        onClick={exportJSON}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <span>⬇</span> Export JSON
      </button>
    </div>
  );
}
