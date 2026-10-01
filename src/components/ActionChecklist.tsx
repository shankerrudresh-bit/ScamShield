import { ClipboardCheck, ShieldX } from "lucide-react";
import type { AnalysisResult } from "../lib/scamDetector";

function buildChecklist(result: AnalysisResult): string[] {
  const items: string[] = [];

  if (result.level === "high") {
    items.push("Don\u2019t click any links, call any numbers, or reply to this message.");
    items.push("Block the sender and report it to your mobile operator or the platform.");
    items.push("Never share passwords, OTPs, or card/bank details — a real company never asks for these over SMS.");
    items.push("Verify through the official website or app — not through anything in this message.");
    items.push("Report to your regulator or cybercrime helpline if money was involved.");
    if (result.extreme) {
      items.push("This looks like an almost-certain scam. Treat it as fraud and delete it.");
    }
  } else if (result.level === "medium") {
    items.push("Don\u2019t click anything until you\u2019ve double-checked the sender.");
    items.push("Verify through the official website/app — never via links in the message.");
    items.push("Never share passwords or OTPs. A real company won\u2019t ask for them over SMS.");
    items.push("If you weren\u2019t expecting this message, treat it as suspicious and delete it.");
  } else {
    items.push("No urgent action needed — but stay alert to similar messages.");
    items.push("If anything ever feels off, verify through the official website or app.");
    items.push("When in doubt, don\u2019t click — trust your instincts and delete.");
  }

  return items;
}

export default function ActionChecklist({ result }: { result: AnalysisResult }) {
  const items = buildChecklist(result);
  const isHigh = result.level === "high";

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        isHigh
          ? "border-danger/40 bg-danger-soft/40"
          : "border-border-custom bg-card shadow-glow"
      }`}
    >
      <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-foreground">
        <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-primary" />
        What should I do?
      </h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
            <span
              aria-hidden="true"
              className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                isHigh ? "bg-danger text-white" : "bg-ok text-white"
              }`}
            >
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                <path
                  d="M2.5 6.5l2.2 2.2L9.5 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {item.replace(/\bscam scam\b/i, "scam")}
          </li>
        ))}
      </ul>
      {isHigh && (
        <p className="mt-4 flex items-start gap-1.5 border-t border-danger/20 pt-3 text-xs text-muted">
          <ShieldX aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          In most countries you can forward scam SMS to your operator&rsquo;s short number
          (e.g. 7726 in the UK) for free.
        </p>
      )}
    </section>
  );
}