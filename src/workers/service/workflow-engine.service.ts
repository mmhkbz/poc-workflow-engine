import { Context } from "hono";
import { Env } from "../../types/types";
import { PrismaClient, WorkflowInstance } from "../../generated/prisma/client";
import { httpServiceQueue, slaQueue, timerQueue } from "../../libs/queue";
import { evalTemplate } from "../../utils/expr.util";
import jexl from "jexl";
import { QueueName } from "../../configs/consts";
import ms from "ms";
import { SlaService } from "./sla.service";
import { createWorkflowMasterApiClient } from "../../libs/axios";
import { WorkflowMasterService } from "./workflow-master.service";

export class WorkflowEngineService {
  private readonly slaService: SlaService;
  private readonly workflowMasterService: WorkflowMasterService;

  constructor(private readonly prisma: PrismaClient) {
    const apiClient = createWorkflowMasterApiClient(
      process.env.WORKFLOW_MASTER_API_URL || ""
    );
    this.slaService = new SlaService(apiClient);
    this.workflowMasterService = new WorkflowMasterService(apiClient);
  }

  async startWorkflow(params: {
    key: string;
    context: any;
    createdBy: string;
    refId: string;
  }): Promise<WorkflowInstance> {
    const prisma = this.prisma;
    const workflowMasterService = this.workflowMasterService;

    const workflowDefinition = await workflowMasterService.getWorkflowByKey(
      params.key
    );
    if (!workflowDefinition) {
      throw new Error("Workflow definition not found");
    }

    const startNode = workflowDefinition.nodes.find(
      (node: any) => node.type === "start"
    );
    if (!startNode) {
      throw new Error("Start node not found");
    }

    const workflowInstance = await prisma.workflowInstance.create({
      data: {
        workflowId: workflowDefinition.key,
        currentNode: startNode.key,
        variables: { ...params.context, refId: params.refId },
        status: "running",
        defSnapshot: workflowDefinition,
        createdBy: params.createdBy,
        refId: params.refId,
      },
    });

    await this.handleNode(
      workflowInstance.id,
      startNode.key,
      workflowDefinition
    );

    return workflowInstance;
  }

