import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const GEMINI_PROMPT_LP = `Você é um assistente especialista em Programação Linear. Dado o seguinte problema descrito em linguagem natural, extraia as informações necessárias para formular o modelo de PL. Sua resposta DEVE ser um objeto JSON válido contendo três chaves principais: \"model\", \"variables\" e \"explanation\".

A chave \"model\" deve conter um objeto JSON com as seguintes subchaves:
- \"objective_function\": Um objeto com \"type\" (\"Maximize\" ou \"Minimize\") e \"expression\" (a fórmula da função objetivo, ex: \"Z = 5x1 + 2x2\").
- \"constraints\": Um array de strings, onde cada string é uma restrição (ex: \"2x1 + 1x2 <= 6\"). Derive todas as restrições lógicas do texto.
- \"variables\": Um array de strings, onde cada string é uma variável (ex: \"x1\", \"x2\", etc.). Derive todas as variáveis do texto.
- \"non_negativity\": Um array de strings representando as restrições de não negatividade (ex: \"x1 >= 0\", \"x2 >= 0\").


A chave \"explanation\" deve conter uma string em formato markdown explicando passo a passo como você identificou cada componente do modelo (função objetivo, variáveis de decisão, restrições) a partir do texto original. Explique o significado das variáveis de decisão e como cada restrição foi derivada, mas sem extender muito.
Texto do problema:\n`

// renan eu fiz essa função a uxiliar (cn)  pra juntar as classes dinamicamente no tailwind
// se as classe mudar dependendo do estado, ele vai montar as string e resolver conflitos respeitando condições verdadeiras
// já passei nos componentes
// respeita o rato