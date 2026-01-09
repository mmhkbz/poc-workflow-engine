import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse } from "../utils/response.util";
import { DEFAULT_USER, DEFAULT_WORKFLOW, NodeType } from "../configs/consts";

export const workflowRoute = new Hono<Env>();

workflowRoute.get("/", async (c) => {
  const res = await c.get("workflowMasterService").getWorkflows();
  const mapped = res?.map((item: any) => ({
    key: item.key,
    name: item.name,
  }));
  return c.json(dataResponse(mapped));
});

workflowRoute.post("/start", async (c) => {
  const body = await c.req.json();
  const userId = c.req.header("x-user-id") || DEFAULT_USER;

  console.log(body);

  const savedInstance = await c.get("workflowEngineService").startWorkflow({
    key: body.workflowId || DEFAULT_WORKFLOW,
    context: body.context || {},
    createdBy: userId,
    refId: body.refId || "",
  });

  return c.json(dataResponse(savedInstance));
});

workflowRoute.get("/:key", async (c) => {
  const key = c.req.param("key");
  const res = await c.get("workflowMasterService").getWorkflowByKey(key);
  return c.json(dataResponse(res));
});

workflowRoute.post("/", async (c) => {
  const body = await c.req.json();
  const res = await c.get("workflowMasterService").createWorkflow(body);
  return c.json(dataResponse(res));
});
