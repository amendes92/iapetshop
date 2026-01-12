import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PetShopLead, LeadScore, SeoAudit, ColdEmail, Objection, RoadmapStep } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. STRATEGY (Existing)
export const generateBusinessSolutions = async (lead: PetShopLead): Promise<string> => {
  const ai = getAiClient();
  const promptContext = `
    Analise os dados deste Pet Shop (Lead): ${JSON.stringify(lead)}
    Atue como consultor. Gere:
    1. **Análise Rápida**: Potencial do local.
    2. **3 Estratégias de Marketing**.
    3. **2 Melhorias Operacionais**.
    Use Markdown.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptContext,
  });

  return response.text || "Sem resposta.";
};

// 2. MARKETING CONTENT (Existing)
export const generateMarketingContent = async (
  lead: PetShopLead,
  platform: string,
  topic: string,
  tone: string
): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    Atue como Copywriter. Crie post para ${platform}, tom ${tone}, tema ${topic}.
    Cliente: ${JSON.stringify(lead)}.
    Retorne apenas o texto final com emojis.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Erro ao gerar.";
};

// 3. LEAD SCORING (Existing)
export const generateLeadScore = async (lead: PetShopLead): Promise<LeadScore> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise este lead e dê uma nota de 0 a 100 de chance de conversão para serviços de marketing digital. Dados: ${JSON.stringify(lead)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          label: { type: Type.STRING, description: "Ex: Quente, Morno, Frio" },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No score generated");
  return JSON.parse(text) as LeadScore;
};

// 4. COMPETITOR INTEL (Existing)
export const searchCompetitors = async (lead: PetShopLead): Promise<string> => {
  const ai = getAiClient();
  const city = lead.cidade || lead.city || "Brasil";
  const prompt = `Encontre os 3 principais concorrentes de pet shops em ${city}. Liste seus nomes e um diferencial de cada. Se o Google Search for usado, inclua os links.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  let text = response.text || "";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    text += "\n\n**Fontes Encontradas:**\n";
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        text += `- [${chunk.web.title}](${chunk.web.uri})\n`;
      }
    });
  }
  return text;
};

// 5. VISUAL BRANDING (Existing)
export const generateLogoConcept = async (lead: PetShopLead): Promise<string> => {
  const ai = getAiClient();
  const name = lead.business_name || "Pet Shop";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A modern, minimalist vector logo for a pet shop named "${name}". Cute, friendly, vibrant colors.` }
      ]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 6. AUDIO BRIEFING (Fixed: Text -> Audio)
export const generateAudioBriefing = async (lead: PetShopLead): Promise<string> => {
  const ai = getAiClient();
  const name = lead.business_name || "este cliente";
  const city = lead.cidade || "sua cidade";

  // Step 1: Generate Script
  const scriptResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Escreva um texto curto (apenas 2 frases) resumindo o pet shop "${name}" de ${city} para um vendedor. Seja direto. Apenas o texto.`,
  });
  const scriptText = scriptResponse.text || `Resumo do cliente ${name}.`;

  // Step 2: Generate Audio
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: scriptText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("No audio generated");
  return audioData;
};

// 7. SALES SIMULATOR (Existing)
export const createSalesChat = (lead: PetShopLead) => {
  const ai = getAiClient();
  const name = lead.business_name || "Dono do Pet Shop";
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `Você é o dono do pet shop "${name}". Você está ocupado, um pouco cético com vendedores de marketing, mas precisa de mais clientes. Responda de forma curta e natural.`,
    },
  });
};

// 8. SEO AUDIT (New)
export const generateSeoAudit = async (lead: PetShopLead): Promise<SeoAudit> => {
  const ai = getAiClient();
  const city = lead.cidade || "Brasil";
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma auditoria SEO simplificada para um Pet Shop em ${city}. Retorne JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  });
  return JSON.parse(response.text || "{}") as SeoAudit;
};

// 9. COLD EMAIL GENERATOR (New)
export const generateColdEmail = async (lead: PetShopLead): Promise<ColdEmail> => {
  const ai = getAiClient();
  const name = lead.business_name || "Parceiro";
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Escreva um email frio de vendas para o pet shop ${name}. Curto e persuasivo. Retorne JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          body: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text || "{}") as ColdEmail;
};

// 10. OBJECTION HANDLING (New)
export const generateObjections = async (lead: PetShopLead): Promise<Objection[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste 3 possíveis objeções de venda para este pet shop e como responder. Retorne JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
          }
        },
      },
    },
  });
  return JSON.parse(response.text || "[]") as Objection[];
};