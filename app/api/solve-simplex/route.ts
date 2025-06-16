import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
// import SimplexPadrao from "@/lib/simplex.js";

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

interface PLModel { 
  objective_function: { type: string; expression: string }; 
  constraints: string[]; 
  non_negativity: string[]; // faz parte do modelo
}

//auxiliar para transformar o modelo (similar q ue estava no front)
const transformModelForSimplex = (model: PLModel): { variables: number[][], b: number[] } => {
    console.log('[transformModel] Iniciando transformação para:', model);
    
    // coeficientes da função objetivo
    const objMatch = model.objective_function.expression.match(/([+-]?\d*\.?\d*)\s*([a-zA-Z]\d*)/g);
    console.log('[transformModel] Coeficientes da função objetivo:', objMatch);
    
    if (!objMatch) {
        throw new Error("Formato da função objetivo inválido");
    }

    const objCoeffs = objMatch.map(term => {
        const [coeff] = term.split(/[a-zA-Z]/);
        return coeff ? parseFloat(coeff) : 1;
    });
    console.log('[transformModel] Coeficientes extraídos:', objCoeffs);

    // coeficientes das restrições
    const constraintCoeffs = model.constraints.map(constraint => {
        const terms = constraint.match(/([+-]?\d*\.?\d*)\s*([a-zA-Z]\d*)/g) || [];
        console.log('[transformModel] Termos da restrição:', constraint, '->', terms);
        
        const coeffs = terms.map(term => {
            const [coeff] = term.split(/[a-zA-Z]/);
            return coeff ? parseFloat(coeff) : 1;
        });
        console.log('[transformModel] Coeficientes da restrição:', coeffs);
        return coeffs;
    });

    //valores do lado direito (b)
    const bValues = model.constraints.map(constraint => {
        const match = constraint.match(/[<>=]\s*(\d+)/);
        console.log('[transformModel] Valor b da restrição:', constraint, '->', match ? match[1] : 'não encontrado');
        return match ? parseFloat(match[1]) : 0;
    });

    //matriz de variaveis
    const variables = [objCoeffs, ...constraintCoeffs];
    console.log('[transformModel] Matriz final de variáveis:', variables);
    console.log('[transformModel] Valores b:', bValues);

    return { variables, b: bValues };
};



export async function POST(request: NextRequest) {
    let originalConsoleLog: (...args: any[]) => void = console.log; 
    let logsRestored = false; 
  
    try {
      const model: PLModel = await request.json();
  
      if (!model || !model.objective_function || !model.constraints) {
          return NextResponse.json({ error: "Formato do modelo de PL inválido." }, { status: 400 });
      }
  
      const { variables, b } = transformModelForSimplex(model);
  
      let capturedLogs: string[] = [];
      originalConsoleLog = console.log; 
      logsRestored = false;
  
      console.log = (...args) => {
          capturedLogs.push(args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '));
      };
  
      let finalSolution = null;
      let simplexError = null;
  
      try {
          console.log("[API /solve-simplex] Tentando calcular com Gemini...");
  
          const genAI = new GoogleGenerativeAI(API_KEY as string);
          const modelGemini = genAI.getGenerativeModel({ model: MODEL_NAME });
  
          const prompt = `
  Você é um especialista em Programação Linear. Resolva o seguinte problema usando o método Simplex Padrão. 
  Retorne um JSON no formato: { "Z": número, "variaveis": {objeto com chave sendo a variavel, e o valor seu valor}, "status": "Ótimo" }
  
  As variáveis de folga, chame de xf1, xf2, etc.

  Variáveis:
  ${JSON.stringify(variables)}
  
  Termo independente (b):
  ${JSON.stringify(b)}
          `;
  
          const result = await modelGemini.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });
  
          const response = await result.response;
          let rawText = response.text();

          // extraindo o json
          let jsonString = rawText;
          const firstBraceIndex = rawText.indexOf("{");
          const lastBraceIndex = rawText.lastIndexOf("}");
          if (
            firstBraceIndex !== -1 &&
            lastBraceIndex !== -1 &&
            lastBraceIndex > firstBraceIndex
          ) {
            jsonString = rawText
              .substring(firstBraceIndex, lastBraceIndex + 1)
              .trim();
          } else {
            jsonString = rawText.trim(); // usa direto se n encontra chaves fodase kkkkkkk
          }

          finalSolution = JSON.parse(jsonString);

  
          console.log("[API /solve-simplex] Cálculo concluído. Solução final:", finalSolution);
      } catch (err) {
          simplexError = err instanceof Error ? err.message : "Erro desconhecido durante cálculo Simplex.";
          capturedLogs.push(`\n--- ERRO DURANTE CÁLCULO ---\n${simplexError}`);
      } finally {
          if (!logsRestored) {
            console.log = originalConsoleLog;
            logsRestored = true;
          }
      }
  
      if (!simplexError && (!finalSolution || typeof finalSolution.Z !== 'number')) {
          simplexError = "Algoritmo Simplex não produziu uma solução final válida.";
           if (!capturedLogs.some(log => log.includes("ERRO DURANTE CÁLCULO"))) {
               capturedLogs.push(`\n--- ERRO ---\n${simplexError}`);
           }
      }
  
      const responsePayload = {
          finalSolution: simplexError ? null : finalSolution,
          stepsLog: capturedLogs.join('\n'),
          error: simplexError,
      };
  
      return NextResponse.json(responsePayload);
  
    } catch (error) {
      console.error("Erro geral na API /api/solve-simplex:", error);
      if (!logsRestored && typeof originalConsoleLog === 'function') {
          console.log = originalConsoleLog;
      }
      return NextResponse.json({ error: "Erro interno do servidor ao processar Simplex." }, { status: 500 });
    }
  }