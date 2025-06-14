import { NextRequest, NextResponse } from "next/server";
import SimplexPadrao from "@/lib/simplex.js";


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
    
    // verifica se o simplex foi importado corretamente
    if (typeof SimplexPadrao !== 'function') {
       console.error("[API /solve-simplex] Erro Crítico: SimplexPadrao não foi importado como uma função/classe construtora.");
       throw new Error("Falha ao carregar o módulo Simplex interno.");
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
        console.log("[API /solve-simplex] Tentando instanciar SimplexPadrao...");
        const simplex = new SimplexPadrao(variables, b); // <<< direatemnte
        console.log("[API /solve-simplex] Instância criada. Chamando calcular()...");
        simplex.calcular(); 
        finalSolution = simplex.getRespostaFinal(); 
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