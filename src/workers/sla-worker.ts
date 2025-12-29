import Redis from "ioredis";
import { createWorker } from "../libs/queue";
import { QueueName } from "../configs/consts";

export const createSlaWorker = (redis: Redis) => {
  createWorker<string>({
    connection: redis,
    queueName: QueueName.SLA_QUEUE,
    processor: async (job) => {
      console.log("SLA Worker", job.data);
    },
  });
};
