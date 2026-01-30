import axios from "axios";

export async function webhookWhatsApp(req, res) {
  try {
    res.json({ success: true });

    const body = req.body;

    if (!body?.data?.message?.conversation) return;

    const mensagem = body.data.message.conversation;
    const number = body.data.key.remoteJid;
    const fromMe = body.data.key.fromMe;

    if (fromMe) return;

    console.log("📩 Mensagem recebida:", mensagem);

    // 🔍 LOG DE SEGURANÇA
    console.log("🔑 API KEY EXISTS:", !!process.env.EVOLUTION_API_KEY);
    console.log("🏷 INSTANCE:", process.env.EVOLUTION_INSTANCE);
    console.log("🌐 URL:", process.env.EVOLUTION_URL);

    // 👉 chama o agente
    const agente = await axios.post(
      "https://chatwoot-processo-ai-api.2lrt7z.easypanel.host/agente",
      { mensagem },
      { headers: { "Content-Type": "application/json" } }
    );

    const resposta = agente.data?.resposta;

    if (!resposta) return;

    // ✅ ENVIO WHATSAPP (igual ao CURL)
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
