import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse } from "../utils/response.util";

export const slaRoute = new Hono<Env>();

slaRoute.get("/", async (c) => {
  const workflowMasterService = c.get("workflowMasterService");
  const data = await workflowMasterService.getSlas();
  return c.json(dataResponse(data, 200, "SLAs fetched successfully"));
});

slaRoute.post("/", async (c) => {
  const body = await c.req.json();
  const workflowMasterService = c.get("workflowMasterService");
  const res = await workflowMasterService.createSla(body);
  return c.json(dataResponse(res));
});
