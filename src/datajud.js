(
echo import axios from "axios";
echo.
echo export async function buscarProcesso(numeroProcesso, tribunal) {
echo   const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
echo.
echo   const body = {
echo     query: {
echo       match: { numeroProcesso }
echo     }
echo   };
echo.
echo   const headers = {
echo     Authorization: `APIKey ${process.env.DATAJUD_APIKEY}`,
echo     "Content-Type": "application/json"
echo   };
echo.
echo   const r = await axios.post(url, body, { headers });
echo   return r.data;
echo }
) > src\datajud.js
