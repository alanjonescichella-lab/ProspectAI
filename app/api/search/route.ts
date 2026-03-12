import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const searchSchema = z.object({
  icp: z.string().min(1).max(500),
  service: z.string().min(1).max(500),
  state: z.string().min(1).max(50),
  city: z.string().max(100).default(""),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos: " + parsed.error.issues.map(i => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { icp, service, state, city } = parsed.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const locationStr = city ? `${city}, ${state}, Brasil` : `${state}, Brasil`;

    const prompt = `
      Você é um especialista em prospecção B2B.
      O usuário está procurando por leads com o seguinte Perfil de Cliente Ideal (ICP): "${icp}".
      A localização alvo é: "${locationStr}".
      O usuário oferece o seguinte serviço: "${service}".

      Use o Google Maps para encontrar pelo menos 100 negócios reais que correspondam a este ICP nesta localização.

      Para cada negócio encontrado, forneça os seguintes dados em formato JSON estrito (uma array de objetos):
      [
        {
          "id": "um identificador único gerado por você",
          "name": "Nome do negócio",
          "address": "Endereço completo",
          "city": "Cidade",
          "state": "Estado",
          "rating": 4.5,
          "userRatingCount": 120,
          "primaryType": "Categoria principal",
          "nationalPhoneNumber": "Telefone se disponível, ou null",
          "websiteUri": "Website se disponível, ou null",
          "googleMapsUri": "Link do Google Maps se disponível, ou null",
          "digitalPainScore": um número de 0 a 100 (onde 100 é a maior oportunidade para vender o serviço. Dê pontos por falta de site, poucas fotos, nota baixa, poucas avaliações, sem telefone, etc),
          "aiSummary": "Resumo de oportunidade de no máximo 3 linhas em português (pt-BR), explicando por que este negócio é um bom lead para o serviço oferecido."
        }
      ]

      Retorne APENAS o JSON válido, sem blocos de código markdown (\`\`\`json) e sem texto adicional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.2,
      },
    });

    let text = response.text || "[]";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let searchResults = [];
    try {
      searchResults = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        searchResults = JSON.parse(match[0]);
      } else {
        throw new Error("Resposta inválida do Gemini");
      }
    }

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps?.uri && chunk.maps?.title) {
          const matchedResult = searchResults.find(
            (r: any) =>
              r.name.toLowerCase().includes(chunk.maps.title.toLowerCase()) ||
              chunk.maps.title.toLowerCase().includes(r.name.toLowerCase())
          );
          if (matchedResult && !matchedResult.googleMapsUri) {
            matchedResult.googleMapsUri = chunk.maps.uri;
          }
        }
      });
    }

    searchResults.sort(
      (a: any, b: any) => (b.digitalPainScore || 0) - (a.digitalPainScore || 0)
    );

    return NextResponse.json(searchResults);
  } catch (err: any) {
    console.error("Search API error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao buscar leads." },
      { status: 500 }
    );
  }
}
