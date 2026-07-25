import { Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus, User } from "@/types";
import { cn, COLUMN_COLORS, STATUS_LABELS } from "@/lib/utils";
import { TaskCard } from "@/components/TaskCard";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  users: User[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function KanbanColumn({
  status,
  tasks,
  users,
  onUpdate,
  onDelete,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col rounded-xl border-2",
        COLUMN_COLORS[status]
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h2 className="font-semibold">{STATUS_LABELS[status]}</h2>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-1 flex-col gap-2 p-3 transition-colors",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                users={users}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                タスクなし
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
