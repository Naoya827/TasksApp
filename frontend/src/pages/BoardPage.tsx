import { useState, useEffect, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import type { Task, TaskStatus, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { TaskForm } from "@/components/TaskForm";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Button } from "@/components/ui/button";

const COLUMNS: TaskStatus[] = ["INBOX", "ASSIGNED", "DONE", "ARCHIVED"];

export function BoardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        api.getTasks(),
        api.getUsers(),
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visibleColumns = showArchived
    ? COLUMNS
    : COLUMNS.filter((s) => s !== "ARCHIVED");

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const updateData: Parameters<typeof api.updateTask>[1] = {
      status: newStatus,
    };

    if (newStatus === "ASSIGNED" && !task.assigneeId && user) {
      updateData.assignee_id = user.id;
    }
    if (newStatus === "INBOX") {
      updateData.assignee_id = null;
    }

    const prevTasks = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? {
              ...t,
              status: newStatus,
              assigneeId:
                newStatus === "INBOX"
                  ? null
                  : newStatus === "ASSIGNED" && !t.assigneeId
                    ? user?.id || null
                    : t.assigneeId,
              assignee:
                newStatus === "INBOX"
                  ? null
                  : newStatus === "ASSIGNED" && !t.assignee
                    ? user
                      ? { id: user.id, name: user.name }
                      : null
                    : t.assignee,
            }
          : t
      )
    );

    try {
      const updated = await api.updateTask(draggableId, updateData);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setTasks(prevTasks);
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskUpdate = (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  };

  const handleTaskDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1600px] space-y-4 p-4">
        <TaskForm onCreated={handleTaskCreated} />

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <EyeOff className="h-4 w-4" />
                履歴を非表示
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                履歴を表示
              </>
            )}
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))`,
            }}
          >
            {visibleColumns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={getTasksByStatus(status)}
                users={users}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
              />
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
