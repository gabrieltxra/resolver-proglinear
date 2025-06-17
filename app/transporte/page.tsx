"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowRight, Truck, DollarSign } from "lucide-react";

export default function TransportePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-100 py-8 px-2">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-green-700 mb-2">Método de Transporte</h1>
          <p className="text-lg text-slate-700 mb-1">Escolha o método desejado para resolver seu problema de transporte</p>
          <div className="h-1 w-24 bg-green-600 mx-auto mt-3 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg border-green-200 hover:shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-xl font-bold text-green-800">Canto Noroeste</CardTitle>
                <CardDescription className="text-slate-600">Solução inicial simples para problemas de transporte</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/transporte/canto-noroeste')}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-semibold py-3 mt-2"
                size="lg"
              >
                Resolver usando Canto Noroeste <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-green-200 hover:shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-xl font-bold text-green-800">Custo Mínimo</CardTitle>
                <CardDescription className="text-slate-600">Solução eficiente baseada nos menores custos</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/transporte/custo-minimo')}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-semibold py-3 mt-2"
                size="lg"
              >
                Resolver usando Custo Mínimo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 