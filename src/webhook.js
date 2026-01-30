import axios from "axios";

export async function webhookWhatsApp(req, res) {
  try {
    // responde imediatamente
    res.json({ success: true });

    // aceita apenas messages.upsert
    if (req.body?.event !== "messages.upsert") return;

    const body = req.body;

    if (!body?.data?.message?.conversation) return;

    const mensagem = body.data.message.conversation;
    const number = body.data.key.remoteJid;
    const fromMe = body.data.key.fromMe;

    // evita loop infinito
    if (fromMe) return;

    console.log("📩 Mensagem recebida:", mensagem);

    // chama o agente jurídico
    const agente = await axios.post(
      "https://chatwoot-processo-ai-api.2lrt7z.easypanel.host/agente",
      { mensagem },
      { headers: { "Content-Type": "application/json" } }
    );

    const resposta = agente.data?.resposta;
    if (!resposta) return;

    // envia ao WhatsApp
    await axios.post(
      `${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
      {
        number,
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
    console.error("❌ Erro webhook:", error?.response?.data || error.message);
  }
}
