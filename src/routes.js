import express from "express";
import { buscarProcesso } from "./datajud.js";
import { interpretarProcesso } from "./chatgpt.js";
import { agenteProcesso } from "./agente.js";

const router = express.Router();

/**
 * ============================
 * ROTA TÉCNICA (JSON COMPLETO)
 * ============================
 * POST /processo
 */
router.post("/processo", async (req, res) => {
  try {
    const { numero, tribunal } = req.body;

    if (!numero || !tribunal) {
      return res.status(400).json({
        erro: "Informe numero e tribunal"
      });
    }

    const dados = await buscarProcesso(numero, tribunal);
    const resumo = await interpretarProcesso(dados);

    res.json({
      sucesso: true,
      resumo,
      bruto: dados
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao consultar processo"
    });
  }
});

/**
 * ============================
 * ROTA AGENTE JURÍDICO
 * ============================
 * POST /agente
 *
 * Entrada:
 * {
 *   "mensagem": "E aí doutor, como está meu processo 0000000-00.0000.0.00.0000?"
 * }
 *
 * Saída:
 * {
 *   "resposta": "Resumo jurídico em linguagem humana"
 * }
 */
router.post("/agente", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!mensagem) {
      return res.status(400).json({
        erro: "Informe a mensagem do cliente"
      });
    }

    const resposta = await agenteProcesso(mensagem);

    res.json({
      resposta
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao processar mensagem do agente"
    });
  }
});

export default router;
