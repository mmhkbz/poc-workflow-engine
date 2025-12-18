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

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
