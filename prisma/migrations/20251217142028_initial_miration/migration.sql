-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('started', 'in_progress', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'sla_breached', 'completed');

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "current_node" TEXT,
    "ref_id" TEXT NOT NULL,
    "def_snapshot" JSONB NOT NULL,
    "variables" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'started',

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "assigned_user_id" TEXT,
    "assigned_role_id" TEXT,
    "instance_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "inputs" JSONB,
    "outputs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_workflow_id_instance" ON "workflow_instances"("workflow_id");

-- CreateIndex
CREATE INDEX "idx_ref_id_workflow_id" ON "workflow_instances"("ref_id");

-- CreateIndex
CREATE INDEX "idx_assigned_user_id" ON "tasks"("assigned_user_id");

-- CreateIndex
CREATE INDEX "idx_assigned_role_id" ON "tasks"("assigned_role_id");

-- CreateIndex
CREATE INDEX "idx_instance_id" ON "tasks"("instance_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_workflow_id" ON "tasks"("workflow_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_created_at" ON "tasks"("created_at");
