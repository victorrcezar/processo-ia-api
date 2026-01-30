import axios from "axios";

/**
 * Guarda IDs de mensagens já processadas
 * (evita duplicação causada pela Evolution)
 */
const mensagensProcessadas = new Set();

export async function webhookWhatsApp(req, res) {
  try {
    /**
     * ⚠️ Responde imediatamente para a Evolution
     * evita reenvio automático
     */
    res.status(200).json({ ok: true });

    /**
     * ✅ Aceita somente messages.upsert
     */
    if (req.body?.event !== "messages.upsert") return;

    const data = req.body.data;

    if (!data?.message) return;

    const messageId = data.key?.id;
    const fromMe = data.key?.fromMe;

    /**
     * ❌ Ignora mensagens enviadas pelo próprio bot
     */
    if (fromMe) return;

    /**
     * ❌ Ignora mensagens duplicadas
     */
    if (mensagensProcessadas.has(messageId)) {
      console.log("⏭ Mensagem duplicada ignorada:", messageId);
      return;
    }

    mensagensProcessadas.add(messageId);

    /**
     * 📩 Extrai texto
     */
    const texto =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text;

    if (!texto) return;

    console.log("📩 Mensagem recebida:", texto);

    /**
     * ===============================
     * 🤖 CHAMA AGENTE JURÍDICO
     * ===============================
     */
    const agente = await axios.post(
      "https://chatwoot-processo-ai-api.2lrt7z.easypanel.host/agente",
      { mensagem: texto },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const resposta = agente.data?.resposta;
    if (!resposta) return;

    /**
     * ===============================
     * 📤 ENVIA MENSAGEM AO WHATSAPP
     * ===============================
     */
    await axios.post(
      `${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
      {
        number: data.key.remoteJid,
        text: resposta
      },
      {
        headers: {
          apikey: process.env.EVOLUTION_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error(
      "❌ Erro webhook:",
      error?.response?.data || error.message
    );
  }
}
