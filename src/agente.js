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
  const regiao = numero.substr(14, 2);
  const uf = numero.substr(16, 2);

  // 1. Tribunais Superiores [cite: 3]
  if (justica === "3") return "stj";
  if (justica === "1") return "stf"; 
  if (justica === "5" && regiao === "00") return "tst";
  if (justica === "6" && regiao === "00") return "tse";
  if (justica === "7" && regiao === "00") return "stm";

  // 2. Justiça Federal (TRFs) [cite: 3]
  if (justica === "4") {
    return `trf${parseInt(regiao)}`;
  }

  // 3. Justiça do Trabalho (TRTs) [cite: 4, 5, 6]
  if (justica === "5") {
    return `trt${parseInt(regiao)}`;
  }

  // 4. Justiça Eleitoral (TREs) [cite: 6, 7]
  if (justica === "6") {
    const mapaTRE = {
      "01": "tre-ac", "02": "tre-al", "03": "tre-am", "04": "tre-ap", "05": "tre-ba",
      "06": "tre-ce", "07": "tre-df", "08": "tre-es", "09": "tre-go", "10": "tre-ma",
      "11": "tre-mg", "12": "tre-ms", "13": "tre-mt", "14": "tre-pa", "15": "tre-pb",
      "16": "tre-pe", "17": "tre-pi", "18": "tre-pr", "19": "tre-rj", "20": "tre-rn",
      "21": "tre-ro", "22": "tre-rr", "23": "tre-rs", "24": "tre-sc", "25": "tre-se",
      "26": "tre-sp", "27": "tre-to"
    };
    return mapaTRE[uf] || null;
  }

  // 5. Justiça Estadual (TJs) [cite: 3, 4]
  if (justica === "8") {
    const mapaTJ = {
      "01": "tjac", "02": "tjal", "03": "tjam", "04": "tjap", "05": "tjba",
      "06": "tjce", "07": "tjdft", "08": "tjes", "09": "tjgo", "10": "tjma",
      "11": "tjmg", "12": "tjms", "13": "tjmt", "14": "tjpa", "15": "tjpb",
      "16": "tjpe", "17": "tjpi", "18": "tjpr", "19": "tjrj", "20": "tjrn",
      "21": "tjro", "22": "tjrr", "23": "tjrs", "24": "tjsc", "25": "tjse",
      "26": "tjsp", "27": "tjto"
    };
    return mapaTJ[uf] || null;
  }

  // 6. Justiça Militar Estadual [cite: 7]
  if (justica === "9") {
    const mapaTJM = { "11": "tjmmg", "23": "tjmrs", "26": "tjmsp" };
    return mapaTJM[uf] || null;
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
      return `Localizei o número do processo, mas ele não consta na base do tribunal ${tribunal.toUpperCase()}. Verifique se o número está correto ou se o processo é muito recente.`;
    }

    const prompt = `
      Você é um advogado experiente. Explique a situação do processo abaixo de forma clara para um cliente leigo.
      Use linguagem simples e informe: Tribunal, Tipo do processo, Fase atual e Última movimentação.
      Dados: ${JSON.stringify(dados, null, 2)}
    `;

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500
    });

    return resposta.choices[0].message.content;

  } catch (error) {
    console.error("Erro ao buscar processo:", error);
    return "Ocorreu um erro ao consultar as informações no tribunal. Tente novamente em instantes.";
  }
}
