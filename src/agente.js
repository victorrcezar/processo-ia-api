import { buscarProcesso } from "./datajud.js";
import OpenAI from "openai";

/**
 * ===============================
 * EXTRAI NÚMERO CNJ
 * ===============================
 */
function extrairNumero(texto) {
  const regex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
  const match = texto.match(regex);
  return match ? match[0] : null;
}

/**
 * ===============================
 * NORMALIZA NÚMERO
 * ===============================
 */
function normalizar(numero) {
  return numero.replace(/\D/g, "");
}

/**
 * ===============================
 * DESCOBRE TRIBUNAL
 * (inicialmente eleitoral)
 * ===============================
 */
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

/**
 * ===============================
 * OPENAI
 * ===============================
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY
});

/**
 * ===============================
 * AGENTE JURÍDICO
 * ===============================
 */
export async function agenteProcesso(mensagem) {
  const numeroCNJ = extrairNumero(mensagem);

  if (!numeroCNJ) {
    return "Para eu conseguir verificar, preciso que você me informe o número do processo, tudo bem?";
  }

  const numeroLimpo = normalizar(numeroCNJ);
  const tribunal = descobrirTribunal(numeroLimpo);

  if (!tribunal) {
    return "Ainda não consigo identificar automaticamente o tribunal desse processo.";
  }

  const dados = await buscarProcesso(numeroLimpo, tribunal);

  /**
   * ===============================
   * PROMPT JURÍDICO PROFISSIONAL
   * ===============================
   */
  const prompt = `
Você é um advogado experiente atendendo um cliente leigo pelo WhatsApp.

Seu papel é explicar a situação do processo de forma clara,
humana e fácil de entender.

⚠️ REGRAS IMPORTANTES:

- Fale como um advogado conversando com o cliente.
- Use linguagem simples, sem juridiquês.
- Não explique termos técnicos se não forem necessários.
- Se precisar explicar, explique em uma frase curta.
- Não faça previsões de resultado.
- Não diga que o cliente vai ganhar ou perder.
- Não prometa prazos.
- Não utilize artigos de lei.
- Não utilize números internos do tribunal.
- Não cite códigos, IDs, classes processuais ou nomes técnicos complexos.
- Seja objetivo, educado e profissional.

Explique SOMENTE:

• Qual tribunal está julgando  
• Que tipo de processo é  
• Em que fase o processo está agora  
• Qual foi a última movimentação importante  
• Se o processo está parado ou em andamento  

Se o processo estiver parado:
explique de forma simples que isso é normal e que depende do Judiciário.

Se estiver em andamento:
explique que o processo segue seu curso normal.

Finalize sempre com uma frase tranquila, como:

"Qualquer novidade importante, eu te aviso."

---

DADOS DO PROCESSO:
${JSON.stringify(dados, null, 2)}
`;

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um advogado brasileiro experiente." },
      { role: "user", content: prompt }
    ],
    temperature: 0.25,
    max_tokens: 400
  });

  return resposta.choices[0].message.content.trim();
}
