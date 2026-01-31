
export interface DamageDetail {
  location: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical';
}

export interface MaterialEstimate {
  item: string;
  quantity: string;
  unit: string;
}

export interface AssessmentResult {
  propertyId: string;
  structuralDamages: DamageDetail[];
  requiredMaterials: MaterialEstimate[];
  urduSummaryScript: string;
  pashtoSummaryScript: string;
  formalTechnicalNotes: string;
  isClear: boolean;
}

export interface AppState {
  isAnalyzing: boolean;
  isGeneratingAudio: boolean;
  videoPreviewUrl: string | null;
  assessment: AssessmentResult | null;
  error: string | null;
  audioBlob: string | null;
}
