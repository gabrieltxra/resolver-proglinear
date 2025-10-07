import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI("apikey")

export async function POST(req: Request) {
  try {
    const { exercise } = await req.json()

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercício não fornecido" },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Analise o seguinte problema de transporte e extraia as informações necessárias:
      
      ${exercise}
      
      Por favor, retorne um JSON com a seguinte estrutura:
      {
        "model": {
          "custos": number[][], // matriz de custos
          "ofertas": number[], // array de ofertas
          "demandas": number[] // array de demandas
        },
        "explanation": string // explicação do problema
      }
      
      Certifique-se de que:
      1. A matriz de custos está correta
      2. Os arrays de ofertas e demandas têm os tamanhos corretos
      3. A explicação é clara e concisa
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      let parsedResponse
      if (jsonMatch && jsonMatch[1]) {
        parsedResponse = JSON.parse(jsonMatch[1])
      } else {
        parsedResponse = JSON.parse(text) 
      }

      return NextResponse.json(parsedResponse)
    } catch (e) {
      console.error("Erro ao fazer parse da resposta:", e)
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 
