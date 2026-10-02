import { AlertCircle, Scan } from "lucide-react";
import { useRef, useState } from "react";

interface InputCardProps {
  message: string;
  onChange: (text: string) => void;
  onAnalyze: (text: string) => void;
  onLoadSample: (text: string) => void;
  scamExample: string;
  safeExample: string;
  disabled: boolean;
}

export default function InputCard({
  message,
  onChange,
  onAnalyze,
  onLoadSample,
  scamExample,
  safeExample,
  disabled,
}: InputCardProps) {
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const text = message.trim();
    if (!text) {
      setError("Nothing to analyse — paste a message first.");
      textareaRef.current?.focus();
      return;
    }
    if (text.length < 3) {
      setError("Message is too short (at least 3 characters needed).");
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    onAnalyze(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSample = (sample: string) => {
    setError(null);
    onChange(sample);
    textareaRef.current?.focus();
  };

  return (
    <section className="w-full max-w-3xl">
      <div className="rounded-2xl border border-border-custom bg-card p-5 shadow-glow sm:p-6">
        <label htmlFor="sms-input" className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Scan aria-hidden="true" className="h-4 w-4 text-primary" />
          Paste a suspicious message
        </label>

        <textarea
          ref={textareaRef}
          id="sms-input"
          rows={5}
          value={message}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste an SMS or WhatsApp message here…"
          className="w-full resize-y rounded-xl border border-border-custom bg-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-border duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
          disabled={disabled}
          aria-describedby={error ? "input-error" : undefined}
          aria-invalid={!!error}
        />

        {error && (
          <p id="input-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all duration-150 ease-out hover:bg-primary-strong active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Scan aria-hidden="true" className="h-4 w-4" />
            Analyse Message
            <kbd className="ml-1 hidden rounded-md bg-black/20 px-1.5 py-0.5 text-[11px] font-mono opacity-70 sm:inline-block">
              ⌘⏎
            </kbd>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-custom pt-4">
          <span className="text-xs text-muted">Try a sample:</span>
          <button
            type="button"
            onClick={() => handleSample(scamExample)}
            className="cursor-pointer rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition-all duration-150 hover:bg-danger-soft active:scale-95"
          >
            ⚠ Scam example
          </button>
          <button
            type="button"
            onClick={() => handleSample(safeExample)}
            className="cursor-pointer rounded-lg border border-ok/30 px-3 py-1.5 text-xs font-medium text-ok transition-all duration-150 hover:bg-ok-soft active:scale-95"
          >
            ✓ Safe example
          </button>
        </div>
      </div>
    </section>
  );
}