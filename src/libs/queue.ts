import Redis from "ioredis";
import { QueueName } from "../configs/consts";
import { Processor, Queue, Worker } from "bullmq";

export const createQueue = (params: {
  connection: Redis;
  queueName: QueueName;
}) =>
  new Queue(params.queueName, {
    connection: params.connection,
  });

export const createWorker = <T>(params: {
  connection: Redis;
  queueName: QueueName;
  processor?: Processor<T>;
}) => {
  return new Worker<T>(params.queueName, params.processor, {
    connection: params.connection,
  });
};
