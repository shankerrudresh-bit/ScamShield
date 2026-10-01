import { useState } from "react";

type Mode = "text" | "phishing";
type Channel = "SMS" | "WhatsApp";
type Tone = "safe" | "caution" | "threat";
type Finding = { label: string; detail: string; points: number };

type TextResult = { score: number; findings: Finding[] };
type UrlResult = { score: number; findings: Finding[]; domain: string };

const bankSms = "URGENT: Your bank account will be suspended today. Verify your account now and share the OTP at http://bit.ly/secure-help to receive your refund.";
const safeMessage = "Hi Alex, dinner is confirmed for 7pm tonight. See you at the restaurant.";
const phishingUrl = "http://login-update-amazon.account-security.xyz/login";
const safeUrl = "https://www.microsoft.com/security";

function toneFor(score: number): Tone {
  return score >= 60 ? "threat" : score >= 30 ? "caution" : "safe";
}

function toneLabel(tone: Tone) {
  return tone === "threat" ? "Threat detected" : tone === "caution" ? "Use caution" : "Looks safe";
}

function scoreText(value: string): TextResult {
  const checks: Array<[RegExp, string, string, number]> = [
    [/urgent|immediately|act now|within \d+ hours?/i, "Urgency pressure", "The sender is pushing you to act before you can verify the request.", 24],
    [/free|winner|won|prize|reward|refund|cashback|claim/i, "Fake offer language", "Unexpected rewards and refunds are common scam lures.", 20],
    [/dear customer|dear user|valued customer|hello customer/i, "Generic greeting", "A vague greeting can indicate a mass message.", 12],
    [/otp|one[- ]time password|verification code|password|pin/i, "Credential or code request", "Never share one-time codes, passwords, or PINs in response to a message.", 26],
    [/click|tap|open|bit\.ly|tinyurl|t\.co|https?:\/\//i, "Suspicious link or action", "Links can lead to fake sign-in pages or malware.", 18],
  ];
  const findings = checks.filter(([pattern]) => pattern.test(value)).map(([, label, detail, points]) => ({ label, detail, points }));
  return { score: Math.min(100, findings.reduce((total, item) => total + item.points, 0)), findings };
}

function scoreUrl(value: string): UrlResult {
  const findings: Finding[] = [];
  let parsed: URL | undefined;
  try { parsed = new URL(value.trim()); } catch { if (value.trim()) findings.push({ label: "Invalid URL format", detail: "This is not a complete web address. Verify it before opening.", points: 35 }); }
  if (!parsed) return { score: Math.min(100, findings.reduce((total, item) => total + item.points, 0)), findings, domain: "Unable to extract domain" };

  const host = parsed.hostname.toLowerCase();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) findings.push({ label: "IP address used as host", detail: "Legitimate services usually use a recognizable domain instead of a raw numeric address.", points: 28 });
  if (host.split(".").length > 3) findings.push({ label: "Excessive subdomains", detail: "Nested subdomains can hide the real destination or imitate a trusted brand.", points: 18 });
  if (/paypal|amazon|microsoft|apple|google|bank|secure|login|update/.test(host) && !/(paypal\.com|amazon\.com|microsoft\.com|apple\.com|google\.com)$/.test(host)) findings.push({ label: "Possible brand impersonation", detail: "A trusted brand name appears in a domain that is not its official domain.", points: 30 });
  if (/\.(xyz|top|work|click|zip|info)$/i.test(host)) findings.push({ label: "High-risk top-level domain", detail: "This top-level domain is frequently used for disposable phishing infrastructure.", points: 18 });
  if (parsed.port) findings.push({ label: "Unusual port number", detail: `The link uses port ${parsed.port}, which is uncommon for normal public sign-in pages.`, points: 14 });
  if (parsed.username || parsed.password || value.includes("@")) findings.push({ label: "Obfuscated destination", detail: "User information or an @ symbol can conceal the actual host.", points: 24 });
  if (parsed.protocol !== "https:") findings.push({ label: "Connection is not encrypted", detail: "HTTP does not protect the connection and does not prove that the site is authentic.", points: 14 });
  if (host.includes("xn--")) findings.push({ label: "Encoded domain name", detail: "Encoded domains can visually resemble trusted brands.", points: 14 });
  return { score: Math.min(100, findings.reduce((total, item) => total + item.points, 0)), findings, domain: host };
}

