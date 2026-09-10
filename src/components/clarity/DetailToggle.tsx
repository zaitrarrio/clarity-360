import { Switch } from "@/components/ui/switch";

/** Summary ⇄ Detailed slider used across the plan-building flows. */
export function DetailToggle({ detailed, onChange }: { detailed: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-3 py-1.5">
      <span
        className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${
          detailed ? "text-muted-foreground" : "text-ember-deep"
        }`}
      >
        Summary
      </span>
      <Switch checked={detailed} onCheckedChange={onChange} aria-label="Show detailed responses" />
      <span
        className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${
          detailed ? "text-ember-deep" : "text-muted-foreground"
        }`}
      >
        Detailed
      </span>
    </div>
  );
}
