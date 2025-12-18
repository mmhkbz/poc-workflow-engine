import { Context } from "hono";
import { Env } from "../types/types";
import {
  WorkflowInstance,
  WorkflowInstanceStatus,
} from "../generated/prisma/client";
import {
  AssignmentType,
  ConditionType,
  NodeType,
  ServiceType,
} from "../configs/consts";
import axios from "axios";
import jexl from "jexl";
import { evalTemplate } from "../utils/expr.util";

export class WorkflowEngineService {
  constructor(private readonly c: Context<Env>) {}

  async startWorkflow(params: StartWorkflowParams): Promise<WorkflowInstance> {
    const prisma = this.c.get("prisma");
    // load workflow from API
    const workflow = await this.c
      .get("workflowMasterService")
      .getWorkflowByKey(params.key);

    if (!workflow) {
      throw new Error("Workflow not found!");
    }

    // find start node
    const startNode = workflow.nodes.find(
      (node: any) => node.type === NodeType.START
    );

    if (!startNode) {
      throw new Error("Start node not found in workflow!");
    }

    const instance = await prisma.workflowInstance.create({
      data: {
        variables: {
          refId: params.refId || "",
          request: params.context || {},
        },
        workflowId: workflow.key || "",
        currentNode: startNode.key,
        refId: params.payloadId,
        createdBy: params.createdBy,
        defSnapshot: workflow,
      },
    });

    await this.dispatchWorkflow({ instance });
    return instance;
  }

  async updateWorkflowInstance(
    params: UpdateWorkflowInstanceParams
  ): UpdateWorkflowInstanceResponse {
    const prisma = this.c.get("prisma");
    const res = await prisma.workflowInstance.update({
      where: {
        id: params.instanceId,
      },
      data: {
        variables: {
          ...params.variables,
        },
        currentNode: params.nodeKey,
        status: params.status,
      },
    });
    return res;
  }

  async dispatchWorkflow(params: DispatchWorkflowParams) {
    const defSnapshot = JSON.parse(
      JSON.stringify(params.instance.defSnapshot) || "{}"
    );
    const transitions = defSnapshot.transitions || [];
    const nodes = defSnapshot.nodes || [];

    const availableTransitions: any[] =
      transitions.filter(
        (item: any) => item.fromNode == params.instance.currentNode
      ) || [];

    for (const transition of availableTransitions) {
      const toNode = nodes.find((node: any) => node.key === transition.toNode);
      if (toNode) {
        switch (toNode.type) {
          case NodeType.TASK:
            await this.createTask({
              instance: params.instance,
              node: toNode,
            });
            break;
          case NodeType.SERVICE:
            await this.executeService({
              instance: params.instance,
              node: toNode,
            });
            break;
          case NodeType.DECISION:
            await this.makeDecision({
              node: toNode,
              instance: params.instance,
            });
            break;
          case NodeType.END:
            await this.updateWorkflowInstance({
              instanceId: params.instance.id || "",
              nodeKey: toNode.key || "",
              status: WorkflowInstanceStatus.completed,
              variables: params.instance.variables || ({} as any),
            });
        }
      } else {
        await this.updateWorkflowInstance({
          instanceId: params.instance.id || "",
          nodeKey: transition.fromNode,
          status: WorkflowInstanceStatus.completed,
          variables: params.instance.variables || ({} as any),
        });
      }
    }
  }

  async createTask({ instance, node }: CreateTaskParams) {
    const prisma = this.c.get("prisma");
    await prisma.$transaction(async (tx) => {
      const assignment = node?.config?.payload;
      await tx.task.create({
        data: {
          instanceId: instance.id || "",
          assignedRoleId:
            assignment?.type === AssignmentType.ROLE
              ? assignment?.roles?.map((role: any) => role)?.join(",")
              : null,
          assignedUserId:
            assignment?.type === AssignmentType.USER
              ? assignment?.users?.map((user: any) => user)?.join(",")
              : null,
          inputs: instance.variables || {},
          workflowId: instance.workflowId || "",
          outputs: node?.config?.payload?.outputs || {},
          createdBy: instance.createdBy || "",
          updatedBy: instance.updatedBy || "",
          status: "pending",
        },
      });
      const updated = await tx.workflowInstance.update({
        where: {
          id: instance.id || "",
        },
        data: {
          currentNode: node.key,
        },
      });
      this.dispatchWorkflow({
        instance: updated,
      });
    });
  }

