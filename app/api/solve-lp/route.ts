export const runtime = 'edge';
import { GEMINI_PROMPT_LP } from "@/lib/utils";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const BASE_PROMPT = GEMINI_PROMPT_LP;

if (!API_KEY) {
  console.error("!!!Chave da API Gemini (GOOGLE_API_KEY) não encontrada no .env.local !!!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");


export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "Erro de configuração no servidor." }, { status: 500 });
  }

  try {
    const { exercise } = await request.json();

    if (!exercise || typeof exercise !== 'string') {
      return NextResponse.json({ error: "Entrada inválida." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME});
    const fullPrompt = `${BASE_PROMPT}${exercise}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let rawText = response.text();

    // extraindo o json
    let jsonString = rawText;
    const firstBraceIndex = rawText.indexOf('{');
    const lastBraceIndex = rawText.lastIndexOf('}');
    if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
      jsonString = rawText.substring(firstBraceIndex, lastBraceIndex + 1).trim();
    } else {
      jsonString = rawText.trim(); // usa direto se n encontra chaves fodase kkkkkkk
    }

    try {
      if (!jsonString) {
        throw new Error("Resposta da IA resultou em string vazia.");
      }
      const jsonData = JSON.parse(jsonString);

      if (!jsonData.model || !jsonData.explanation) {
        throw new Error("Estrutura JSON inesperada da IA.");
      }

      // fiz um filtro p remover a nao negatividade das restrições, pq o gemini tava botando junto por algum motivo
      if (jsonData.model.constraints && jsonData.model.non_negativity && Array.isArray(jsonData.model.constraints) && Array.isArray(jsonData.model.non_negativity)) {
        const nonNegativitySet = new Set(jsonData.model.non_negativity);
        jsonData.model.constraints = jsonData.model.constraints.filter(
          (constraint: string) => !nonNegativitySet.has(constraint)
        );
      }
      
      // e esse filtro remove a frase técnica do final da explicação, tava vindo sempre isso abaixo
      const technicalPhrase = "Em resumo, o modelo de Programação Linear é definido como descrito no objeto JSON acima.";
      if (typeof jsonData.explanation === 'string') {
         jsonData.explanation = jsonData.explanation.replace(technicalPhrase, '').trim();
      }
      
      return NextResponse.json(jsonData);

    } catch (parseError) {
      console.error("Erro ao parsear/processar resposta da IA:", parseError, "\nString recebida:", jsonString);
      return NextResponse.json({ error: "Não foi possível interpretar a resposta da IA." }, { status: 500 });
    }

  } catch (error) {
    console.error("Erro na comunicação com a API Gemini:", error);
    return NextResponse.json({ error: "Falha ao contatar o serviço de IA." }, { status: 500 });
  }
} 