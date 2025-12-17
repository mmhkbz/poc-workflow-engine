import { Context } from "hono";
import { Env } from "../types/types";
import { WorkflowInstance } from "../generated/prisma/client";

export class TaskService {
  constructor(private readonly c: Context<Env>) {}

  async completeTask(params: CompleteTaskParams): Promise<void> {
    try {
      const prisma = this.c.get("prisma");
      const workflowEngine = this.c.get("workflowEngineService");

      await prisma.task.update({
        where: {
          id: params.taskId,
        },
        data: {
          outputs: {
            isApproved: params.isApproved,
            remark: params.remark,
          },
          status: "completed",
        },
      });

      const instance = params.instance;

      const variables = instance.variables as any;

      const updated = await workflowEngine.updateWorkflowInstance({
        instanceId: params.instance.id || "",
        variables: variables
          ? {
              ...(variables as any),
              outputs: {
                ...(variables.outputs || {}),
                [instance.currentNode as any]: {
                  isApproved: params.isApproved,
                  remark: params.remark,
                },
              },
            }
          : {},
        nodeKey: instance.currentNode || "",
        status: "in_progress",
      });

      await workflowEngine.dispatchWorkflow({
        instance: updated,
      });

      return;
    } catch (e) {
      console.log("Error completing task: ", e);
      throw e;
    }
  }
}

export type CompleteTaskParams = {
  taskId: string;
  isApproved: boolean;
  remark: string;
  instance: WorkflowInstance;
};
