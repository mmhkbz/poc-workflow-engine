-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'assigned', 'completed', 'failed', 'escalated');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "SlaStatus" AS ENUM ('active', 'breached', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "TimerStatus" AS ENUM ('active', 'triggered', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('notification', 'sla', 'timer', 'workflow');

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'running',
    "variables" JSONB NOT NULL,
    "defSnapshot" JSONB NOT NULL,
    "currentNode" TEXT,
    "refId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "assignedUserId" TEXT,
    "assignedRoleId" TEXT,
    "inputs" JSONB NOT NULL,
    "outputs" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escalatedFromTaskId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parallel_branch_instances" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "branchKey" TEXT NOT NULL,
    "status" "BranchStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parallel_branch_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_instances" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "slaKey" TEXT NOT NULL,
    "status" "SlaStatus" NOT NULL,
    "breachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timer_instances" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "timerKey" TEXT NOT NULL,
    "status" "TimerStatus" NOT NULL,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timer_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL,
    "type" "JobType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_instances_workflowId_idx" ON "workflow_instances"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_escalatedFromTaskId_key" ON "tasks"("escalatedFromTaskId");

-- CreateIndex
CREATE INDEX "tasks_instanceId_idx" ON "tasks"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_jobId_key" ON "jobs"("jobId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_escalatedFromTaskId_fkey" FOREIGN KEY ("escalatedFromTaskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parallel_branch_instances" ADD CONSTRAINT "parallel_branch_instances_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_instances" ADD CONSTRAINT "sla_instances_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timer_instances" ADD CONSTRAINT "timer_instances_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
