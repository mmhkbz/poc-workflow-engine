import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse } from "../utils/response.util";

export const roleRoute = new Hono<Env>();

roleRoute.get("/", async (c) => {
  const res = await c.get("workflowMasterService").getRoles();
  return c.json(dataResponse(res));
});
