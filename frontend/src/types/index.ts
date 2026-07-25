export type TaskStatus = "INBOX" | "ASSIGNED" | "DONE" | "ARCHIVED";
export type TaskPriority =
  | "EMERGENCY"
  | "HIGH"
  | "MIDDLE"
  | "LOW"
  | "SOMEDAY";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  tags?: string[];
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  assignee_id?: string | null;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  tags?: string[];
}
