import axios from "axios";

/**
 * TRAVA DE DUPLICIDADE
 * impede responder a mesma mensagem várias vezes
 */
const mensagensProcessadas = new Set();

/**
 * Extrai número do processo (CNJ) do texto
 */
function extrairNumeroProcesso(texto = "") {
  if (!texto) return null;

  // aceita com ou sem pontos e traços
  const regex =
    /\d{7}[-.\s]?\d{2}[.\s]?\d{4}[.\s]?\d[.\s]?\d{2}[.\s]?\d{4}/;

  const match = texto.match(regex);
  if (!match) return null;

  return match[0].replace(/\D/g, "");
}

/**
 * Monta resposta curta e jurídica
 */
function montarResumo(dados) {
  if (!dados?.bruto?.hits?.hits?.length) {
    return "Não encontrei informações atualizadas sobre esse processo.";
  }

  const processos = dados.bruto.hits.hits;

  const p = processos[0]._source;

  const ultimaMovimentacao =
    p.movimentos?.[p.movimentos.length - 1];

  return (
    `Aqui está a situação atual do seu processo:\n\n` +
    `• *Tribunal:* ${p.tribunal}\n` +
    `• *Classe:* ${p.classe?.nome}\n` +
    `• *Sistema:* ${p.sistema?.nome}\n` +
    `• *Data de ajuizamento:* ${p.dataAjuizamento?.slice(0, 8)}\n` +
    `• *Última movimentação:* ${ultimaMovimentacao?.nome || "Não informada"}\n` +
    `• *Data da última movimentação:* ${
      ultimaMovimentacao?.dataHora?.slice(0, 10) || "—"
    }\n\n` +
    `Se quiser, posso acompanhar esse processo e avisar quando houver novidades.`
  );
}

/**
 * WEBHOOK PRINCIPAL
 */
export async function webhookWhatsApp(req, res) {
  try {
    const { data } = req.body;

    if (!data?.message?.conversation) {
      return res.sendStatus(200);
    }

    const messageId = data.key.id;

    // 🔒 trava duplicidade
    if (mensagensProcessadas.has(messageId)) {
      return res.sendStatus(200);
    }

    mensagensProcessadas.add(messageId);

    setTimeout(() => {
      mensagensProcessadas.delete(messageId);
    }, 120000);

    const textoCliente = data.message.conversation;
    const numeroCliente = data.key.remoteJid;

    console.log("📩 Mensagem recebida:", textoCliente);

    const numeroProcesso = extrairNumeroProcesso(textoCliente);

    if (!numeroProcesso) {
      await axios.post(
        `https://evo.upandco.com.br/message/sendText/up-company`,
        {
          number: numeroCliente,
          text: "Para consultar seu processo, preciso que me informe o número completo, por favor.",
        },
        {
          headers: {
            apikey: process.env.EVOLUTION_API_KEY,
          },
        }
      );

      return res.sendStatus(200);
    }

    // 🔎 consulta API de processos
    const resposta = await axios.post(
      "https://chatwoot-processo-ai-api.2lrt7z.easypanel.host/processo",
      {
        numero: numeroProcesso,
        tribunal: "tre-rn",
      }
    );

    const textoResposta = montarResumo(resposta.data);

    // 📤 responde no WhatsApp
    await axios.post(
      `https://evo.upandco.com.br/message/sendText/up-company`,
      {
        number: numeroCliente,
        text: textoResposta,
      },
      {
        headers: {
          apikey: process.env.EVOLUTION_API_KEY,
        },
      }
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Erro webhook:", error?.message);
    return res.sendStatus(200);
  }
}
