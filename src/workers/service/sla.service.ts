import { AxiosInstance } from "axios";

export class SlaService {
  constructor(private readonly api: AxiosInstance) {}

  async getSlaByKey(key: string) {
    try {
      const res = await this.api.get(`/slaDefinitions?key=${key}`);
      return res.data?.at(0) || null;
    } catch (e) {
      console.log("Error fetching SLA definition:", e);
      throw e;
    }
  }
}
