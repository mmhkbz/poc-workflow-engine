import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { Env } from "../types/types";
import { createWorkflowMasterApiClient } from "../libs/axios";
import { env } from "hono/adapter";
import { WorkflowMasterService } from "../services/workflow-master.service";
import { createPrismaClient } from "../libs/prisma";
import { WorkflowEngineService } from "../services/workflow-engine.service";
import { TaskService } from "../services/task.service";
import { createRedis } from "../libs/redis";
import { createQueue } from "../libs/queue";
import { QueueName } from "../configs/consts";

export const serviceMiddleware = createMiddleware<Env>(async (c, next) => {
  const { WORKFLOW_MASTER_API_URL, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } =
    env<Env["Bindings"]>(c);

  const redis = createRedis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
  });
  c.set("redis", redis);

  c.set(
    "redis",
    createRedis({
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      password: REDIS_PASSWORD,
    })
  );

  const slaQueue = createQueue({
    connection: redis,
    queueName: QueueName.SLA_QUEUE,
  });
  c.set("slaQueue", slaQueue);

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
