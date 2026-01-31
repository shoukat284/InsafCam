
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AssessmentResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVideoFrames = async (frames: string[]): Promise<AssessmentResult> => {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    You are 'InsafCam', a world-class UN Disaster Assessor and Civil Engineer. 
    Analyze these images taken from a flood-damaged house in Pakistan. 
    
    CRITICAL INSTRUCTIONS:
    1. Be highly technical and specific. Do not use vague terms like 'damaged wall'. Use terms like '4-meter diagonal shear crack on Load-bearing North Wall'.
    2. Identify specific indicators like 'Water line at 1.2m height' or 'Roof truss deformation'.
    3. Estimate construction materials (bricks, cement bags, rebar, sand) required for restoration based on standard Pakistani masonry practices.
    4. Provide a compassionate summary script in simple Urdu and Pashto for an illiterate homeowner. 
    5. If the images are too blurry or lack detail, set isClear to false.

    Response must be valid JSON matching this schema:
    {
      "propertyId": "string (generate unique code)",
      "structuralDamages": [{ "location": "string", "description": "string", "severity": "Minor|Moderate|Severe|Critical" }],
      "requiredMaterials": [{ "item": "string", "quantity": "string", "unit": "string" }],
      "urduSummaryScript": "string (Urdu text script)",
      "pashtoSummaryScript": "string (Pashto text script)",
      "formalTechnicalNotes": "string (Professional summary for NDMA officer)",
      "isClear": boolean
    }
  `;

  const imageParts = frames.map(f => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: f.split(',')[1]
    }
  }));

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...imageParts, { text: prompt }] },
    config: {
      responseMimeType: "application/json"
    }
  });

  const result = JSON.parse(response.text || '{}');
  return result as AssessmentResult;
};

export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this summary compassionately in Urdu: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
};
