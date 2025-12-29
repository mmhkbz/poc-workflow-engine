import Redis from "ioredis";
import { QueueName } from "../configs/consts";
import { Queue } from "bullmq";

export const createQueue = (params: {
  connection: Redis;
  queueName: QueueName;
}) =>
  new Queue(params.queueName, {
    connection: params.connection,
  });
