import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY
});

export async function interpretarProcesso(dados) {
  const prompt = `
Você é um assistente jurídico.
Explique de forma simples os dados abaixo.

${JSON.stringify(dados, null, 2)}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 400
  });

  return completion.choices[0].message.content;
}
