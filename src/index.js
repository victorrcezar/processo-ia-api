import express from "express";
import routes from "./routes.js";
import { webhookWhatsApp } from "./webhook.js";

const app = express();

app.use(express.json());

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "API online" });
});

/**
 * Rotas principais
 */
app.use(routes);

/**
 * Webhook Evolution API (WhatsApp)
 */
app.post("/webhook/whatsapp", webhookWhatsApp);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});
