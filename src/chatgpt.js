(
echo import OpenAI from "openai";
echo.
echo const openai = new OpenAI({
echo   apiKey: process.env.OPENAI_APIKEY
echo });
echo.
echo export async function interpretarProcesso(dados) {
echo   const prompt = `Explique este processo juridico:\n\n${JSON.stringify(dados, null, 2)}`;
echo.
echo   const r = await openai.chat.completions.create({
echo     model: "gpt-4o-mini",
echo     messages: [{ role: "user", content: prompt }]
echo   });
echo.
echo   return r.choices[0].message.content;
echo }
) > src\chatgpt.js
