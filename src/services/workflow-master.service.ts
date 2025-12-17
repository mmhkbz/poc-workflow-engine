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

  async getWorkflows() {
    try {
      const api = this.c.get("workflowMasterApi");
      const res = await api.get(`/workflows`);
      return res.data || [];
    } catch (e) {
      console.log("Error fetching workflows:", e);
      throw e;
    }
  }

  async getRoles() {
    try {
      const api = this.c.get("workflowMasterApi");
      const res = await api.get(`/roles`);
      return res.data || [];
    } catch (e) {
      console.log("Error fetching roles:", e);
      throw e;
    }
  }

  async createWorkflow(data: any) {
    try {
      const res = await this.c
        .get("workflowMasterApi")
        .post("/workflows", data);
      return res.data;
    } catch (e) {
      console.log("Error creating workflow:", e);
      throw e;
    }
  }
}
