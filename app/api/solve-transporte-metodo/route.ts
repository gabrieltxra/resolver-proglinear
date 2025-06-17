import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI("AIzaSyD-a-xFiJ4qBiFScfhE7lpppndt_d2x8Lw")

export async function POST(req: Request) {
  try {
    const { model, metodo } = await req.json()

    if (!model || !metodo) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    const modelAI = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Resolva o seguinte problema de transporte usando o método ${metodo}:
      
      Matriz de Custos:
      ${JSON.stringify(model.custos, null, 2)}
      
      Ofertas: ${JSON.stringify(model.ofertas)}
      Demandas: ${JSON.stringify(model.demandas)}
      
      Por favor, retorne um JSON com a seguinte estrutura:
      {
        "custoTotal": number,
        "alocacoes": [
          {
            "origem": number,
            "destino": number,
            "quantidade": number
          }
        ]
      }
      
      Certifique-se de que:
      1. O custo total está correto
      2. As alocações respeitam as ofertas e demandas
      3. A solução é ótima para o método escolhido
    `

    const result = await modelAI.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      let parsedResponse
      if (jsonMatch && jsonMatch[1]) {
        parsedResponse = JSON.parse(jsonMatch[1])
      } else {
        parsedResponse = JSON.parse(text) // Fallback if no markdown block is found
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