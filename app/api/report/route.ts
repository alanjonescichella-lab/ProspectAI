import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const reportSchema = z.object({
  lead: z.object({
    name: z.string().min(1).max(200),
    address: z.string().max(500).default("Não informado"),
    rating: z.number().min(0).max(5).nullable().default(null),
    userRatingCount: z.number().min(0).default(0),
    websiteUri: z.string().max(500).nullable().default(null),
    nationalPhoneNumber: z.string().max(30).nullable().default(null),
    types: z.array(z.string().max(100)).default([]),
    reviews: z.array(z.object({
      rating: z.number().optional(),
      text: z.object({ text: z.string().max(1000) }).optional(),
    })).default([]),
  }),
  service: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos: " + parsed.error.issues.map(i => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { lead, service } = parsed.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const reportPrompt = `
      Você é um consultor de vendas B2B especialista em IA.
      O usuário está tentando vender o seguinte serviço: "${service}".

      Aqui estão os dados do lead (empresa):
      Nome: ${lead.name}
      Endereço: ${lead.address}
      Avaliação: ${lead.rating ?? "N/A"} (${lead.userRatingCount} avaliações)
      Website: ${lead.websiteUri ? "Sim" : "Não"}
      Telefone: ${lead.nationalPhoneNumber ? "Sim" : "Não"}
      Tipos: ${lead.types.join(", ") || "Não informado"}

      Avaliações recentes:
      ${
        lead.reviews.length > 0
          ? lead.reviews.map((r) => `- ${r.rating ?? "?"} estrelas: "${r.text?.text ?? "Sem texto"}"`).join("\n")
          : "Nenhuma avaliação detalhada disponível."
      }

      Gere um relatório de oportunidade de vendas completo em formato Markdown (pt-BR).
      O relatório DEVE conter as seguintes seções (use headers h2 ##):

      ## Diagnóstico Digital
      (Analise o que está faltando ou fraco na presença online deles com base nos dados acima)

      ## Análise de Avaliações
      (Resumo do sentimento das avaliações e reclamações comuns, se houver)

      ## Por que esta empresa precisa de IA
      (Conecte as dores específicas deles com o serviço de IA oferecido pelo usuário)

      ## Abordagem de Vendas Sugerida
      (Como o usuário deve abordar este lead, o que dizer na primeira mensagem/ligação)

      ## Impacto Estimado
      (O que a IA poderia melhorar para eles em termos de negócios/faturamento/tempo)
    `;

    const reportResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reportPrompt,
    });

    return NextResponse.json({
      report: reportResponse.text || "Relatório não gerado.",
    });
  } catch (err: any) {
    console.error("Report API error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao gerar relatório." },
      { status: 500 }
    );
  }
}
