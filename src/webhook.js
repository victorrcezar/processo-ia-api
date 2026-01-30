import axios from "axios";
import { agenteProcesso } from "./agente.js";

const PALAVRAS_CHAVE = [
  "processo",
  "andamento",
  "novidade",
  "situação",
  "meu processo",
  "como está",
  "andou",
  "andamento do processo"
];

function contemPalavraChave(texto) {
  const msg = texto.toLowerCase();
  return PALAVRAS_CHAVE.some(p => msg.includes(p));
}

export async function webhookWhatsApp(req, res) {
  try {
    const evento = req.body;

    if (!evento?.data?.message?.conversation) {
      return res.sendStatus(200);
    }

    const texto = evento.data.message.conversation;
    const telefone = evento.data.key.remoteJid;
    const instance = evento.instance;

    // se não for assunto de processo, ignora
    if (!contemPalavraChave(texto)) {
      return res.sendStatus(200);
    }

    // chama o agente
    const resposta = await agenteProcesso(texto);

    // envia resposta pelo Evolution
    await axios.post(
      `${process.env.EVOLUTION_URL}/message/sendText/${instance}`,
      {
        number: telefone,
        text: resposta
      },
      {
        headers: {
          apikey: process.env.EVOLUTION_APIKEY
        }
      }
    );

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
}
