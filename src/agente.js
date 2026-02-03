import { buscarProcesso } from "./datajud.js";
import OpenAI from "openai";

/* ================================
   EXTRAÇÃO INTELIGENTE CNJ
================================ */

function extrairNumero(texto) {
  const regexFormatado = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
  const regexNumeros = /\b\d{20}\b/;

  let match = texto.match(regexFormatado);
  if (match) return match[0];

  match = texto.match(regexNumeros);
  if (match) return match[0];

  return null;
}

function normalizar(numero) {
  const n = numero.replace(/\D/g, "");
  return n.length === 20 ? n : null;
}

/* ================================
   DESCOBRIR TRIBUNAL (MAPEAMENTO COMPLETO)
================================ */

function descobrirTribunal(numero) {
  const justica = numero.charAt(13);
  const regiaoOuEstado = numero.substr(14, 2);
  const ufOrigem = numero.substr(16, 2);

  // 1. Tribunais Superiores (Justiça 1, 2 e 3)
  if (justica === "1") return "stf"; 
  if (justica === "2") return "tse";
  if (justica === "3") return "stj";
  if (justica === "5" && regiaoOuEstado === "00") return "tst";
  if (justica === "7" && regiaoOuEstado === "00") return "stm";

  // 2. Justiça Federal (Justiça 4)
  if (justica === "4") {
    return `trf${parseInt(regiaoOuEstado)}`;
  }

  // 3. Justiça do Trabalho (Justiça 5 - TRTs)
  if (justica === "5") {
    const regiao = parseInt(regiaoOuEstado);
    if (regiao >= 1 && regiao <= 24) {
      return `trt${regiao}`;
    }
  }

  // 4. Justiça Eleitoral (Justiça 6 - TREs)
  if (justica === "6") {
    const mapaTRE = {
      "01": "tre-ac", "02": "tre-al", "03": "tre-am", "04": "tre-ap", "05": "tre-ba",
      "06": "tre-ce", "07": "tre-dft", "08": "tre-es", "09": "tre-go", "10": "tre-ma",
      "11": "tre-mg", "12": "tre-ms", "13": "tre-mt", "14": "tre-pa", "15": "tre-pb",
      "16": "tre-pe", "17": "tre-pi", "18": "tre-pr", "19": "tre-rj", "20": "tre-rn",
      "21": "tre-ro", "22": "tre-rr", "23": "tre-rs", "24": "tre-sc", "25": "tre-se",
      "26": "tre-sp", "27": "tre-to"
    };
    return mapaTRE[ufOrigem] || "tse";
  }

  // 5. Justiça Estadual (Justiça 8 - TJs)
  if (justica === "8") {
    const mapaTJ = {
      "01": "tjac", "02": "tjal", "03": "tjam", "04": "tjap", "05": "tjba",
      "06": "tjce", "07": "tjdft", "08": "tjes", "09": "tjgo", "10": "tjma",
      "11": "tjmg", "12": "tjms", "13": "tjmt", "14": "tjpa", "15": "tjpb",
      "16": "tjpe", "17": "tjpi", "18": "tjpr", "19": "tjrj", "20": "tjrn",
      "21": "tjro", "22": "tjrr", "23": "tjrs", "24": "tjsc", "25": "tjse",
      "26": "tjsp", "27": "tjto"
    };
    return mapaTJ[ufOrigem] || null;
  }

  // 6. Justiça Militar Estadual (Justiça 9)
  if (justica === "9") {
    const mapaTJM = {
      "11": "tjmmg",
      "23": "tjmrs",
      "26": "tjmsp"
    };
    return mapaTJM[ufOrigem] || null;
  }

  return null;
}

/* ================================
   OPENAI
================================ */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY
});

/* ================================
   AGENTE JURÍDICO
================================ */

export async function agenteProcesso(mensagem) {
  const bruto = extrairNumero(mensagem);

  if (!bruto) {
    return "Não consegui identificar o número do processo. Pode me informar o número completo?";
  }

  const numero = normalizar(bruto);

  if (!numero) {
    return "O número do processo parece incompleto. Pode conferir e me enviar novamente?";
  }

  const tribunal = descobrirTribunal(numero);

  if (!tribunal) {
    return "Ainda não consigo identificar automaticamente o tribunal desse processo.";
  }

  try {
    const dados = await buscarProcesso(numero, tribunal);

    if (!dados?.hits?.total?.value) {
      return `Localizei que o processo pertence ao ${tribunal.toUpperCase()}, mas ele não consta na base nacional do DataJud. Isso é comum em processos muito recentes ou de sistemas específicos do tribunal.`;
    }

    const prompt = `
      Você é um advogado experiente. 
      Explique a situação do processo abaixo de forma clara para um cliente leigo.
      Use linguagem simples.
      Informe obrigatoriamente: Tribunal, Tipo do processo, Fase atual e Última movimentação importante.
      
      Dados do Processo:
      ${JSON.stringify(dados, null, 2)}
    `;

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 600
    });

    return resposta.choices[0].message.content;

  } catch (error) {
    console.error("Erro no Agente:", error);
    return "Desculpe, tive um problema ao consultar o tribunal ou processar as informações. Tente novamente em alguns minutos.";
  }
}
