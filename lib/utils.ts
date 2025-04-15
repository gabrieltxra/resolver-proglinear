import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// renan eu fiz essa função a uxiliar (cn)  pra juntar as classes dinamicamente no tailwind
// se as classe mudar dependendo do estado, ele vai montar as string e resolver conflitos respeitando condições verdadeiras
// já passei nos componentes
// respeita o rato