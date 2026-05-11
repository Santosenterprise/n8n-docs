export type Phase = 1 | 2 | 3;

export interface ConfidenceFlag {
  aspect: string;
  score: number;
  note: string;
}

export interface AssumedFlag {
  assumption: string;
  confidence: number;
}

export interface Gap {
  id: number;
  description: string;
  resolved: boolean;
  resolution: string | null;
}

export interface PromptPackageJSON {
  objective: {
    primary: string;
    success_criteria: string[];
    constraints: string[];
  };
  context: {
    domain: string;
    audience: string;
    background: string;
  };
  instructions: Array<{ id: number; text: string }>;
  output_format: {
    format: string;
    examples: string;
  };
  metadata: {
    confidence_score: number;
    gaps_resolved: number;
    assumptions_made: string[];
    version: string;
    created_at: string;
  };
}

export interface PromptPackage {
  xml: string;
  json: PromptPackageJSON;
}

export interface AIResponse {
  phase: Phase;
  message: string;
  confidence_flags: ConfidenceFlag[];
  assumed_flags: AssumedFlag[];
  gaps?: Gap[];
  phase_complete: boolean;
  prompt_package?: PromptPackage;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed?: AIResponse;
  timestamp: number;
}

export interface SessionState {
  messages: ChatMessage[];
  phase: Phase;
  gaps: Gap[];
  phaseApproved: boolean;
  exportApproved: boolean;
  promptPackage: PromptPackage | null;
}
