import axios from "axios";

export async function webhookWhatsApp(req, res) {
  try {
    res.json({ ok: true });

    const body = req.body;

    if (!body?.data?.message?.conversation) return;

    const mensagem = body.data.message.conversation;
    const fromMe = body.data.key.fromMe;
    const number = body.data.key.remoteJid;

    // ❌ evita loop infinito
    if (fromMe) return;

    console.log("📩 Mensagem recebida:", mensagem);

    // 👉 chama o agente jurídico
    const agenteResponse = await axios.post(
      "http://localhost:3000/agente",
      {
        mensagem
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const resposta = agenteResponse.data?.resposta;

    if (!resposta) return;

    // 📤 envia resposta ao WhatsApp
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
    console.error("❌ Erro webhook:", error.message);
  }
}
