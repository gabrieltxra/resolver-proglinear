import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultadoTransporteProps {
  resultado: string;
}

export function ResultadoTransporte({ resultado }: ResultadoTransporteProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Resultado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap">{resultado}</pre>
        </div>
      </CardContent>
    </Card>
  );
} 