  async handleNode(
    instanceId: string,
    nodeKey: string,
    workflowDefinition: any
  ) {
    const prisma = this.prisma;
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { currentNode: nodeKey },
    });

    const node = workflowDefinition.nodes.find((n: any) => n.key === nodeKey);
    console.log("node ", node);
    if (!node) {
      throw new Error(`Node with key ${nodeKey} not found`);
    }

    switch (node.type) {
      case "start":
        const nextNode = this.findNextNode(nodeKey, workflowDefinition);
        if (nextNode) {
          await this.handleNode(instanceId, nextNode.key, workflowDefinition);
        }
        break;
      case "parallel_gateway":
        await this.handleParallelGateway(instanceId, node, workflowDefinition);
        break;
      case "task":
        await this.handleTaskNode(instanceId, node, workflowDefinition);
        break;
      case "service":
        await this.handleServiceNode(instanceId, node, workflowDefinition);
        break;
      case "decision":
        await this.handleDecisionNode(instanceId, node, workflowDefinition);
        break;
      case "parallel_join":
        await this.handleParallelJoin(instanceId, node, workflowDefinition);
        break;
      case "end":
        await this.handleEndNode(instanceId);
        break;
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  async handleParallelGateway(
    instanceId: string,
    node: any,
    workflowDefinition: any
  ) {
    const prisma = this.prisma;
    const branches = node.branches || [];

    for (const branch of branches) {
      const branchInstance = await prisma.parallelBranchInstance.create({
        data: {
          workflowInstanceId: instanceId,
          branchKey: branch.key,
          status: "running",
        },
      });

      const firstNodeInBranch = workflowDefinition.nodes.find(
        (n: any) => n.key === branch.nodes[0]
      );
      if (firstNodeInBranch) {
        await this.handleNode(
          instanceId,
          firstNodeInBranch.key,
          workflowDefinition
        );
      }
    }
  }

  async handleTaskNode(instanceId: string, node: any, workflowDefinition: any) {
    const prisma = this.prisma;
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) return;
    const task = await prisma.task.create({
      data: {
        instanceId: instanceId,
        nodeKey: node.key,
        status: "pending",
        assignedUserId: node.config?.payload?.users?.join(","),
        assignedRoleId: node.config?.payload?.roles?.join(","),
        inputs: {},
        workflowId: instance.workflowId,
        createdBy: instance.createdBy,
        // slas: node.config.slas, // schema does not have slas on task
        // timers: node.config.timers, // schema does not have timers on task
      },
    });

    if (node.config.slas) {
      for (const slaKey of node.config.slas) {
        const slaDef = await this.slaService.getSlaByKey(slaKey);
        if (slaDef) {
          for (const fact of slaDef.facts) {
            console.log("fact ", fact);
            const slaInstance = await prisma.slaInstance.create({
              data: {
                taskId: task.id,
                slaKey: slaKey,
                status: "active",
              },
            });
            await slaQueue.add(
              QueueName.SLA_QUEUE,
              { slaInstanceId: slaInstance.id, level: fact.level },
              { delay: Number(ms(fact.targetDuration)) }
            );
          }
        }
      }
    }

    if (node.config.timers) {
      for (const timer of node.config.timers) {
        await timerQueue.add("timer", { taskId: task.id, timer: timer });
      }
    }
  }

  async handleServiceNode(
    instanceId: string,
    node: any,
    workflowDefinition: any
  ) {
    const prisma = this.prisma;
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });
    const { payload } = node.config;
    if (payload.type === "http") {
      console.log("payload ", payload);
      await httpServiceQueue.add(
        QueueName.HTTP_SERVICE_QUEUE,
        payload
          ? await evalTemplate(payload, {
              context: { variables: instance?.variables },
            })
          : {}
      );
    }

    const nextNode = this.findNextNode(node.key, workflowDefinition);
    if (nextNode) {
      await this.handleNode(instanceId, nextNode.key, workflowDefinition);
    }
  }

  async handleDecisionNode(
    instanceId: string,
    node: any,
    workflowDefinition: any
  ) {
    const prisma = this.prisma;
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) return;

    const transitions = workflowDefinition.transitions.filter(
      (t: any) => t.fromNode === node.key
    );
    console.log(JSON.stringify(workflowDefinition, null, 2));
    for (const transition of transitions) {
      const condition = transition?.config?.payload;
      console.log("Evaluating condition:", condition);
      if (condition) {
        const context = { context: { variables: instance.variables } };
        const expression = await evalTemplate(condition.expression, context);
        const result = await jexl.eval(expression, context);
        console.log("result", result);
        if (result) {
          await this.handleNode(
            instanceId,
            transition.toNode,
            workflowDefinition
          );
          return;
        }
      }
    }
  }

  async handleParallelJoin(
    instanceId: string,
    node: any,
    workflowDefinition: any
  ) {
    const prisma = this.prisma;
    const { dependencies, condition } = node.config;

    const finishedBranches = await prisma.parallelBranchInstance.findMany({
      where: {
        workflowInstanceId: instanceId,
        branchKey: { in: dependencies },
        status: "completed",
      },
    });

    if (finishedBranches.length === dependencies.length) {
      const instance = await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
      });
      if (!instance) return;

      const context = { context: { variables: instance.variables } };
      if (condition) {
        const expression = await evalTemplate(condition.expression, context);
        const result = await jexl.eval(expression, context);
        if (!result) {
          // Handle failed join condition
          return;
        }
      }

      const nextNode = this.findNextNode(node.key, workflowDefinition);
      if (nextNode) {
        await this.handleNode(instanceId, nextNode.key, workflowDefinition);
      }
    }
  }

  async handleEndNode(instanceId: string) {
    const prisma = this.prisma;
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: "completed" },
    });
  }

  findNextNode(currentNodeKey: string, workflowDefinition: any) {
    const transition = workflowDefinition.transitions.find(
      (t: any) => t.fromNode === currentNodeKey
    );
    if (transition) {
      return workflowDefinition.nodes.find(
        (n: any) => n.key === transition.toNode
      );
    }
    return null;
  }

  async completeTask(taskId: string, data: any) {
    const prisma = this.prisma;
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: "completed", outputs: data },
    });

    const workflowDefinition =
      await this.workflowMasterService.getWorkflowByKey(task.workflowId);
    if (!workflowDefinition) return;

    const node = workflowDefinition.nodes.find(
      (n: any) => n.key === task.nodeKey
    );
    if (node.type === "task") {
      const nextNode = this.findNextNode(task.nodeKey, workflowDefinition);
      if (nextNode) {
        console.log("next node", nextNode);
        console.log("Handling next node after task completion:", nextNode.key);
        if (nextNode.type === "decision") {
          const instance = await prisma.workflowInstance.findUnique({
            where: { id: task.instanceId },
          });
          if (instance) {
            const newVariables = {
              ...(instance.variables as any),
              outputs: {
                ...((instance.variables as any)?.outputs || {}),
                [task.nodeKey]: data,
              },
            };
            await prisma.workflowInstance.update({
              where: { id: task.instanceId },
              data: { variables: newVariables, currentNode: nextNode.key },
            });
          }
        }
        await this.handleNode(
          task.instanceId,
          nextNode.key,
          workflowDefinition
        );
      }
    }
  }
}
