export const DEFAULT_USER = "default-user";
export const DEFAULT_WORKFLOW = "csv_upload";

export enum Roles {
  MANAGER = "manager",
  SENIOR_MANAGER = "senior_manager",
}

export const HeaderKeys = {
  USER_ID: "x-user-id",
  ROLE_ID: "x-role-id",
};

export type TNodeType = "start" | "task" | "decision" | "end";

export enum NodeType {
  START = "start",
  TASK = "task",
  SERVICE = "service",
  DECISION = "decision",
  END = "end",
}

export enum NodeConfigType {
  ASSIGNMENT = "assignment",
  SERVICE = "service",
}

export enum ConditionType {
  JEXL = "jexl",
  JS = "js",
}

export type TNodeConfigType = "assignment" | "service";

export enum AssignmentType {
  ROLE = "role",
  USER = "user",
  EXPRESSION = "expression",
  GROUP = "group",
}

export enum ServiceType {
  HTTP = "http",
}
