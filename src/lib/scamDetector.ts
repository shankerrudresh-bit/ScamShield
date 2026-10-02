/**
 * ScamShield — heuristic scam detection engine.
 * 100% client-side: no network calls, no third-party services.
 *
 * Scoring model (per category, capped; total capped at 100):
 *   - Urgency    ~+40
 *   - Links      ~+35
 *   - Financial  ~+20
 *   - Greeting   ~+10
 *
 * Verdict buckets: <30 Low · 30–65 Medium · >65 High. >=90 flagged "extreme".
 */

export type Category = "urgency" | "links" | "financial" | "greeting";
export type RiskLevel = "low" | "medium" | "high";

export interface MatchedRule {
  category: Category;
  label: string; // short human reason, e.g. "Demands immediate action"
  phrase: string; // exact matched phrase / domain feature (displayed)
  example: string; // the phrase or URL as it appears in the message
  points: number; // points contributed (before category cap)
}

export interface CategoryBreakdown {
  category: Category;
  title: string;
  description: string;
  points: number;
  maxPoints: number;
  matches: MatchedRule[];
}

export interface AnalysisResult {
  message: string;
  score: number; // 0-100
  level: RiskLevel;
  verdict: string; // "Low Risk" | "Medium Risk" | "High Scam Risk"
  extreme: boolean; // score >= 90
  flags: MatchedRule[];
  breakdown: CategoryBreakdown[];
  charCount: number;
}

export const CATEGORY_ORDER: Category[] = ["urgency", "links", "financial", "greeting"];

/* ---------- category metadata ---------- */

const CATEGORY_TITLES: Record<Category, string> = {
  urgency: "Urgency pressure",
  links: "Suspicious links",
  financial: "Money & reward hooks",
  greeting: "Generic greeting",
};

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  urgency: "Tries to rush you into acting before you can think.",
  links: "Shortened, insecure, or unusual-domain links.",
  financial: "Prizes, refunds, or requests for money and financial info.",
  greeting: "A mass-mailed opener used to reach as many people as possible.",
};

const CATEGORY_MAX: Record<Category, number> = {
  urgency: 40,
  links: 35,
  financial: 20,
  greeting: 10,
};

/* ---------- phrase lists (easy to tune) ---------- */

const URGENCY_RULES: Array<{ phrase: string; label: string; points: number }> = [
  { phrase: "immediately", label: "Demands immediate action", points: 7 },
  { phrase: "within 24 hours", label: "Tight deadline pressure", points: 7 },
  { phrase: "within 12 hours", label: "Tight deadline pressure", points: 7 },
  { phrase: "within 48 hours", label: "Deadline pressure", points: 6 },
  { phrase: "urgent", label: "Urgency pressure", points: 6 },
  { phrase: "act now", label: "Urgency pressure", points: 6 },
  { phrase: "act immediately", label: "Urgency pressure", points: 7 },
  { phrase: "account blocked", label: "Claims your account is blocked", points: 8 },
  { phrase: "account suspended", label: "Threatens account suspension", points: 8 },
  { phrase: "will be suspended", label: "Threatens suspension", points: 7 },
  { phrase: "suspended", label: "Threatens suspension", points: 6 },
  { phrase: "action required", label: "Demands action", points: 6 },
  { phrase: "verify now", label: "Demands verification", points: 6 },
  { phrase: "expire today", label: "Fake expiry deadline", points: 6 },
  { phrase: "expires today", label: "Fake expiry deadline", points: 6 },
  { phrase: "final notice", label: "Fake final warning", points: 7 },
  { phrase: "last warning", label: "Fake final warning", points: 7 },
  { phrase: "or your account", label: "Threatening consequence", points: 6 },
  { phrase: "will be closed", label: "Threatening consequence", points: 6 },
  { phrase: "in 24 hours", label: "Tight time window", points: 6 },
];

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",
  "is.gd",
  "ow.ly",
  "cutt.ly",
  "tiny.cc",
  "rb.gy",
  "s.id",
  "shorturl.at",
  "buff.ly",
];

// Unofficial / often-abused TLDs (incl. new gTLDs popular with phishers).
const SUSPICIOUS_TLDS = new Set([
  "xyz",
  "top",
  "app",
  "club",
  "online",
  "site",
  "live",
  "icu",
  "tk",
  "ml",
  "cf",
  "ga",
  "gq",
  "buzz",
  "info",
  "link",
  "click",
  "work",
  "best",
  "rest",
  "cam",
  "zip",
  "mov",
  "country",
  "stream",
  "accountant",
  "loan",
  "men",
  "mom",
  "pw",
]);

const FINANCIAL_RULES: Array<{ phrase: string; points: number }> = [
  { phrase: "lottery", points: 6 },
  { phrase: "you have won", points: 6 },
  { phrase: "congratulations", points: 3 },
  { phrase: "refund", points: 4 },
  { phrase: "electricity bill", points: 3 },
  { phrase: "payment pending", points: 4 },
  { phrase: "pending payment", points: 4 },
  { phrase: "reward points", points: 4 },
  { phrase: "gift card", points: 4 },
  { phrase: "prize", points: 4 },
  { phrase: "cashback", points: 4 },
  { phrase: "claim your", points: 4 },
  { phrase: "claim now", points: 4 },
  { phrase: "bank details", points: 5 },
  { phrase: "card details", points: 5 },
  { phrase: "otp", points: 5 },
  { phrase: "one-time password", points: 5 },
  { phrase: "upfront fee", points: 5 },
  { phrase: "processing fee", points: 5 },
  { phrase: "pay now", points: 3 },
  { phrase: "send money", points: 4 },
  { phrase: "crypto", points: 3 },
  { phrase: "bitcoin", points: 3 },
  { phrase: "double your money", points: 5 },
  { phrase: "verify your payment details", points: 5 },
];

