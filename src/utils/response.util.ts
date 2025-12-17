import { randomUUID } from "crypto";

export const baseResponse = (status: number, message: string) => {
  return {
    timestamp: new Date().toISOString(),
    status,
    reqId: randomUUID(),
    message,
  };
};

export const dataResponse = <T>(data: T, status = 200, message = "Success") => {
  return {
    ...baseResponse(status, message),
    data,
  };
};

export const errorResponse = (
  code: string,
  status = 500,
  message = "Internal Server Error",
  details?: string
) => {
  return {
    ...baseResponse(status, message),
    error: {
      code,
      message,
      details: details || "Unknown Error!",
    },
  };
};
