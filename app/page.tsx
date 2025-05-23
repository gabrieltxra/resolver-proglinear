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
import { Loader2, Terminal, BookOpenText } from "lucide-react"
import ReactMarkdown from 'react-markdown'


interface PLModel {
  objective_function: { type: string; expression: string }
  constraints: string[]
  non_negativity: string[]
}
interface ApiResponse { model: PLModel; explanation: string }

export default function Home() {
  
  const [exercise, setExercise] = useState("")
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setShowExplanation(false)
    setIsResultModalOpen(false)

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
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-white to-slate-100">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="shadow-xl border border-slate-200 overflow-hidden">
           <div className="bg-blue-600 h-2 w-full" />
          <CardHeader className="pt-8 pb-6 px-8">
            <CardTitle className="text-center text-2xl md:text-3xl font-bold text-slate-800">
              Resolução de Modelo de Programação Linear
            </CardTitle>
            <div className="h-1 w-20 bg-blue-500 mx-auto mt-4 rounded-full" />
          </CardHeader>
          <CardContent className="px-8">
             <div className="mb-2">
               <h2 className="text-lg font-medium text-slate-700 mb-1">Insira aqui o exercício de PL</h2>
               <p className="text-sm text-slate-500 mb-3">
                 Digite os detalhes do seu modelo para obter a solução otimizada
               </p>
             </div>
            <Textarea
              id="exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="Digite seu exercício de programação linear aqui.."            
              className="min-h-[180px] resize-none border-slate-200 focus-visible:ring-blue-500 text-base"
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter className="flex justify-center pt-4 pb-8 px-8">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !exercise.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 h-auto text-base font-medium rounded-md transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  
                  <Button
                    variant={showExplanation ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full justify-start text-left text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 mt-4 pt-4 border-t border-slate-200"
                  >
                    <BookOpenText className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow">{showExplanation ? "Ocultar Explicação Detalhada" : "Ver Explicação Detalhada"}</span>
                  </Button>
                  {showExplanation && (
                    <div className="mt-2 mb-4 p-4 border border-blue-100 bg-blue-50/60 rounded-md shadow-inner prose prose-sm max-w-none prose-headings:text-blue-900 prose-p:text-slate-700 prose-li:text-slate-600 prose-strong:text-slate-800">
                       <ReactMarkdown 
                         components={{
                            h1: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-blue-900 border-b pb-1 border-blue-200" {...props} />,
                            h2: ({node, ...props}) => <h4 className="text-md font-semibold mt-3 mb-1 text-blue-800" {...props} />,
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
