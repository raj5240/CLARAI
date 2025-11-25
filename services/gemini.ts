import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey =
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_KEY : undefined) ||
  (globalThis as { process?: { env?: { API_KEY?: string } } }).process?.env?.API_KEY ||
  (globalThis as { API_KEY?: string }).API_KEY ||
  "AIzaSyCLxaeC1L3uIevkZpmM0OJ168ICzrWi4Xw";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const getClient = () => {
  if (!apiKey) {
    console.warn("Gemini API key not found. Set API_KEY to enable AI features.");
    return null;
  }
  return ai;
};

export const generateThinkingResponse = async (prompt: string): Promise<string> => {
  try {
    const client = getClient();
    if (!client) {
      return "Gemini API key is missing. Update your environment to enable responses.";
    }

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Reduce budget for faster responses
      },
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Thinking generation failed:", error);
    throw error;
  }
};

export const generateQuickResponse = async (prompt: string): Promise<string> => {
  try {
    const client = getClient();
    if (!client) {
      return "Gemini API key is missing. Update your environment to enable responses.";
    }

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Quick generation failed:", error);
    throw error;
  }
};

export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const client = getClient();
    if (!client) {
      return "Gemini API key is missing. Update your environment to enable image analysis.";
    }

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt || "Describe this image in detail." },
        ],
      },
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Vision analysis failed:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const client = getClient();
    if (!client) {
      throw new Error("Gemini API key is missing. Update your environment to generate images.");
    }

    const response = await client.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9', // Cinematic default
        outputMimeType: 'image/jpeg'
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      throw new Error("No image data returned");
    }

    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};