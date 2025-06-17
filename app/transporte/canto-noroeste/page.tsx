"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ResultadoTransporte } from "@/components/ResultadoTransporte";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyD-a-xFiJ4qBiFScfhE7lpppndt_d2x8Lw";
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";


const genAI = new GoogleGenerativeAI(API_KEY || "");

export default function CantoNoroestePage() {
  const router = useRouter();
  const [origens, setOrigens] = useState(2);
  const [destinos, setDestinos] = useState(2);
  const [custos, setCustos] = useState<number[][]>([[0, 0], [0, 0]]);
  const [ofertas, setOfertas] = useState<number[]>([0, 0]);
  const [demandas, setDemandas] = useState<number[]>([0, 0]);
  const [resultado, setResultado] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCustoChange = (i: number, j: number, value: string) => {
    const newCustos = [...custos];
    newCustos[i][j] = Number(value);
    setCustos(newCustos);
  };

  const handleOfertaChange = (i: number, value: string) => {
    const newOfertas = [...ofertas];
    newOfertas[i] = Number(value);
    setOfertas(newOfertas);
  };

  const handleDemandaChange = (j: number, value: string) => {
    const newDemandas = [...demandas];
    newDemandas[j] = Number(value);
    setDemandas(newDemandas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!API_KEY) {
        throw new Error("Chave da API não configurada");
      }

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const prompt = `Resolva o seguinte problema de transporte usando o método do canto noroeste:
      Custos: ${JSON.stringify(custos)}
      Ofertas: ${JSON.stringify(ofertas)}
      Demandas: ${JSON.stringify(demandas)}
      
      Por favor, forneça a solução passo a passo e a matriz final de alocação.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setResultado(text);
    } catch (error) {
      console.error("Erro ao gerar resposta:", error);
      setResultado("Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Método do Canto Noroeste</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Dados do Problema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Origens</Label>
                <Input
                  type="number"
                  min="1"
                  value={origens}
                  onChange={(e) => setOrigens(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Número de Destinos</Label>
                <Input
                  type="number"
                  min="1"
                  value={destinos}
                  onChange={(e) => setDestinos(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Matriz de Custos</h3>
              <div className="grid gap-2">
                {custos.map((linha, i) => (
                  <div key={i} className="flex gap-2">
                    {linha.map((custo, j) => (
                      <Input
                        key={j}
                        type="number"
                        placeholder={`Custo ${i+1}-${j+1}`}
                        value={custo}
                        onChange={(e) => handleCustoChange(i, j, e.target.value)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Ofertas</h3>
                {ofertas.map((oferta, i) => (
                  <div key={i}>
                    <Label>Origem {i + 1}</Label>
                    <Input
                      type="number"
                      value={oferta}
                      onChange={(e) => handleOfertaChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Demandas</h3>
                {demandas.map((demanda, i) => (
                  <div key={i}>
                    <Label>Destino {i + 1}</Label>
                    <Input
                      type="number"
                      value={demanda}
                      onChange={(e) => handleDemandaChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                {loading ? "Processando..." : "Resolver"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Voltar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {resultado && <ResultadoTransporte resultado={resultado} />}
    </div>
  );
} 