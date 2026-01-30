(
echo import express from "express";
echo import routes from "./routes.js";
echo.
echo const app = express();
echo app.use(express.json());
echo.
echo app.get("/health", (req, res) =^> {
echo   res.json({ status: "API online" });
echo });
echo.
echo app.use(routes);
echo.
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo app.listen(PORT, () =^> {
echo   console.log("Servidor rodando na porta", PORT);
echo });
) > src\index.js
