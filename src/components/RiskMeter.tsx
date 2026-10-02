import { useCountUp } from "../hooks/useCountUp";
import type { RiskLevel } from "../lib/scamDetector";

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  extreme: boolean;
}

const RADIUS = 78;
const VIEWBOX = 200;
const CIRCUMFERENCE = Math.PI * RADIUS; // length of the half-circle arc: ~245

function getColor(level: RiskLevel, extreme: boolean): string {
  if (extreme) return "var(--danger)";
  if (level === "high") return "var(--danger)";
  if (level === "medium") return "var(--warn)";
  return "var(--ok)";
}

function getVerdict(level: RiskLevel, extreme: boolean): string {
  if (extreme) return "Almost certainly a scam";
  if (level === "high") return "High scam risk";
  if (level === "medium") return "Medium risk";
  return "Low risk";
}

export default function RiskMeter({ score, level, extreme }: RiskMeterProps) {
  const displayScore = useCountUp(score, 900);
  const color = getColor(level, extreme);
  const offset = CIRCUMFERENCE - (displayScore / 100) * CIRCUMFERENCE;

  return (
    <figure
      className="mx-auto max-w-[200px]"
      role="img"
      aria-label={`Risk score: ${score} percent — ${getVerdict(level, extreme)}`}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX / 2 + 16}`} className="w-full">
        {/* Track arc (lighter background) */}
        <path
          d={`M 20 ${VIEWBOX / 2 + 4} A ${RADIUS} ${RADIUS} 0 0 1 ${VIEWBOX - 20} ${VIEWBOX / 2 + 4}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={12}
          strokeLinecap="round"
          className="text-border-custom opacity-30"
        />

        {/* Coloured arc (animated via transition on stroke-dashoffset) */}
        <path
          d={`M 20 ${VIEWBOX / 2 + 4} A ${RADIUS} ${RADIUS} 0 0 1 ${VIEWBOX - 20} ${VIEWBOX / 2 + 4}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="meter-arc"
          style={{ color }}
        />

        {/* Score label in centre */}
        <text
          x={VIEWBOX / 2}
          y={VIEWBOX / 2 - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="score-number"
          fill={color}
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "44px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color,
          }}
        >
          {displayScore}
        </text>

        {/* Percent sign */}
        <text
          x={VIEWBOX / 2}
          y={VIEWBOX / 2 + 22}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          className="text-muted"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          % risk
        </text>
      </svg>

      <figcaption className="mt-1 text-center text-sm font-semibold" style={{ color }}>
        {getVerdict(level, extreme)}
        {extreme && (
          <span className="ml-2 inline-flex items-center rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">
            EXTREME
          </span>
        )}
      </figcaption>
    </figure>
  );
}