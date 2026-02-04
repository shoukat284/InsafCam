
export interface DamageDetail {
  location: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical';
}

export interface MaterialEstimate {
  item: string;
  quantity: string;
  unit: string;
  estimatedPricePKR?: string;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface AssessmentResult {
  propertyId: string;
  structuralDamages: DamageDetail[];
  requiredMaterials: MaterialEstimate[];
  urduSummaryScript: string;
  pashtoSummaryScript: string;
  formalTechnicalNotes: string;
  safetyScore: number; // 0-100
  isClear: boolean;
  marketSources?: GroundingLink[];
  nearbyReliefCenters?: GroundingLink[];
}

export interface AppState {
  isAnalyzing: boolean;
  isGeneratingAudio: boolean;
  videoPreviewUrl: string | null;
  assessment: AssessmentResult | null;
  error: string | null;
  audioBlob: string | null;
  isLiveMode: boolean;
}
