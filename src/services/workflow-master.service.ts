import { Context } from "hono";
import { Env } from "../types/types";

export class WorkflowMasterService {
  constructor(private readonly c: Context<Env>) {}

  async getWorkflowByKey(key: string) {
    try {
      const api = this.c.get("workflowMasterApi");
      const res = await api.get(`/workflows?key=${key}`);
      return res.data?.at(0) || null;
    } catch (e) {
      console.log("Error fetching workflow:", e);
      throw e;
    }
  }
}
