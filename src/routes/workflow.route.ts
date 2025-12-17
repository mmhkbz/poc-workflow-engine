import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse, errorResponse } from "../utils/response.util";
import { DEFAULT_USER, DEFAULT_WORKFLOW, NodeType } from "../configs/consts";

export const workflowRoute = new Hono<Env>();

workflowRoute.post("/start", async (c) => {
  const body = await c.req.json();
  const prisma = c.get("prisma");
  const userId = c.req.header("x-user-id") || DEFAULT_USER;

  const savedInstance = await c.get("workflowEngineService").startWorkflow({
    key: body.workflowId || DEFAULT_WORKFLOW,
    context: body.context || {},
    payloadId: body.payloadId || "",
    createdBy: userId,
  });

  return c.json(dataResponse(savedInstance));
});
