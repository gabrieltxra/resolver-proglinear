// SIMPLEX PADRÂO - Programação Linear

class SimplexPadrao {
  constructor(variaveis, b) {
    this.variaveis = variaveis;
    this.b = b;
    this.table = [[1, ...this.variaveis[0], this.b[0]]];
    for (let i = 1; i < this.variaveis.length; i++) {
      this.table.push([0, ...this.variaveis[i], this.b[i]]);
    }
  }

  // Variáveis Básicas, Variáveis Não Básicas e Valor de Z
  getVariaveis() {
    const variaveisBasicas = [];
    const variaveisNaoBasicas = [];

    for (let col = 1; col < this.table[0].length - 1; col++) {
      let countOnes = 0;
      let rowIndex = -1;
      for (let row = 0; row < this.table.length; row++) {
        if (this.table[row][col] === 1) {
          countOnes++;
          rowIndex = row;
        } else if (this.table[row][col] !== 0) {
          countOnes = -1; // Variável não básica
          break;
        }
      }
      const meio = Math.floor((this.table[0].length - 2) / 2);
      const tipoVariavel = col <= meio ? "x" : "xf";
      const indiceVariavel = col <= meio ? col : col - meio;

      if (countOnes === 1) {
        const valor = this.table[rowIndex][this.table[rowIndex].length - 1];
        variaveisBasicas.push({
          variavel: `${tipoVariavel}${indiceVariavel}`,
          valor,
        });
      } else {
        variaveisNaoBasicas.push({
          variavel: `${tipoVariavel}${indiceVariavel}`,
          valor: 0,
        });
      }
    }

    return { variaveisBasicas, variaveisNaoBasicas };
  }

  getZValue() {
    return this.table[0][this.table[0].length - 1];
  }

  //Solução é ótima?
  isOptimal() {
    const primeiraLinha = this.table[0].slice(1, -1);
    return primeiraLinha.every((value) => value >= 0);
  }

  getColunaIn() {
    const menorNegativo = Math.min(...this.table[0].slice(1, -1));
    const posicao = this.table[0].indexOf(menorNegativo);
    return posicao;
  }

  getLinhaOut() {
    const b = this.table.map((row) => row[row.length - 1]);
    const coluna = this.table.map((row) => row[this.getColunaIn()]);
    const razao = b.map((value, index) => {
      if (coluna[index] <= 0) return Infinity;
      return value / coluna[index];
    });
    const menorRazao = Math.min(...razao);
    const posicao = razao.indexOf(menorRazao);
    return posicao;
  }

  getElementoPivo() {
    const colunaIn = this.getColunaIn();
    const linhaOut = this.getLinhaOut();
    return this.table[linhaOut][colunaIn];
  }

  getNovaLinhaPivo() {
    // Nova linha pivô
    const linhaPivo = this.table[this.getLinhaOut()];
    //Pega a linha pivô atual e divide pelo elemento pivô
    const elementoPivo = this.getElementoPivo();
    const novaLinhaPivo = linhaPivo.map((value) => value / elementoPivo);
    return novaLinhaPivo;
  }

  calcularProximaTabela() {
    // Cria uma cópia da tabela atual para processamento
    const novaTabela = this.table.map((linha) => [...linha]);
    const colunaIn = this.getColunaIn();
    const novaLinhaPivo = this.getNovaLinhaPivo();

    console.log("Nova linha pivô: " + novaLinhaPivo);

    // Recalcula todas as linhas da tabela
    for (let i = 0; i < novaTabela.length; i++) {
      if (i === this.getLinhaOut()) {
        // Substitui a linha pivô pela nova linha pivô
        novaTabela[i] = novaLinhaPivo;
      } else {
        // Calcula as novas linhas com base na nova linha pivô
        const coeficiente = this.table[i][colunaIn] * -1;
        const novaLinha = novaLinhaPivo.map((value) => value * coeficiente);
        novaTabela[i] = novaTabela[i].map(
          (value, index) => value + novaLinha[index]
        );
      }
    }

    // Atualiza a tabela atual com a nova tabela processada
    this.table = novaTabela;
  }

