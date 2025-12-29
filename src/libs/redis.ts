import IORedis from "ioredis";

export const createRedis = (params: {
  host: string;
  port: number;
  password?: string;
}) =>
  new IORedis({
    host: params.host,
    port: params.port,
    password: params.password,
  });
