
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartDiagnosis = async (brand: string, model: string, problem: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um técnico sênior de manutenção de dispositivos móveis. 
      Baseado no aparelho "${brand} ${model}" e no problema relatado pelo cliente: "${problem}", 
      forneça um breve diagnóstico técnico (máximo 3 frases) e uma estimativa de peças necessárias.
      Responda em Português do Brasil.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Não foi possível gerar um diagnóstico automático no momento.";
  }
};
