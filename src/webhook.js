import axios from "axios";

const mensagensProcessadas = new Set();

export async function webhookWhatsApp(req, res) {
  try {
    res.status(200).json({ ok: true });

    // ✅ PROCESSA SOMENTE messages.upsert
    if (req.body?.event !== "messages.upsert") return;

    const data = req.body.data;

    if (!data?.message) return;

    const messageId = data.key?.id;
    const fromMe = data.key?.fromMe;

    // ❌ ignora mensagens enviadas pelo bot
    if (fromMe) return;

    // ❌ ignora duplicadas
    if (mensagensProcessadas.has(messageId)) {
      console.log("⏭ Mensagem duplicada ignorada:", messageId);
      return;
    }

    mensagensProcessadas.add(messageId);

    const texto =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text;

    if (!texto) return;

    console.log("📩 Mensagem recebida:", texto);

    // ===============================
    // CHAMA SEU AGENTE
    // ===============================
    const agente = await axios.post(
      "https://chatwoot-processo-ai-api.2lrt7z.easypanel.host/agente",
      { mensagem: texto },
      { headers: { "Content-Type": "application/json" } }
    );

    const resposta = agente.data?.resposta;
    if (!resposta) return;

    // ===============================
    // ENVIA RESPOSTA
    // ===============================
    await axios.post(
      `${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
      {
        number: data.key.remoteJid,
        text: resposta
      },
      {
        headers: {
          apikey: process.env.EVOLUTION_APIKEY,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    console.error("❌ Erro webhook:", err?.response?.data || err.message);
  }
}
