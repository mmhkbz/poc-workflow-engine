import { Worker } from "bullmq";
import Redis from "ioredis";
import { ActionHistoryStatus, QueueName } from "../configs/consts";
import axios from "axios";
import { prisma } from "./sla-worker";

export type CreateHttpWorkerParams = {
  redis: Redis;
};

export const createHttpWorker = (params: CreateHttpWorkerParams) => {
  return new Worker<{
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    actionId?: string;
  }>(
    QueueName.HTTP_SERVICE_QUEUE,
    async (job) => {
      const { url, method, headers, body, actionId } = job.data;
      try {
        const res = await axios.request({
          method,
          url,
          headers,
          data: body,
        });
        console.log("Response from HTTP service:", res.data);
        if (actionId) {
          console.log("actionId ", actionId);
          await prisma.workflowActionHistory.update({
            where: {
              id: actionId,
            },
            data: {
              completedAt: new Date(),
              status: ActionHistoryStatus.COMPLETED,
            },
          });
        }
      } catch (e) {
        console.log("Error in http service worker:", e);
        await prisma.workflowActionHistory.update({
          where: {
            id: actionId,
          },
          data: {
            status: ActionHistoryStatus.FAILED,
            completedAt: new Date(),
          },
        });
      }
    },
    {
      connection: params.redis,
    }
  );
};
