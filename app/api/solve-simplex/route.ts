import { NextRequest, NextResponse } from "next/server";
import SimplexPadrao from "@/lib/simplex.js";

interface PLModel {
  variables: string[]; // nomes das variáveis, ex: ["x1", "x2", "x3"]
  objective_function: { type: string; expression: string };
  constraints: string[];
  non_negativity: string[]; // faz parte do modelo
}

//auxiliar para transformar o modelo (similar q ue estava no front)
const transformModelForSimplex = (
  model: PLModel
): { variables: number[][]; b: number[] } => {
  const varNames = model.variables;
  const numVars = varNames.length;
  const numConstraints = model.constraints.length;

  const extractCoefficients = (expression: string): number[] => {
    const coeffs = Array(numVars).fill(0);
    const terms =
      expression.match(/([+-]?\s*\d*\.?\d*)\s*([a-zA-Z]\d*)/g) || [];

    terms.forEach((term) => {
      const match = term.match(/([+-]?\s*\d*\.?\d*)\s*([a-zA-Z]\d*)/);
      if (match) {
        let coef = match[1].replace(/\s/g, "");
        coef = coef === "+" || coef === "" ? "1" : coef === "-" ? "-1" : coef;
        const varIndex = varNames.indexOf(match[2]);
        if (varIndex >= 0) {
          coeffs[varIndex] = parseFloat(coef);
        }
      }
    });

    return coeffs;
  };

  // Linha da FO (negada para maximização) + folgas zeradas
  const objCoeffs = extractCoefficients(model.objective_function.expression);
  const rowFO =
    model.objective_function.type.toLowerCase() === "maximize"
      ? [...objCoeffs.map((c) => -c), ...Array(numConstraints).fill(0)]
      : [...objCoeffs, ...Array(numConstraints).fill(0)];

  // Restrições com folgas
  const constraintRows = model.constraints.map((constraint, i) => {
    const lhs = constraint.split(/<=|>=|=/)[0];
    const coeffs = extractCoefficients(lhs);
    const folgas = Array(numConstraints).fill(0);
    folgas[i] = 1;
    return [...coeffs, ...folgas];
  });

  const variables = [rowFO, ...constraintRows];

  // Lado direito (b)
  const b = [
    0,
    ...model.constraints.map((c) => {
      const match = c.match(/[<>=]\s*(-?\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }),
  ];

  return { variables, b };
};



export async function POST(request: NextRequest) {
  let originalConsoleLog: (...args: any[]) => void = console.log;
  let logsRestored = false;

  try {
    const model: PLModel = await request.json();

    if (!model || !model.objective_function || !model.constraints) {
      return NextResponse.json(
        { error: "Formato do modelo de PL inválido." },
        { status: 400 }
      );
    }

    // verifica se o simplex foi importado corretamente
    if (typeof SimplexPadrao !== "function") {
      console.error(
        "[API /solve-simplex] Erro Crítico: SimplexPadrao não foi importado como uma função/classe construtora."
      );
      throw new Error("Falha ao carregar o módulo Simplex interno.");
    }

    const { variables, b } = transformModelForSimplex(model);

    let capturedLogs: string[] = [];
    originalConsoleLog = console.log;
    logsRestored = false;

    console.log = (...args) => {
      capturedLogs.push(
        args
          .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
          .join(" ")
      );
    };

    let finalSolution = null;
    let simplexError = null;

    try {
      console.log("[API /solve-simplex] Tentando instanciar SimplexPadrao...");
      const simplex = new SimplexPadrao(variables, b); // <<< direatemnte
      console.log(
        "[API /solve-simplex] Instância criada. Chamando calcular()..."
      );
      simplex.calcular();
      finalSolution = simplex.getRespostaFinal();
      console.log(
        "[API /solve-simplex] Cálculo concluído. Solução final:",
        finalSolution
      );
    } catch (err) {
      console.error(err)
      simplexError =
        err instanceof Error
          ? err.message
          : "Erro desconhecido durante cálculo Simplex.";
      capturedLogs.push(`\n--- ERRO DURANTE CÁLCULO ---\n${simplexError}`);
    } finally {
      if (!logsRestored) {
        console.log = originalConsoleLog;
        logsRestored = true;
      }
    }

    if (
      !simplexError &&
      (!finalSolution || typeof finalSolution.Z !== "number")
    ) {
      simplexError = "Algoritmo Simplex não produziu uma solução final válida.";
      if (!capturedLogs.some((log) => log.includes("ERRO DURANTE CÁLCULO"))) {
        capturedLogs.push(`\n--- ERRO ---\n${simplexError}`);
      }
    }

    const responsePayload = {
      finalSolution: simplexError ? null : finalSolution,
      stepsLog: capturedLogs.join("\n"),
      error: simplexError,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Erro geral na API /api/solve-simplex:", error);
    if (!logsRestored && typeof originalConsoleLog === "function") {
      console.log = originalConsoleLog;
    }
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar Simplex." },
      { status: 500 }
    );
  }
}
