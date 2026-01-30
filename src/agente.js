import { buscarProcesso } from "./datajud.js";
import OpenAI from "openai";

// extrai número CNJ do texto
function extrairNumero(texto) {
  const regex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
  const match = texto.match(regex);
  return match ? match[0] : null;
}

// remove pontos e traços
function normalizar(numero) {
  return numero.replace(/\D/g, "");
}

// descobre tribunal (por enquanto só eleitoral)
function descobrirTribunal(numero) {
  const justica = numero.charAt(13);

  if (justica === "6") {
    const uf = numero.substr(16, 2);

    const mapaUF = {
      "20": "rn",
      "26": "pe",
      "13": "mg",
      "35": "sp"
    };

    return `tre-${mapaUF[uf] || "rn"}`;
  }

  return null;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY
});

export async function agenteProcesso(mensagem) {
  const numeroCNJ = extrairNumero(mensagem);

  if (!numeroCNJ) {
    return "Não consegui identificar o número do processo. Pode me informar, por favor?";
  }

  const numeroLimpo = normalizar(numeroCNJ);
  const tribunal = descobrirTribunal(numeroLimpo);

  if (!tribunal) {
    return "Ainda não consigo identificar automaticamente esse tribunal.";
  }

  const dados = await buscarProcesso(numeroLimpo, tribunal);

  const prompt = `
Você é um advogado experiente.

Explique a situação atual do processo abaixo de forma simples,
sem linguagem técnica excessiva.

Informe apenas:
- tribunal
- tipo do processo
- fase atual
- última movimentação relevante
- se está parado ou em andamento

Não cite códigos, números internos ou termos técnicos.

Dados do processo:
${JSON.stringify(dados, null, 2)}
`;

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 350
  });

  return resposta.choices[0].message.content;
}
