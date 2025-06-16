"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Loader2, Terminal, BookOpenText, AlertCircle, ChevronsUpDown } from "lucide-react"
import ReactMarkdown from 'react-markdown'


interface PLModel {
  objective_function: { type: string; expression: string }
  constraints: string[]
  non_negativity: string[]
  variables: string[]
}
interface ApiResponse { model: PLModel; explanation: string }
interface SimplexSolution { Z: number; variaveis: { [key: string]: number }; }

export default function Home() {
  
  const [exercise, setExercise] = useState("")
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [simplexSolution, setSimplexSolution] = useState<SimplexSolution | null>(null)
  const [simplexError, setSimplexError] = useState<string | null>(null)
  const [isCalculatingSimplex, setIsCalculatingSimplex] = useState(false)
  const [simplexStepsLog, setSimplexStepsLog] = useState<string | null>(null)
  const [showSimplexSteps, setShowSimplexSteps] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setShowExplanation(false)
    setIsResultModalOpen(false)
    setSimplexSolution(null)
    setSimplexError(null)
    setSimplexStepsLog(null)
    setShowSimplexSteps(false)

    try {
      const response = await fetch('/api/solve-lp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || `Erro HTTP: ${response.status}`)
        return // encerra em caso de erro da API
      }

      const data: ApiResponse = await response.json()
      setResult(data)
      setIsResultModalOpen(true)

    } catch (err) {
      console.error("Fetch API error:", err) // erro de rede/fetch
      setError("Falha ao conectar com o servidor.")
    } finally {
      // Sempre garante que o loading termine se o modal não foi aberto
      // (se modal abriu, ele cobre o botão. Se de erro antes, já parou)
      if (!isResultModalOpen) {
        setIsLoading(false)
      }
    }
  }

 
  const handleModalChange = (open: boolean) => {
    setIsResultModalOpen(open)
    if (!open) {
      setIsLoading(false) 
      setSimplexSolution(null)
      setSimplexError(null)
      setSimplexStepsLog(null)
      setShowSimplexSteps(false)
    }
  }

  const canRunStandardSimplex = (model: PLModel | null): boolean => {
    if (!model) return false;
    const isMaximize = model.objective_function.type === "Maximize";
    const allConstraintsLTE = model.constraints.every(c => c.includes("<="));
    return isMaximize && allConstraintsLTE;
  };

  const handleRunSimplex = async () => { 
      if (!result?.model) return;
      setIsCalculatingSimplex(true);
      setSimplexError(null);
      setSimplexSolution(null);
      setSimplexStepsLog(null);
      setShowSimplexSteps(false);
      
      try {
         const response = await fetch('/api/solve-simplex', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(result.model), 
         });

         const data = await response.json(); 

         if (!data || data.finalSolution === undefined || data.stepsLog === undefined) {
             throw new Error("Resposta da API Simplex não contém os dados esperados.");
         }
         
         setSimplexSolution(data.finalSolution);
         setSimplexStepsLog(data.stepsLog);
         if (data.error) {
             setSimplexError(data.error);
         }

      } catch (err) {
          // Captura erros de fetch, JSON parse, ou o erro lançado acima
          console.error("Erro ao calcular/buscar solução Simplex:", err);
          setSimplexError("Ocorreu um erro ao tentar calcular a solução Simplex."); // Mensagem mais genérica
          setSimplexSolution(null); 
          setSimplexStepsLog(null); 
      } finally {
          setIsCalculatingSimplex(false);
      }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-white to-slate-100">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="shadow-xl border border-slate-200 overflow-hidden">
           <div className="bg-green-600 h-2 w-full" />
          <CardHeader className="pt-8 pb-6 px-8">
            <CardTitle className="text-center text-2xl md:text-3xl font-bold text-slate-800">
              ReSolver: Inteligência Artificial
              <h2 className="text-lg font-medium text-slate-700 mb-1">Obtenha a solução ótima para o seu exercício de Programação Linear</h2>
            </CardTitle>
            <div className="h-1 w-20 bg-green-600 mx-auto mt-4 rounded-full" />
          </CardHeader>
          <CardContent className="px-8">
            <Textarea
              id="exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="Digite seu exercício aqui..."            
              className="min-h-[180px] resize-none border-slate-200 focus-visible:ring-green-500 text-base"
              disabled={isLoading}
            />
              <div className="mb-2">
               <p className="text-xs text-slate-400 text-center mt-3">
                 Lembre-se: A IA pode cometer erros. Considere verificar informações importantes.
               </p>
             </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-4 pb-8 px-8">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !exercise.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 h-auto text-base font-medium rounded-md transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />} 
              {isLoading ? "Analisando..." : "Enviar"}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Alert variant="destructive" className="shadow-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Dialog open={isResultModalOpen} onOpenChange={handleModalChange}>
          <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 border border-slate-200 rounded-lg shadow-2xl">
            {result && (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0 rounded-t-lg">
                  <DialogTitle className="text-xl font-bold text-slate-800">
                    Modelo de PL Identificado
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Resultado da análise do exercício fornecido.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-700">Modelo de Programação Linear:</h3>
                    <div className="pl-4">
                        <p className="text-sm text-slate-800">
                           <span className="font-medium">FO ({result.model.objective_function.type}):</span> 
                           <code className="ml-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{result.model.objective_function.expression}</code>
                        </p>
                    </div>
                    <div className="pl-4 pt-1">
                        <p className="text-sm font-medium text-slate-800 mb-1">Variáveis:</p>
                        <ul className="list-disc list-outside pl-5 space-y-1">
                        {result.model.variables.map((variable, index) => (
                            <li key={`variable-${index}`} className="text-sm">
                                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{variable}</code>
                            </li>
                        ))}
                        </ul>
                    </div>
                    <div className="pl-4 pt-1">
                        <p className="text-sm font-medium text-slate-800 mb-1">Restrições:</p>
                        <ul className="list-disc list-outside pl-5 space-y-1">
                        {result.model.constraints.map((constraint, index) => (
                            <li key={`constraint-${index}`} className="text-sm">
                                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{constraint}</code>
                            </li>
                        ))}
                        </ul>
                    </div>
                     <div className="pl-4 pt-1">
                        <p className="text-sm font-medium text-slate-800 mb-1">Não Negatividade:</p>
                        <ul className="list-disc list-outside pl-5 space-y-1">
                        {result.model.non_negativity.map((nn, index) => (
                            <li key={`nn-${index}`} className="text-sm">
                                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{nn}</code>
                            </li>
                        ))}
                        </ul>
                    </div>
                  </div>
                  
                  {canRunStandardSimplex(result.model) && (
                      <div className="pt-4 border-t border-slate-200 mt-4 space-y-3">
                          <h3 className="text-base font-semibold text-slate-700">Solução via Simplex Padrão:</h3>
                          {!simplexSolution && !simplexError && (
                            <Button
                                onClick={handleRunSimplex}
                                disabled={isCalculatingSimplex}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isCalculatingSimplex ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...</>
                                ) : (
                                    "Resolver com Simplex"
                                )}
                            </Button>
                          )}

                          {simplexSolution && (
                              <div className="mt-3 text-sm space-y-1 bg-green-50 border border-green-200 p-3 rounded-md">
                                  <p><span className="font-medium">Valor Ótimo (Z):</span> <code className="ml-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{simplexSolution.Z.toFixed(2)}</code></p>
                                  <p className="font-medium">Valores das Variáveis:</p>
                                  <ul className="list-disc list-outside pl-5">
                                      {Object.entries(simplexSolution.variaveis).map(([variavel, valor]) => (
                                          <li key={variavel}>
                                              <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{variavel} = {valor.toFixed(2)}</code>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          
                           {simplexError && (
                              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md flex items-start">
                                 <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                 <span>Erro no cálculo Simplex: {simplexError}</span>
                              </div>
                          )}
                          
                          {simplexStepsLog && (
                               <div className="mt-3">
                                   <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => setShowSimplexSteps(!showSimplexSteps)}
                                       className="w-full justify-start text-left text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3"
                                   >
                                       <ChevronsUpDown className="mr-2 h-4 w-4 flex-shrink-0" />
                                       <span className="flex-grow">{showSimplexSteps ? "Ocultar Detalhes do Cálculo" : "Mostrar Detalhes do Cálculo (Tabelas)"}</span>
                                   </Button>
                                   {showSimplexSteps && (
                                       <pre className="mt-2 p-3 border bg-gray-50 rounded-md text-xs text-gray-700 whitespace-pre-wrap break-words max-h-80 overflow-y-auto font-mono shadow-inner">
                                           {simplexStepsLog}
                                       </pre>
                                   )}
                               </div>
                           )}
                      </div>
                  )}
                  
                  <Button
                    variant={showExplanation ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full justify-start text-left text-green-600 hover:text-green-700 hover:bg-green-50 px-3 mt-4 pt-4 border-t border-slate-200"
                  >
                    <BookOpenText className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow">{showExplanation ? "Ocultar Explicação Detalhada" : "Ver Explicação Detalhada"}</span>
                  </Button>
                  {showExplanation && (
                    <div className="mt-2 mb-4 p-4 border border-green-100 bg-green-50/60 rounded-md shadow-inner prose prose-sm max-w-none prose-headings:text-green-900 prose-p:text-slate-700 prose-li:text-slate-600 prose-strong:text-slate-800">
                       <ReactMarkdown 
                         components={{
                            h1: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-green-900 border-b pb-1 border-green-200" {...props} />,
                            h2: ({node, ...props}) => <h4 className="text-md font-semibold mt-3 mb-1 text-green-800" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-medium text-slate-900" {...props} />,
                         }}
                       >{result.explanation}</ReactMarkdown>
                    </div>
                  )}
                </div>

                <DialogFooter className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 flex-shrink-0 rounded-b-lg flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Aviso: Resultados gerados por IA podem conter imprecisões. Valide informações críticas.
                  </p>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-auto flex-shrink-0">
                      Fechar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <div className="text-center mt-6 text-sm text-slate-500">
          <p>© 2025 FATEC - Ferramenta de Programação Linear • Todos os direitos reservados</p>
        </div>
      </div>
    </main>
  )
}