function scoreEmail(value: string): Finding[] {
  const findings: Finding[] = [];
  if (/verify your account|password reset requested|suspicious activity detected|confirm your identity|account suspended/i.test(value)) findings.push({ label: "Phishing language", detail: "The content uses a common account-threat or verification lure.", points: 24 });
  const sender = value.match(/from:\s*["']?([^<"']+)["']?\s*<([^>]+)>/i);
  if (sender && /bank|support|security|microsoft|paypal|amazon/i.test(sender[1]) && !new RegExp(sender[1].replace(/[^a-z]/gi, ""), "i").test(sender[2])) findings.push({ label: "Sender identity mismatch", detail: `The display name looks like ${sender[1].trim()}, but the address is ${sender[2]}.`, points: 30 });
  if (/click here|login now|open the attachment|verify immediately|send your password/i.test(value)) findings.push({ label: "Call to risky action", detail: "The message asks you to click, sign in, or provide sensitive information.", points: 22 });
  return findings;
}

function RiskMeter({ score }: { score: number }) {
  const tone = toneFor(score);
  return <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><span>Threat score</span><span className={`risk-${tone}`}>{score}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className={`meter-${tone} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(3, score)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span>Safe</span><span>Caution</span><span>Threat</span></div></div>;
}

function FindingsList({ findings }: { findings: Finding[] }) {
  if (!findings.length) return <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">No common risk signals were detected. Continue to verify unexpected messages and links independently.</div>;
  return <div className="space-y-3">{findings.map((finding) => <div key={finding.label} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-red-100">{finding.label}</p><span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-300">+{finding.points}</span></div><p className="mt-1 text-sm leading-6 text-slate-300">{finding.detail}</p></div>)}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-80 flex-col items-center justify-center text-center"><div className="grid size-16 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-300">?</div><p className="mt-5 font-semibold text-slate-300">{label}</p><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Use a quick test above or enter your own content. Analysis happens locally.</p></div>;
}

export default function App() {
  const [mode, setMode] = useState<Mode>("text");
  const [channel, setChannel] = useState<Channel>("SMS");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [textResult, setTextResult] = useState<TextResult>();
  const [urlResult, setUrlResult] = useState<UrlResult>();
  const [emailResult, setEmailResult] = useState<Finding[]>();

  const runTextScan = () => setTextResult(scoreText(text));
  const runPhishingScan = () => { setUrlResult(scoreUrl(url)); setEmailResult(scoreEmail(email)); };
  const loadDemo = (type: "bank" | "phishing" | "safe") => {
    if (type === "bank") { setMode("text"); setChannel("SMS"); setText(bankSms); setTextResult(scoreText(bankSms)); }
    if (type === "phishing") { const demoEmail = "From: Amazon Security <alerts@account-security.xyz>\nSubject: Verify your account - suspicious activity detected\nClick here to login now."; setMode("phishing"); setUrl(phishingUrl); setEmail(demoEmail); setUrlResult(scoreUrl(phishingUrl)); setEmailResult(scoreEmail(demoEmail)); }
    if (type === "safe") { setMode("text"); setChannel("WhatsApp"); setText(safeMessage); setTextResult(scoreText(safeMessage)); setUrl(safeUrl); setUrlResult(scoreUrl(safeUrl)); }
  };
  const phishingScore = Math.min(100, Math.round(((urlResult?.score ?? 0) + (emailResult?.reduce((total, item) => total + item.points, 0) ?? 0)) / 2));

  return <main className="min-h-screen bg-[#080d16] px-4 py-6 text-slate-100 sm:px-8 lg:py-10"><div className="mx-auto max-w-6xl">
    <header className="mb-8 flex flex-col gap-6 border-b border-slate-800 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-4 flex flex-wrap items-center gap-3"><div className="grid size-10 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-400/10 font-black text-cyan-300">SC</div><span className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">ShieldCheck</span><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">Client-side only</span></div><h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">All-in-one scam & phishing analyzer</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Inspect suspicious conversations, links, and email content before they put your accounts or money at risk.</p></div><div className="lg:text-right"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Privacy status</p><p className="mt-2 text-sm font-semibold text-emerald-300">Data never leaves this browser</p></div></header>
    <div className="mb-6 grid gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 sm:grid-cols-2"><button type="button" onClick={() => setMode("text")} className={`rounded-xl px-4 py-3 text-left ${mode === "text" ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/40" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><span className="block text-sm font-bold">Text Scam Checker</span><span className="mt-1 block text-xs text-slate-500">SMS and WhatsApp message analysis</span></button><button type="button" onClick={() => setMode("phishing")} className={`rounded-xl px-4 py-3 text-left ${mode === "phishing" ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/40" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><span className="block text-sm font-bold">URL & Email Checker</span><span className="mt-1 block text-xs text-slate-500">Link structure and header analysis</span></button></div>
    <section className="mb-6 flex flex-wrap items-center gap-2"><span className="mr-2 text-xs font-bold uppercase tracking-widest text-slate-500">Quick test</span><button type="button" onClick={() => loadDemo("bank")} className="demo-button">Fake bank SMS</button><button type="button" onClick={() => loadDemo("phishing")} className="demo-button">Phishing URL</button><button type="button" onClick={() => loadDemo("safe")} className="demo-button">Safe message & link</button></section>
    {mode === "text" ? <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div className="panel"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Message input</p><h2 className="panel-title">Scan a conversation</h2></div><div className="toggle-group">{(["SMS", "WhatsApp"] as Channel[]).map((item) => <button key={item} type="button" onClick={() => setChannel(item)} className={channel === item ? "toggle-active" : "toggle-idle"}>{item}</button>)}</div></div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste an SMS or WhatsApp message here..." className="input-area" /><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-500">{text.length} characters</span><button type="button" onClick={runTextScan} disabled={!text.trim()} className="primary-button">Analyze message</button></div></div><div className="panel"><p className="eyebrow">Analysis report</p>{textResult ? <><div className="mt-3 flex items-center justify-between"><div><h2 className={`text-2xl font-bold risk-${toneFor(textResult.score)}`}>{toneLabel(toneFor(textResult.score))}</h2><p className="mt-1 text-sm text-slate-400">{textResult.findings.length} risk factor{textResult.findings.length === 1 ? "" : "s"} detected</p></div><div className={`score-ring risk-${toneFor(textResult.score)}`}>{textResult.score}%</div></div><RiskMeter score={textResult.score} /><div className="mt-6"><p className="eyebrow mb-3">Red flags</p><FindingsList findings={textResult.findings} /></div></> : <EmptyState label="Paste a message to begin" />}</div></section> : <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="space-y-6"><div className="panel"><p className="eyebrow">URL analysis</p><h2 className="panel-title">Reveal the real destination</h2><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://suspicious-site.example/login" className="text-input" /><p className="mt-2 text-xs text-slate-500">We inspect the address structure without opening the website.</p></div><div className="panel"><p className="eyebrow">Email header or content</p><h2 className="panel-title">Check sender context</h2><textarea value={email} onChange={(event) => setEmail(event.target.value)} placeholder={'From: Support <support@example.com>\nSubject: Verify your account...'} className="input-area min-h-44" /><div className="mt-4 flex justify-end"><button type="button" onClick={runPhishingScan} disabled={!url.trim() && !email.trim()} className="primary-button">Analyze link and email</button></div></div></div><div className="panel"><p className="eyebrow">Unified report</p>{urlResult || emailResult ? <><div className="mt-3 flex items-center justify-between"><div><h2 className={`text-2xl font-bold risk-${toneFor(phishingScore)}`}>{toneLabel(toneFor(phishingScore))}</h2><p className="mt-1 max-w-xs truncate text-sm text-slate-400">{urlResult?.domain ?? "No URL analyzed"}</p></div><div className={`score-ring risk-${toneFor(phishingScore)}`}>{phishingScore}%</div></div><RiskMeter score={phishingScore} /><div className="mt-6"><p className="eyebrow mb-3">URL and email findings</p><FindingsList findings={[...(urlResult?.findings ?? []), ...(emailResult ?? [])]} /></div></> : <EmptyState label="Paste a URL or email to begin" />}</div></section>}
    <footer className="mt-8 flex flex-col gap-2 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>ShieldCheck uses transparent browser-only heuristics, not a threat-intelligence feed.</span><span className="text-emerald-400">No uploads. No tracking. No server analysis.</span></footer>
  </div></main>;
}
