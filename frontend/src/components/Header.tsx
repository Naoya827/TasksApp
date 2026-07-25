import { Link } from "react-router-dom";
import { Archive, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary">
            二人のインボックス
          </h1>
          {user && (
            <span className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
              {user.name}
            </span>
          )}
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/archive">
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4" />
              アーカイブ
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </nav>
      </div>
    </header>
  );
}
