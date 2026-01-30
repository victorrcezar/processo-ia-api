(
echo import express from "express";
echo import { buscarProcesso } from "./datajud.js";
echo import { interpretarProcesso } from "./chatgpt.js";
echo.
echo const router = express.Router();
echo.
echo router.post("/processo", async (req, res) =^> {
echo   try {
echo     const { numero, tribunal } = req.body;
echo.
echo     if (!numero ^|^| !tribunal) {
echo       return res.status(400).json({ erro: "numero e tribunal obrigatorios" });
echo     }
echo.
echo     const dados = await buscarProcesso(numero, tribunal);
echo     const resumo = await interpretarProcesso(dados);
echo.
echo     res.json({ sucesso: true, resumo, bruto: dados });
echo.
echo   } catch (e) {
echo     res.status(500).json({ erro: "erro interno" });
echo   }
echo });
echo.
echo export default router;
) > src\routes.js
