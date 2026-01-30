import axios from "axios";

/**
 * Webhook WhatsApp - Evolution API
 * ------------------------------------------------
 * • Recebe mensagem do WhatsApp
 * • Envia para o agente jurídico (/agente)
 * • Retorna resposta ao cliente
 * • Sem loop
 * • Sem localhost
 * • Compatível com Docker + EasyPanel
 */

export async function webhookWhatsApp(req, res) {
  try {
    // ✅ responde imediatamente ao Evolution
    res.json({ success: true });

    const body = req.body;

    if (!body?.data?.message?.conversation) return;

    const mensagem = body.data.message.conversation;
    const number = body.data.key.remoteJid;
    const fromMe = body.data.key.fromMe;

    // ❌ evita loop infinito
    if (fromMe) return;

    console.log("📩 Mensagem recebida:", mensagem);

    // 🔗 chama o agente jurídico (API pública)
    const agenteResponse = await axios.post(
      "https://chatwoot-processo-ai-api.2lrt7z.easypanel.host/agente",
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

    // 📤 envia mensagem ao WhatsApp
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
