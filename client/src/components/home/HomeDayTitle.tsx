import type { ReactNode } from "react";

type HomeDayTitleProps = {
  children: ReactNode;
  right?: ReactNode;
};

export function HomeDayTitle({ children, right }: HomeDayTitleProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
      <h2 className="flex min-w-0 items-center gap-2 font-one-more text-sm font-semibold uppercase italic tracking-tight">
        {children}
      </h2>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
