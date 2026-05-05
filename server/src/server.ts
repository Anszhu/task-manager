import { createApp } from "./app.js";

const start = async () => {
  const app = createApp();
  const port = Number(process.env.PORT ?? 4300);

  try {
    await app.listen({
      port,
      host: "0.0.0.0"
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
