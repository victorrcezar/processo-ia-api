import axios from "axios";

export async function buscarProcesso(numeroProcesso, tribunal) {
  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;

  const body = {
    query: {
      match: {
        numeroProcesso
      }
    }
  };

  const headers = {
    Authorization: `APIKey ${process.env.DATAJUD_APIKEY}`,
    "Content-Type": "application/json"
  };

  const response = await axios.post(url, body, { headers });

  return response.data;
}
