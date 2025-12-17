import { Hono } from "hono";
import { Env } from "../types/types";
import { dataResponse, errorResponse } from "../utils/response.util";

export const taskRoute = new Hono<Env>();

taskRoute.get("/", async (c) => {
  const roleId = c.req.header("x-role-id") || "unknown";
  const userId = c.req.header("x-user-id") || "unknown";

  const prisma = c.get("prisma");

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assignedRoleId: { in: [roleId] } },
        { assignedUserId: { in: [userId] } },
      ],
      status: "pending",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json(dataResponse(tasks, 200, "Tasks fetched successfully"));
});

taskRoute.post("/:taskId/complete", async (c) => {
  const taskId = c.req.param("taskId");
  const { instanceId, isApproved = false, remark = "-" } = await c.req.json();

  const prisma = c.get("prisma");

  const promises = [
    prisma.task.findUnique({
      where: {
        id: taskId,
      },
    }),
    prisma.workflowInstance.findUnique({
      where: {
        id: instanceId,
      },
    }),
  ];
  const [task, instance] = await Promise.all(promises);

  if (!task || !instance) {
    return c.json(
      errorResponse("Task or instance not found", 404, "Not Found")
    );
  }

  await c.get("taskService").completeTask({
    taskId,
    instance,
    isApproved,
    remark,
  } as any);

  return c.json(
    dataResponse(
      { task, instanceId, isApproved, remark },
      200,
      "Task completed successfully"
    )
  );
});
