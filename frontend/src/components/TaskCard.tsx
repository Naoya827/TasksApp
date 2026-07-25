import { Draggable } from "@hello-pangea/dnd";
import { Calendar, Trash2, User } from "lucide-react";
import type { Task, User as AppUser } from "@/types";
import {
  cn,
  formatDate,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

interface TaskCardProps {
  task: Task;
  index: number;
  users: AppUser[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({
  task,
  index,
  users,
  onUpdate,
  onDelete,
}: TaskCardProps) {
  const handleAssigneeChange = async (assigneeId: string) => {
    try {
      const updated = await api.updateTask(task.id, {
        assignee_id: assigneeId || null,
        status: assigneeId ? "ASSIGNED" : "INBOX",
      });
      onUpdate(updated);
    } catch {
      // silently fail - parent can show toast in future
    }
  };

  const handleDelete = async () => {
    if (!confirm("このタスクを削除しますか？")) return;
    try {
      await api.deleteTask(task.id);
      onDelete(task.id);
    } catch {
      // silently fail
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "rounded-lg border bg-card p-3 shadow-sm transition-shadow",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/30"
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {task.description && (
            <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge
              className={cn("text-xs", PRIORITY_COLORS[task.priority])}
              variant="outline"
            >
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {task.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {(task.status === "ASSIGNED" || task.status === "INBOX") && (
            <div className="flex items-center gap-1.5 border-t border-border pt-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <Select
                className="h-7 text-xs"
                value={task.assigneeId || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                <option value="">未割り当て</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {task.assignee && task.status !== "INBOX" && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {task.assignee.name}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
