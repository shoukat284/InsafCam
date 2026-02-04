
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AssessmentResult } from "../types";

// Always create a fresh instance if needed, though here we use the global API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts JSON from a string that might contain markdown backticks or extra text.
 */
const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parsing Error. Raw text:", text);
    throw new Error("The response from the specialist was not in a valid format.");
  }
};

export const analyzeVideoFrames = async (frames: string[], latLng?: {latitude: number, longitude: number}): Promise<AssessmentResult> => {
  // MUST use Gemini 2.5 series for Google Maps Grounding
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    You are 'InsafCam', a world-class UN Disaster Assessor and Civil Engineer. 
    Analyze these images from a flood-damaged house in Pakistan. 
    
    1. Technical Damage: Identify cracks, water lines, and structural failures. Be specific (e.g., "Horizontal crack in load-bearing masonry").
    2. Safety: Provide a safetyScore (0-100) where 0 is collapsed and 100 is perfectly safe.
    3. Market Pricing: Use Google Search to find current prices for construction materials (cement, bricks, steel) in Pakistan specifically for flood reconstruction today. 
    4. Nearby Help: Use Google Maps to identify 3 real, active NDMA, PDMA, or UN relief centers or government offices near these coordinates: ${latLng?.latitude}, ${latLng?.longitude}.

    You MUST respond with valid JSON only. Do not add explanations outside the JSON.
    JSON structure:
    {
      "propertyId": "string (unique code)",
      "structuralDamages": [{ "location": "string", "description": "string", "severity": "Minor|Moderate|Severe|Critical" }],
      "requiredMaterials": [{ "item": "string", "quantity": "string", "unit": "string", "estimatedPricePKR": "string" }],
      "urduSummaryScript": "string (A compassionate 2-sentence summary for the homeowner in Urdu script)",
      "pashtoSummaryScript": "string (A compassionate summary in Pashto script)",
      "formalTechnicalNotes": "string (Professional summary for government records)",
      "safetyScore": number,
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
      // Note: Maps grounding is only supported in Gemini 2.5 series.
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: latLng
        }
      }
    }
  });

  const rawText = response.text;
  const result = extractJson(rawText);
  
  // Extract grounding URLs for transparency and utility
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  result.marketSources = chunks
    .filter((c: any) => c.web)
    .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
  
  result.nearbyReliefCenters = chunks
    .filter((c: any) => c.maps)
    .map((c: any) => ({ 
      title: c.maps.title || "Relief Center", 
      uri: c.maps.uri 
    }));

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
