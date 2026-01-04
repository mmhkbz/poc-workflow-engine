import { Context } from "hono";
import { Env } from "../../types/types";
import * as fs from "fs/promises";
import * as path from "path";
import { AxiosInstance } from "axios";

export class WorkflowMasterService {
  private workflowDefinitions: any;

  constructor(private readonly api: AxiosInstance) {
    this.loadWorkflowDefinitions();
  }

  private async loadWorkflowDefinitions() {
    try {
      const filePath = path.join(process.cwd(), "mock", "parallel.json");
      const data = await fs.readFile(filePath, "utf-8");
      this.workflowDefinitions = JSON.parse(data).workflowDefinitions;
    } catch (error) {
      console.error("Error loading workflow definitions:", error);
      this.workflowDefinitions = [];
    }
  }

  async getWorkflowByKey(key: string) {
    try {
      const res = await this.api.get(`/workflows?key=${key}`);
      return res.data?.at(0) || null;
    } catch (e) {
      console.log("Error fetching workflow:", e);
      throw e;
    }
  }

  async getWorkflows() {
    try {
      const res = await this.api.get(`/workflows`);
      return res.data || [];
    } catch (e) {
      console.log("Error fetching workflows:", e);
      throw e;
    }
  }

  async getRoles() {
    try {
      const res = await this.api.get(`/roles`);
      return res.data || [];
    } catch (e) {
      console.log("Error fetching roles:", e);
      throw e;
    }
  }

  async createWorkflow(data: any) {
    try {
      const res = await this.api.post("/workflows", data);
      return res.data;
    } catch (e) {
      console.log("Error creating workflow:", e);
      throw e;
    }
  }
}
