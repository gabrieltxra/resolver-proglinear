"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [exercise, setExercise] = useState("")

  const handleSubmit = async () => {
    console.log("Exercício enviado:", exercise)
    // LÓGICA DO BOTAO ENVIAR
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-white to-slate-100">
      <div className="w-full max-w-2xl mx-auto">
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
              placeholder="Digite seu exercício de programação linear aqui..."
              className="min-h-[180px] resize-none border-slate-200 focus-visible:ring-blue-500 text-base"
            />

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4 rounded-r">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Exemplo:</span> Maximize Z = 3x + 4y
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center pt-4 pb-8 px-8">
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 h-auto text-base font-medium rounded-md transition-all hover:shadow-md"
            >
              Enviar
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-500">
          <p>© 2025 FATEC - Ferramenta de Programação Linear • Todos os direitos reservados</p>
        </div>
      </div>
    </main>
  )
}
