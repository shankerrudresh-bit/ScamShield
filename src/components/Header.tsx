import { Moon, ShieldCheck, Sun } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border-custom">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-base font-bold tracking-tight">ScamShield</p>
            <p className="text-xs text-muted">SMS &amp; WhatsApp scam inspector</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border-custom bg-card text-foreground transition-all duration-200 ease-out hover:border-primary/40 hover:text-primary active:scale-95"
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" className="h-[18px] w-[18px]" />
          ) : (
            <Moon aria-hidden="true" className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </header>
  );
}