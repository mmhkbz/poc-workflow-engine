import axios from "axios";

export const createWorkflowMasterApiClient = (baseURL: string) => {
  return axios.create({
    baseURL,
  });
};
