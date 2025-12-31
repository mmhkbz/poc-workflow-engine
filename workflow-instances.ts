export const NodeType = {
  START: "start",
  END: "end",
  TASK: "task",
  SERVICE: "service",
  DECISION: "decision",
  PARALLEL_GATEWAY: "parallel_gateway",
  PARALLEL_JOIN: "parallel_join",
  TIMER: "timer",
} as const;

export const TimerType = {
  DURATION: "duration",
  FIXED_DATE: "fixed_date",
  CRON: "cron",
  EXTERNAL_EVENT: "external_event",
} as const;

export const JoinType = {
  ALL: "all",
  ANY: "any",
  MAJORITY: "majority",
  N_OF_M: "n_of_m",
} as const;

export const AssignmentType = {
  ROLE: "role",
  USER: "user",
  DYNAMIC: "dynamic",
} as const;

export const ServiceType = {
  HTTP: "http",
  WEBHOOK: "webhook",
  DATABASE: "database",
  MESSAGE_QUEUE: "message_queue",
} as const;

export const ConditionType = {
  JEXL: "jexl",
  JAVASCRIPT: "javascript",
} as const;

export const EscalationActionType = {
  NOTIFICATION: "notification",
  TASK_REASSIGN: "task_reassign",
  WEBHOOK: "webhook",
  EMAIL: "email",
  SMS: "sms",
  SLACK: "slack",
} as const;
