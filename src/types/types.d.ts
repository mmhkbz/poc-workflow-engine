import { PrismaClient } from "../generated/prisma/client";

export type Env = {
  Bindings: {
    WORKFLOW_MASTER_API_URL: string;
    DATABASE_URL: string;
  };
  Variables: {
    workflowMasterApi: import("axios").AxiosInstance;
    workflowMasterService: import("../services/workflow-master.service").WorkflowMasterService;
    prisma: PrismaClient;
    workflowEngineService: import("../services/workflow-engine.service").WorkflowEngineService;
    taskService: import("../services/task.service").TaskService;
  };
};

export type BaseResponse = {
  timestamp: string;
  status: number;
  reqId: string;
  message: string;
};

export type DataResponse<T> = {
  data: T;
} & BaseResponse;

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details: string;
  };
} & BaseResponse;
