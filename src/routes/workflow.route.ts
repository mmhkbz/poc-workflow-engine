import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse } from "../utils/response.util";
import { DEFAULT_USER, DEFAULT_WORKFLOW, NodeType } from "../configs/consts";

export const workflowRoute = new Hono<Env>();

// Get workflow instances by createdBy
workflowRoute.get("/instances", async (c) => {
  const createdBy = c.req.query("createdBy") || DEFAULT_USER;
  const status = c.req.query("status");
  const prisma = c.get("prisma");
  const instances = await prisma.workflowInstance.findMany({
    where: { createdBy, currentNode: status },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      refId: true,
      createdBy: true,
      status: true,
      variables: true,
      currentNode: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return c.json(dataResponse(instances));
});

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

workflowRoute.get("/instances/:instanceId/history", async (c) => {
  const instanceId = c.req.param("instanceId");
  const prisma = c.get("prisma");
  const history = await prisma.workflowActionHistory.findMany({
    where: { workflowInstanceId: instanceId },
    orderBy: { createdAt: "asc" },
  });
  return c.json(dataResponse(history));
});
