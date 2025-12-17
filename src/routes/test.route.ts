import { Hono } from "hono";
import { Env } from "../types/types";

export const testRoute = new Hono<Env>();

testRoute.post("/", async (c) => {
  const body = await c.req.json();
  console.log("received body:", body);
  return c.json({
    message: body,
  });
});
