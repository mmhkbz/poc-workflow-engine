import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { Env } from "../types/types";
import { createWorkflowMasterApiClient } from "../libs/axios";
import { env } from "hono/adapter";
import { WorkflowMasterService } from "../services/workflow-master.service";
import { createPrismaClient } from "../libs/prisma";
import { WorkflowEngineService } from "../services/workflow-engine.service";
import { TaskService } from "../services/task.service";

export const serviceMiddleware = createMiddleware<Env>(async (c, next) => {
  const { WORKFLOW_MASTER_API_URL } = env<Env["Bindings"]>(c);
  c.set(
    "workflowMasterApi",
    createWorkflowMasterApiClient(WORKFLOW_MASTER_API_URL)
  );
  c.set("workflowMasterService", new WorkflowMasterService(c));
  c.set("workflowEngineService", new WorkflowEngineService(c));
  c.set("taskService", new TaskService(c));

  const prisma = createPrismaClient(c);
  c.set("prisma", prisma);

  await next();
});