const GREETING_RULES: Array<{ phrase: string; points: number }> = [
  { phrase: "dear customer", points: 4 },
  { phrase: "valued user", points: 4 },
  { phrase: "dear user", points: 4 },
  { phrase: "dear client", points: 4 },
  { phrase: "hello dear", points: 4 },
  { phrase: "dear sir", points: 4 },
  { phrase: "dear madam", points: 4 },
  { phrase: "greetings of the day", points: 4 },
  { phrase: "dear beneficiary", points: 4 },
  { phrase: "dear account holder", points: 4 },
];

/* ---------- helpers ---------- */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find keyword phrases (word-boundary, case-insensitive). */
function matchPhrases(
  text: string,
  rules: Array<{ phrase: string; points: number; label?: string }>,
  category: Category,
): MatchedRule[] {
  const flags: MatchedRule[] = [];
  const seen = new Set<string>();
  for (const rule of rules) {
    if (seen.has(rule.phrase)) continue;
    try {
      const re = new RegExp(`\\b${escapeRegExp(rule.phrase)}\\b`, "i");
      if (re.test(text)) {
        flags.push({
          category,
          label: rule.label ?? rule.phrase,
          phrase: rule.phrase,
          example: rule.phrase,
          points: rule.points,
        });
        seen.add(rule.phrase);
      }
    } catch {
      /* skip malformed rule */
    }
  }
  return flags;
}

const URL_REGEX = /https?:\/\/[^\s<>"')}\]|]+/gi;

/** Inspect URLs in the text; returns matched link rules. Never throws. */
function inspectLinks(text: string): MatchedRule[] {
  const matches: MatchedRule[] = [];
  const seen = new Set<string>();
  const urls = text.match(URL_REGEX) ?? [];

  for (const raw of urls) {
    const url = raw.replace(/[.,;:!?"')\]}>]+$/, "");
    let host = "";
    let protocol = "";
    try {
      const parsed = new URL(url);
      host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      protocol = parsed.protocol;
    } catch {
      host = "";
    }
    if (!host) continue;

    // 1. insecure http:// link
    if (protocol === "http:" && !seen.has("insecure")) {
      matches.push({
        category: "links",
        label: "Insecure link (http:// — not encrypted)",
        phrase: "http://…",
        example: url,
        points: 12,
      });
      seen.add("http:");
    }

    // 2. raw IP address
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && !seen.has("ip")) {
      matches.push({
        category: "links",
        label: "Link points to a raw IP address",
        phrase: host,
        example: url,
        points: 13,
      });
      seen.add("ip");
    }

    // 3. URL shortener
    const shortener = SHORTENERS.find((d) => host === d || host.endsWith(`.${d}`));
    if (shortener && !seen.has("shortener")) {
      matches.push({
        category: "links",
        label: `URL shortener (${shortener}) — hides the real destination`,
        phrase: shortener,
        example: url,
        points: 14,
      });
      seen.add("shortener");
    }

    // 4. suspicious TLD
    const tld = host.includes(".") ? (host.split(".").pop() ?? "") : "";
    if (tld && SUSPICIOUS_TLDS.has(tld) && !seen.has(`tld:${tld}`)) {
      matches.push({
        category: "links",
        label: `Unusual top-level domain (.${tld}) — often used for scam sites`,
        phrase: `.${tld}`,
        example: url,
        points: 13,
      });
      seen.add(`tld:${tld}`);
    }
  }

  return matches;
}

/* ---------- main entry ---------- */

export function analyzeMessage(message: string): AnalysisResult {
  const text = message.trim();

  const urgencyFlags = matchPhrases(text, URGENCY_RULES, "urgency");
  const linkFlags = inspectLinks(text);
  const financialFlags = matchPhrases(text, FINANCIAL_RULES, "financial");
  const greetingFlags = matchPhrases(text, GREETING_RULES, "greeting");

  const allFlags: MatchedRule[] = [
    ...urgencyFlags,
    ...linkFlags,
    ...financialFlags,
    ...greetingFlags,
  ];

  const breakdown: CategoryBreakdown[] = CATEGORY_ORDER.map((cat) => {
    const matches =
      cat === "urgency"
        ? urgencyFlags
        : cat === "links"
          ? linkFlags
          : cat === "financial"
            ? financialFlags
            : greetingFlags;
    const maxPoints = CATEGORY_MAX[cat];
    const points = Math.min(
      maxPoints,
      matches.reduce((sum, m) => sum + m.points, 0),
    );
    return {
      category: cat,
      title: CATEGORY_TITLES[cat],
      description: CATEGORY_DESCRIPTIONS[cat],
      points,
      maxPoints,
      matches,
    };
  });

  const score = Math.min(100, breakdown.reduce((sum, b) => sum + b.points, 0));
  const level: RiskLevel = score < 30 ? "low" : score <= 65 ? "medium" : "high";
  const verdict =
    level === "low" ? "Low Risk" : level === "medium" ? "Medium Risk" : "High Scam Risk";

  return {
    message: text,
    score,
    level,
    verdict,
    extreme: score >= 90,
    flags: allFlags,
    breakdown,
    charCount: text.length,
  };
}