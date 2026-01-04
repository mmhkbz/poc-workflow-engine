import { Worker } from "bullmq";
import Redis from "ioredis";
import { QueueName } from "../configs/consts";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { createWorkflowMasterApiClient } from "../libs/axios";
import { SlaService } from "./service/sla.service";
import { httpServiceQueue } from "../libs/queue";
import { WorkflowEngineService } from "./service/workflow-engine.service";

// const redis = createRedis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: Number(process.env.REDIS_PORT) || 6379,
// });

type CreateSlaWorkerParams = {
  redis: Redis;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
  }),
});
const workflowMasterApi = createWorkflowMasterApiClient(
  process.env.WORKFLOW_MASTER_API_URL || ""
);

export const createSlaWorker = (params: CreateSlaWorkerParams) => {
  return new Worker(
    QueueName.SLA_QUEUE,
    async (job) => {
      const { slaInstanceId, level } = job.data;
      console.log(
        `Processing SLA job for instance: ${slaInstanceId}, level: ${level}`
      );

      const slaInstance = await prisma.slaInstance.findUnique({
        where: { id: slaInstanceId },
        include: { task: true },
      });

      if (slaInstance && slaInstance.task.status !== "completed") {
        const slaService = new SlaService(workflowMasterApi);
        const slaDef = await slaService.getSlaByKey(slaInstance.slaKey);
        const fact = slaDef.facts.find((f: any) => f.level === level);

        if (fact) {
          await prisma.slaInstance.update({
            where: { id: slaInstanceId },
            data: { status: "breached" },
          });
          console.log(
            `SLA breached for task ${slaInstance.taskId} at level ${level}`
          );

          for (const action of fact.actions) {
            switch (action.type) {
              case "service":
                await httpServiceQueue.add(
                  QueueName.HTTP_SERVICE_QUEUE,
                  action.config
                );
                break;
              case "escalate":
                const originalTask = slaInstance.task;
                await prisma.$transaction([
                  prisma.task.update({
                    where: { id: originalTask.id },
                    data: { status: "escalated" },
                  }),
                  prisma.task.create({
                    data: {
                      status: "pending",
                      workflowId: originalTask.workflowId,
                      nodeKey: originalTask.nodeKey,
                      instanceId: originalTask.instanceId,
                      inputs: originalTask.inputs || (undefined as any),
                      outputs: originalTask.outputs || (undefined as any),
                      assignedRoleId: action.config.roles.join(","),
                      escalatedFromTaskId: originalTask.id,
                    },
                  }),
                ]);

                break;
              case "mutation":
                if (action.config.type === "transition") {
                  console.log("action", action);
                  const workflowEngine = new WorkflowEngineService(prisma);
                  const task = await prisma.task.findUnique({
                    where: { id: slaInstance.taskId },
                  });
                  console.log("task", task);
                  if (task) {
                    const instance = await prisma.workflowInstance.findUnique({
                      where: { id: task.instanceId },
                    });
                    const workflowDefinition =
                      instance?.defSnapshot || ({} as any);
                    if (instance) {
                      await workflowEngine.handleNode(
                        task.instanceId,
                        action.config.toNode,
                        workflowDefinition
                      );
                    }
                  }
                }
                break;
            }
          }
        }
      }
      if (slaInstance?.task.status === "completed") {
        await prisma.slaInstance.update({
          where: { id: slaInstanceId },
          data: { status: "completed" },
        });
      }
    },
    {
      connection: params.redis,
    }
  );
};
