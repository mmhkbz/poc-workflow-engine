import { Context } from "hono";
import { Env } from "../types/types";
import * as fs from "fs/promises";
import * as path from "path";

export class WorkflowMasterService {
  private workflowDefinitions: any;

  constructor(private readonly c: Context<Env>) {
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

  async createSla(data: any) {
    try {
      const res = await this.c
        .get("workflowMasterApi")
        .post("/slaDefinitions", data);
      return res.data;
    } catch (e) {
      console.log("Error creating SLA:", e);
      throw e;
    }
  }

  async createTimer(data: any) {
    try {
      const res = await this.c
        .get("workflowMasterApi")
        .post("/timerDefinitions", data);
      return res.data;
    } catch (e) {
      console.log("Error creating timer:", e);
      throw e;
    }
  }

  async getSlas() {
    try {
      const res = await this.c.get("workflowMasterApi").get("/slaDefinitions");
      return res.data || [];
    } catch (e) {
      console.log("Error fetching SLAs:", e);
      throw e;
    }
  }

  async getTimers() {
    try {
      const res = await this.c
        .get("workflowMasterApi")
        .get("/timerDefinitions");
      return res.data || [];
    } catch (e) {
      console.log("Error fetching timers:", e);
      throw e;
    }
  }

  async getSlaByKey(key: string) {
    try {
      const res = await this.c
        .get("workflowMasterApi")
        .get(`/slaDefinitions?key=${key}`);
      return res.data?.at(0) || null;
    } catch (e) {
      console.log("Error fetching SLA definition:", e);
      throw e;
    }
  }

  async getTimerByKey(key: string) {
    try {
      const res = await this.c
        .get("workflowMasterApi")
        .get(`/timerDefinitions?key=${key}`);
      return res.data?.at(0) || null;
    } catch (e) {
      console.log("Error fetching timer definition:", e);
      throw e;
    }
  }
}
