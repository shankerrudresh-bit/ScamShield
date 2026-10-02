import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Link2,
  Megaphone,
  Wallet,
} from "lucide-react";
import { CATEGORY_ORDER, type AnalysisResult, type Category } from "../lib/scamDetector";

const CATEGORY_ICONS: Record<Category, typeof Megaphone> = {
  urgency: Megaphone,
  links: Link2,
  financial: Wallet,
  greeting: Megaphone,
};

export default function BreakdownCard({ result }: { result: AnalysisResult }) {
  const totalFlags = result.flags.length;

  if (totalFlags === 0) {
    return (
      <section className="rounded-2xl border border-ok/40 bg-ok-soft p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              No obvious scam signals detected
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              This message didn&apos;t trigger any of our checks — no urgency phrases,
              suspicious links, money hooks, or mass-email greetings. That&rsquo;s a good
              sign. Remember: this is a heuristic check, not a guarantee. When in doubt,
              contact the official organization directly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border-custom bg-card p-5 shadow-glow sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
          <AlertTriangle aria-hidden="true" className="h-4 w-4 text-warn" />
          Why this message is risky
        </h3>
        <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
          {totalFlags} signal{totalFlags === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="grid gap-2">
        {CATEGORY_ORDER.map((cat) => {
          const breakdown = result.breakdown.find((b) => b.category === cat)!;
          const Icon = CATEGORY_ICONS[cat];
          const matches = breakdown.matches;
          const active = matches.length > 0;
          const pct = Math.round((breakdown.points / breakdown.maxPoints) * 100);

          return (
            <li key={cat} className="rounded-xl border border-border-custom bg-elevated">
              <details className="group" {...(active ? { open: matches.length > 1 } : {})}>
                <summary
                  className={`flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                    active ? "hover:bg-card" : "opacity-60"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      active ? "bg-danger-soft text-danger" : "bg-muted/10 text-muted"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className={`block text-sm font-semibold ${active ? "text-foreground" : "text-muted"}`}>
                      {breakdown.title}
                      {active && (
                        <span className="ml-2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger">
                          {matches.length} hit{matches.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-muted">{breakdown.description}</span>
                  </span>
                  <span className="text-right">
                    <span className={`block text-sm font-bold ${active ? "text-danger" : "text-muted"}`}>
                      +{breakdown.points}
                    </span>
                    <span className="block text-[11px] text-muted">{pct}% of max</span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 text-muted transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>

                {active && (
                  <ul className="space-y-1.5 px-4 pb-4">
                    {matches.map((m, i) => (
                      <li
                        key={`${m.phrase}-${i}`}
                        className="flex items-start gap-2 rounded-lg bg-card px-3 py-2 text-xs"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                        <span className="flex-1">
                          <span className="font-semibold text-foreground">{m.label}</span>
                          <span className="mt-0.5 block break-words text-muted">
                            &ldquo;{m.example}&rdquo;
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-start gap-1.5 text-xs text-muted">
        <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Scores are directional, not proof. A low score never means &ldquo;definitely
        safe&rdquo; — always think before clicking.
      </p>
    </section>
  );
}