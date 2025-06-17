"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Truck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

interface TransporteResponse {
  model: {
    custos: number[][]
    ofertas: number[]
    demandas: number[]
  }
  explanation: string
}

export default function Transporte() {
  const [exercise, setExercise] = useState("")
  const [result, setResult] = useState<TransporteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [metodo, setMetodo] = useState<"canto-noroeste" | "custo-minimo" | null>(null)
  const [solucao, setSolucao] = useState<any>(null)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setIsResultModalOpen(false)
    setSolucao(null)

    try {
      const response = await fetch('/api/solve-transporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || `Erro HTTP: ${response.status}`)
        return
      }

      const data: TransporteResponse = await response.json()
      setResult(data)
      setIsResultModalOpen(true)

    } catch (err) {
      console.error("Fetch API error:", err)
      setError("Falha ao conectar com o servidor.")
    } finally {
      if (!isResultModalOpen) {
        setIsLoading(false)
      }
    }
  }

  const handleMetodo = async (tipo: "canto-noroeste" | "custo-minimo") => {
    if (!result) return
    setMetodo(tipo)
    setIsLoading(true)

    try {
      const response = await fetch('/api/solve-transporte-metodo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: result.model,
          metodo: tipo
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao resolver método de transporte")
      }

      const data = await response.json()
      setSolucao(data)

    } catch (err) {
      setError("Erro ao resolver método de transporte")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-white to-slate-100">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-green-600 h-2 w-full" />
          <CardHeader className="pt-8 pb-6 px-8 flex flex-col items-center relative">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="absolute top-8 left-8 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="text-2xl md:text-3xl font-bold text-slate-800 text-center">
              Método de Transporte
            </CardTitle>
            <h2 className="text-lg font-medium text-slate-700 mb-1 text-center">Resolva seu problema de transporte</h2>
            <div className="h-1 w-20 bg-green-600 mx-auto mt-4 rounded-full" />
          </CardHeader>
          <CardContent className="px-8">
            <Textarea
              id="exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="Digite seu problema de transporte aqui..."            
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

        <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
          <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 border border-slate-200 rounded-lg shadow-2xl">
            {result && (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0 rounded-t-lg">
                  <DialogTitle className="text-xl font-bold text-slate-800">
                    Problema de Transporte Identificado
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Escolha um método para resolver o problema
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleMetodo("canto-noroeste")}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isLoading && metodo === "canto-noroeste" ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...</>
                        ) : (
                          "Resolver com Canto Noroeste"
                        )}
                      </Button>
                      <Button
                        onClick={() => handleMetodo("custo-minimo")}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isLoading && metodo === "custo-minimo" ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...</>
                        ) : (
                          "Resolver com Custo Mínimo"
                        )}
                      </Button>
                    </div>

                    {solucao && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Solução:</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Custo Total:</span> {solucao.custoTotal}</p>
                          <div>
                            <p className="font-medium mb-2">Alocações:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {solucao.alocacoes.map((alocacao: any, index: number) => (
                                <div key={index} className="bg-white p-2 rounded border border-green-100">
                                  <p className="text-sm">
                                    Origem {alocacao.origem} → Destino {alocacao.destino}: {alocacao.quantidade}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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