import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse } from "../utils/response.util";

export const timerRoute = new Hono<Env>();

timerRoute.get("/", async (c) => {
  const workflowMasterService = c.get("workflowMasterService");
  const data = await workflowMasterService.getTimers();
  return c.json(dataResponse(data, 200, "Timers fetched successfully"));
});

timerRoute.post("/", async (c) => {
  const body = await c.req.json();
  const workflowMasterService = c.get("workflowMasterService");
  const res = await workflowMasterService.createTimer(body);
  return c.json(dataResponse(res));
});
