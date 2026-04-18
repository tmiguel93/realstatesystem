import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API executando em http://localhost:${env.PORT}`);
});

