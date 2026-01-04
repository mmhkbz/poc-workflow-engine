import { Queue } from "bullmq";
import { createRedis } from "./redis";
import { QueueName } from "../configs/consts";

const redis = createRedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

export const httpServiceQueue = new Queue(QueueName.HTTP_SERVICE_QUEUE, {
  connection: redis,
});
const notificationQueue = new Queue(QueueName.NOTIFICATION_QUEUE, {
  connection: redis,
});
const slaQueue = new Queue(QueueName.SLA_QUEUE, { connection: redis });
const timerQueue = new Queue(QueueName.TIMER_QUEUE, {
  connection: redis,
});

export { notificationQueue, slaQueue, timerQueue };
