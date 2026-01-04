import { Context } from "hono";
import { Env } from "../types/types";

export class SlaService {
  constructor(private readonly c: Context<Env>) {}

  async getSlaByKey(key: string) {
    try {
      const api = this.c.get("workflowMasterApi");
      const res = await api.get(`/slaDefinitions?key=${key}`);
      return res.data?.at(0) || null;
    } catch (e) {
      console.log("Error fetching SLA definition:", e);
      throw e;
    }
  }
}
