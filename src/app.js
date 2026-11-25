import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { authRouter } from "./routes/auth.routes.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerUiDistPath = path.join(
  __dirname,
  "../node_modules/swagger-ui-dist",
);
const openApiPath = path.join(__dirname, "../docs/openapi.yaml");

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiRouter);
  app.use("/api/auth", authRouter);

  app.get("/docs", (req, res) => {
    res.sendFile(path.join(swaggerUiDistPath, "index.html"));
  });

  app.get("/docs/swagger-initializer.js", (req, res) => {
    res.type("application/javascript").send(`
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: "StandaloneLayout",
        });
      };
    `);
  });

  app.use("/docs", express.static(swaggerUiDistPath));

  app.get("/openapi.yaml", (req, res) => {
    res.sendFile(openApiPath);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