  printTabelaLegivel(tabela) {
    const numVariaveis = (tabela[0].length - 2) / 2;
    const nomesColunas = ["Z"];

    for (let i = 1; i <= numVariaveis; i++) nomesColunas.push(`x${i}`);
    for (let i = 1; i <= numVariaveis; i++) nomesColunas.push(`xf${i}`);
    nomesColunas.push("b");

    let texto = "\nTabela Simplex:\n";
    texto += nomesColunas.map((v) => v.padStart(8)).join(" ") + "\n";

    tabela.forEach((linha) => {
      texto +=
        linha.map((v) => String(Number(v).toFixed(2)).padStart(8)).join(" ") +
        "\n";
    });

    console.log(texto);
  }

  calcular() {
    console.log("Algoritmo I (inicial)");
    //Faz console table com a tabela inicial, incluindo o nome das colunas
    this.printTabelaLegivel(this.table);
    console.log("Coluna In " + this.getColunaIn());
    console.log("Linha Out " + this.getLinhaOut());
    this.getSolucao();

    let solucao = 1;
    while (!this.isOptimal()) {
      console.log("-------------------------------");
      console.log("-------------------------------");
      console.log("-------------------------------");
      console.log("-------------------------------");
      console.log("-------------------------------");
      console.log(`Algoritmo ${++solucao} (iterativo)`);

      this.calcularProximaTabela();
      this.printTabelaLegivel(this.table);
      console.log("Coluna In " + this.getColunaIn());
      console.log("Linha Out " + this.getLinhaOut());

      this.getSolucao();

      if (this.isOptimal()) {
        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("Solução ótima encontrada!");
        console.log(this.getRespostaFinal());
      }
    }
  }

  getSolucao() {
    const { variaveisBasicas, variaveisNaoBasicas } = this.getVariaveis();

    console.log("Variáveis Básicas:");
    variaveisBasicas.forEach(({ variavel, valor }) =>
      console.log(`${variavel} = ${valor}`)
    );

    console.log("Variáveis Não Básicas:");
    variaveisNaoBasicas.forEach(({ variavel, valor }) =>
      console.log(`${variavel} = ${valor}`)
    );

    console.log("Valor de Z: " + this.getZValue());

    console.log("Solução ótima? " + this.isOptimal());
  }

  getRespostaFinal() {
    //Resposta final é composta apenas de variáveis X (que não começam com xf), no seguinte formato:
    // Z MAX = [Valor de Z]
    // Xn = [Valor de Xn], Xn = [Valor de Xn], ... , Xn = [Valor de Xn]
    //Para isso, é necessário buscar as variaveis basicas e nao basicas, a fim de encontrar todas as X, sem ser XF
    const { variaveisBasicas, variaveisNaoBasicas } = this.getVariaveis();
    const resposta = {
      Z: this.getZValue(),
      variaveis: {},
    };
    variaveisBasicas.forEach(({ variavel, valor }) => {
      if (!variavel.startsWith("xf")) {
        resposta.variaveis[variavel] = valor;
      }
    });
    variaveisNaoBasicas.forEach(({ variavel, valor }) => {
      if (!variavel.startsWith("xf")) {
        resposta.variaveis[variavel] = valor;
      }
    });
    return resposta;
  }
}

//Exercício exemplo 1
const variables = [
  [-5, -2, 0, 0],
  [2, 1, 1, 0],
  [10, 12, 0, 1],
];

const b = [0, 6, 60];

//Exercício exemplo 2
// const variables = [
//   [-20, -30, -10, 0, 0, 0],
//   [1, 1, 1, 1, 0, 0],
//   [2, 1, -1, 0, 1, 0],
//   [3, 2, -1, 0, 0, 1],
// ];

// const b = [
//   0, 400, 200, 300
// ];

let simplex = new SimplexPadrao(variables, b);

simplex.calcular();

export default SimplexPadrao;
