import { Worker } from "bullmq";
import Redis from "ioredis";
import { QueueName } from "../configs/consts";
import axios from "axios";

export type CreateHttpWorkerParams = {
  redis: Redis;
};

export const createHttpWorker = (params: CreateHttpWorkerParams) => {
  return new Worker<{
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  }>(
    QueueName.HTTP_SERVICE_QUEUE,
    async (job) => {
      const { url, method, headers, body } = job.data;
      const res = await axios.request({
        method,
        url,
        headers,
        data: body,
      });
      console.log("Response from HTTP service:", res.data);
    },
    {
      connection: params.redis,
    }
  );
};
