import { cn } from "@/lib/utils";

type UsernameLineProps = {
  username: string;
  className?: string;
};

export function UsernameLine({ username, className }: UsernameLineProps) {
  return (
    <span className={cn("min-w-0 truncate text-xs text-muted-foreground", className)}>
      @{username}
    </span>
  );
}
