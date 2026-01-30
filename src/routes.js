import express from "express";
import { buscarProcesso } from "./datajud.js";
import { interpretarProcesso } from "./chatgpt.js";

const router = express.Router();

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

    res.json({ sucesso: true, resumo, bruto: dados });

  } catch (err) {
    res.status(500).json({ erro: "Erro interno" });
  }
});

export default router;
