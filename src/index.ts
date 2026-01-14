import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serviceMiddleware } from "./middlewares/service.middleware";
import { Env } from "./types/types";
import { workflowRoute } from "./routes/workflow.route";
import { taskRoute } from "./routes/task.route";
import { testRoute } from "./routes/test.route";
import { roleRoute } from "./routes/role.route";
import { cors } from "hono/cors";
import { createRedis } from "./libs/redis";
import { createHttpWorker } from "./workers/http-worker";
import { createSlaWorker } from "./workers/sla-worker";
import { slaRoute } from "./routes/sla.route";
import { timerRoute } from "./routes/timer.route";

const app = new Hono<Env>();
app.use(serviceMiddleware);

app.use(
  cors({
    origin: "*",
  })
);

app.route("/api/v1/workflows", workflowRoute);
app.route("/api/v1/tasks", taskRoute);
app.route("/api/v1/test", testRoute);
app.route("/api/v1/roles", roleRoute);
app.route("/api/v1/slas", slaRoute);
app.route("/api/v1/timers", timerRoute);

let count = 0;

// app.get("/api/v1/test", async (c) => {
//   const redis = c.get("redis");
//   await redis.set("counter", count);
//   await redis.incr("counter");
//   const result = await redis.get("counter");
//   count = Number(result);
//   const slaQueue = c.get("slaQueue");
//   console.log(
//     "new task will be executed on ",
//     dayjs().add(count, "minute").toISOString()
//   );
//   await slaQueue.add(
//     QueueName.SLA_QUEUE,
//     `Test job data with ${result}m delayed.`,
//     {
//       delay: ms(`${count}m`),
//     }
//   );
//   return c.json({ count: result });
// });

serve(
  {
    fetch: app.fetch,
    port: 3002,
  },
  async (info) => {
    const redisHost = process.env.REDIS_HOST || "";
    const redisPort = Number(process.env.REDIS_PORT);
    const redisPassword = process.env.REDIS_PASSWORD;

    const redis = createRedis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    });

    createHttpWorker({ redis });
    createSlaWorker({ redis });

    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
