import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/types";
import {
  formatDate,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "@/lib/utils";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ArchivePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: "ARCHIVED" };
      if (search) params.search = search;
      if (tag) params.tag = tag;
      const data = await api.getTasks(params);
      let filtered = data;
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter((t) => new Date(t.updatedAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((t) => new Date(t.updatedAt) <= to);
      }
      setTasks(filtered);
    } finally {
      setLoading(false);
    }
  }, [search, tag, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const allTags = [...new Set(tasks.flatMap((t) => t.tags))];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              ボードに戻る
            </Button>
          </Link>
          <h2 className="text-lg font-semibold">アーカイブボックス</h2>
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search">フリーワード検索</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="タイトル・詳細"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tag">タグ</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="買い物"
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {allTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="dateFrom">更新日（から）</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">更新日（まで）</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center text-muted-foreground">読み込み中...</p>
        ) : tasks.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            アーカイブされたタスクはありません
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          className={PRIORITY_COLORS[task.priority]}
                          variant="outline"
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </Badge>
                        {task.assignee && (
                          <Badge variant="secondary">{task.assignee.name}</Badge>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            期限: {formatDate(task.dueDate)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          更新: {formatDate(task.updatedAt)}
                        </span>
                      </div>
                      {task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
