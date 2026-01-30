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

function formatarCNJ(n) {
  return `${n.substr(0,7)}-${n.substr(7,2)}.${n.substr(9,4)}.${n.substr(13,1)}.${n.substr(14,2)}.${n.substr(16,4)}`;
}

/* ================================
   DESCOBRIR TRIBUNAL
================================ */

function descobrirTribunal(numero) {
  const justica = numero.charAt(13);

  // Justiça Eleitoral
  if (justica === "6") {
    const uf = numero.substr(16, 2);

    const mapaUF = {
      "20": "rn",
      "26": "pe",
      "13": "mg",
      "35": "sp",
      "08": "es"
    };

    return `tre-${mapaUF[uf] || "rn"}`;
  }

  // Justiça Estadual
  if (justica === "8") {
    const uf = numero.substr(16, 2);

    const mapaTJ = {
      "08": "tj-es",
      "35": "tj-sp",
      "33": "tj-rj",
      "31": "tj-mg",
      "41": "tj-pr"
    };

    return mapaTJ[uf] || null;
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

  const dados = await buscarProcesso(numero, tribunal);

  if (!dados?.hits?.total?.value) {
    return `
Localizei o número do processo, porém ele ainda não consta na base nacional do CNJ.

Isso é comum em processos recentes ou do Tribunal de Justiça do Espírito Santo.

Recomendo consultar diretamente no site do tribunal.
`;
  }

  const prompt = `
Você é um advogado experiente.

Explique a situação do processo abaixo de forma clara para um cliente leigo.

Use linguagem simples.

Explique apenas se necessário.

Informe:
- Tribunal
- Tipo do processo
- Fase atual
- Última movimentação importante
- Se está parado ou em andamento

Evite termos técnicos e códigos.

Dados:
${JSON.stringify(dados, null, 2)}
`;

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 400
  });

  return resposta.choices[0].message.content;
}
