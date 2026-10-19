import { AudioWaveform, FileOutput, Scissors, SlidersHorizontal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGES, type PageId } from "@/lib/options";

const icons: Record<PageId, React.ReactNode> = {
  quick: <Zap className="h-4 w-4" />,
  cuts: <Scissors className="h-4 w-4" />,
  detection: <AudioWaveform className="h-4 w-4" />,
  output: <FileOutput className="h-4 w-4" />,
  advanced: <SlidersHorizontal className="h-4 w-4" />,
};

interface SidebarProps {
  page: PageId;
  onChange: (page: PageId) => void;
  counts: Partial<Record<PageId, number>>; // how many options are set on each page
}

const Item: React.FC<{ id: PageId; active: boolean; count?: number; onClick: () => void }> = ({ id, active, count, onClick }) => {
  const idx = PAGES.findIndex((p) => p.id === id);
  const title = PAGES[idx].title;
  const mod = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘" : "Ctrl+";
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${title} (${mod}${idx + 1})`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 w-full items-center justify-center gap-3 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:justify-start",
        active && "bg-accent font-medium text-foreground"
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />}
      <span className="shrink-0">{icons[id]}</span>
      <span className="hidden flex-1 text-left lg:inline">{title}</span>
      {!!count && (
        <span className="hidden rounded-full bg-primary/15 px-1.5 text-xs tabular-nums text-primary lg:inline" aria-label={`${count} options set`}>
          {count}
        </span>
      )}
      {!!count && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary lg:hidden" />}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ page, onChange, counts }) => (
  <nav aria-label="Pages" className="flex w-14 shrink-0 flex-col gap-1 border-r bg-card p-2 lg:w-52">
    <Item id="quick" active={page === "quick"} onClick={() => onChange("quick")} />
    <div className="mx-1 my-2 border-t" />
    <p className="mb-1 hidden px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:block">More options</p>
    {PAGES.filter((p) => p.id !== "quick").map((p) => (
      <Item key={p.id} id={p.id} active={page === p.id} count={counts[p.id]} onClick={() => onChange(p.id)} />
    ))}
  </nav>
);

export default Sidebar;