  async executeService(parmas: ExecuteServiceParams): ExecuteServiceResponse {
    const payload = parmas.node?.config?.payload || {};
    if (!payload) return;
    switch (payload?.type) {
      case ServiceType.HTTP:
        await this.executeHttp({
          ...payload,
          variables: parmas.instance.variables,
        });
        break;
    }
    const res = await this.updateWorkflowInstance({
      instanceId: parmas.instance.id || "",
      status: WorkflowInstanceStatus.completed,
      nodeKey: parmas.node.key || "",
      variables: parmas.instance.variables || ({} as any),
    });
    await this.dispatchWorkflow({
      instance: res,
    });
  }

  private async executeHttp(payload: any) {
    const stringifiedBody = JSON.stringify(payload.body || {});
    console.log(payload.body);
    console.log(payload.variables);
    const res = await axios.request({
      method: payload.method,
      url: payload.url,
      data: payload.body
        ? stringifiedBody?.includes("variables")
          ? await evalTemplate(payload.body, {
              variables: payload.variables,
            })
          : payload.body
        : {},
    });
    return res;
  }

  private async makeDecision(params: MakeDecisionParams) {
    const defSnapshot = JSON.parse(
      JSON.stringify(params.instance.defSnapshot) || "{}"
    );
    const transitions = defSnapshot.transitions || [];

    const availableTransitions: any[] =
      transitions.filter((item: any) => item.fromNode === params.node.key) ||
      [];

    for (const transition of availableTransitions) {
      if (transition?.config?.type === "condition") {
        const payload = transition?.config?.payload;
        switch (payload?.type) {
          case ConditionType.JEXL:
            const res = await jexl.eval(payload?.expression, {
              variables: params.instance.variables,
            });
            if (Boolean(res)) {
              const updated = await this.updateWorkflowInstance({
                instanceId: params.instance.id || "",
                variables: params.instance.variables || ({} as any),
                nodeKey: transition.toNode,
                status: WorkflowInstanceStatus.completed,
              });
              const node = defSnapshot.nodes.find(
                (n: any) => n.key === transition.toNode
              );
              if (node) {
                switch (node.type) {
                  case NodeType.SERVICE:
                    await this.executeService({
                      instance: updated,
                      node,
                    });
                    return;
                  case NodeType.TASK:
                    await this.createTask({
                      instance: updated,
                      node: node,
                    });
                }
              }
            }
        }
      }
    }
  }
}

export type StartWorkflowParams = {
  key: string;
  context: Record<string, any>;
  payloadId: string;
  createdBy: string;
  refId: string;
};

export type StartWorkflowResponse = Promise<WorkflowInstance>;

export type DispatchWorkflowParams = {
  instance: WorkflowInstance;
};
export type DispatchWorkflowResponse = Promise<void>;

export type UpdateWorkflowInstanceParams = {
  instanceId: string;
  variables: Record<string, any>;
  nodeKey: string;
  status: WorkflowInstanceStatus;
};
export type UpdateWorkflowInstanceResponse = Promise<WorkflowInstance>;

export type CreateTaskParams = {
  instance: WorkflowInstance;
  node: any;
};

export type ExecuteServiceParams = {
  instance: WorkflowInstance;
  node: any;
};

export type ExecuteServiceResponse = Promise<void>;

export type MakeDecisionParams = {
  instance: WorkflowInstance;
  node: any;
};
