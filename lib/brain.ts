import { GoogleGenAI, Type } from '@google/genai';
import { Alert, Runbook } from '../types';
import { logger } from './logger';

class RunbookBrain {
  public getLastError(): { message: string, timestamp: string } | null {
    return (global as any)._lastGeminiError || null;
  }

  private getSystemInstruction(): string {
    return `You are ARIA (Automated Runbook Intelligence Assistant), a senior 
Site Reliability Engineer with 15 years of production experience 
at top-tier technology companies.

You have deep expertise in:
- Distributed systems failure analysis
- Production incident management
- Root cause analysis (RCA)
- Performance degradation patterns
- Container orchestration (Docker, Kubernetes)
- Next.js and Node.js production services
- Database connection pool failures
- Network latency and packet loss patterns
- Memory leaks and CPU spike diagnosis
- API rate limiting and timeout patterns

═══════════════════════════════════════
YOUR IDENTITY AND BEHAVIOUR
═══════════════════════════════════════

You are calm, precise, and decisive under pressure.
You never panic. You never guess. You never hallucinate commands.
You think like an engineer who has been paged at 3 AM 
and needs to fix things fast.

When you are not certain about a fix, you write:
"INVESTIGATE: [what to look for]"
instead of inventing a command that might not work.

You always prioritise:
1. Stopping the bleeding (immediate fix)
2. Understanding the cause (root cause)
3. Preventing recurrence (prevention)

═══════════════════════════════════════
YOUR ONLY JOB IN THIS SYSTEM
═══════════════════════════════════════

You receive a production alert from a Next.js application 
running in Docker with Prometheus monitoring.

You must respond with a structured incident runbook that an 
on-call engineer can execute immediately without thinking.

Every word you write will be read by an engineer under 
pressure. Be direct. Be actionable. Save lives (of services).

═══════════════════════════════════════
STRICT OUTPUT RULES — NEVER VIOLATE
═══════════════════════════════════════

RULE 1: Return ONLY raw JSON. 
No markdown. No backticks. No explanation. 
No "Here is the runbook:". 
Just the JSON object. Nothing before it. Nothing after it.

RULE 2: JSON structure must be EXACTLY this shape:
{
  "incident_title": "string — short alarming title max 6 words",
  "root_cause": "string — exactly 2 sentences, technical, specific",
  "severity": "P1" or "P2" or "P3",
  "severity_reason": "string — one sentence explaining severity rating",
  "estimated_impact": "string — who is affected and how badly",
  "fix_steps": [
    "IMMEDIATE: exact terminal command or action",
    "IMMEDIATE: exact terminal command or action", 
    "VERIFY: exact command to confirm fix worked",
    "MONITOR: exact metric or log to watch",
    "ESCALATE: condition under which to escalate"
  ],
  "prevention": "string — one concrete architectural recommendation",
  "estimated_resolution_time": "string — e.g. 2-5 minutes",
  "runbook_confidence": "HIGH" or "MEDIUM" or "LOW"
}

RULE 3: fix_steps must have EXACTLY 5 items.
Each step must start with one of these prefixes:
IMMEDIATE: / VERIFY: / MONITOR: / ESCALATE: / INVESTIGATE:

RULE 4: severity must be EXACTLY "P1", "P2", or "P3".
P1 = service down or data loss risk
P2 = degraded performance affecting users  
P3 = warning, not yet user-facing

RULE 5: runbook_confidence levels mean:
HIGH = you are certain of root cause and fix
MEDIUM = likely cause identified, fix should work
LOW = multiple possible causes, use INVESTIGATE steps

RULE 6: terminal commands must be real and executable.
Docker commands, curl commands, grep commands only.
Never invent flags that do not exist.
When uncertain, use INVESTIGATE: prefix.

RULE 7: incident_title must be alarming and specific.
BAD:  "High Latency Alert"
GOOD: "API Response Time Critical — DB Timeout Likely"

RULE 8: Never use the word "please" or "sorry".
You are an engineer, not a chatbot.

═══════════════════════════════════════
SEVERITY DECISION RULES
═══════════════════════════════════════

Classify as P1 if ANY of these are true:
- Error rate > 10%
- Service completely unreachable
- Data loss is possible
- Availability < 95%
- Payment or auth systems affected

Classify as P2 if ANY of these are true:
- p99 latency > 500ms
- Error rate between 1% and 10%
- CPU > 80% sustained for 5+ minutes
- Memory > 85%
- Availability between 95% and 99%

Classify as P3 if:
- Metrics elevated but users not yet affected
- Early warning signals only
- Availability > 99% but trending down

═══════════════════════════════════════
EXAMPLES OF GOOD FIX STEPS
═══════════════════════════════════════

For high latency alert:
"IMMEDIATE: Check slow queries: docker exec -it db psql -c 
 'SELECT pid, query, query_start FROM pg_stat_activity 
  WHERE state=active ORDER BY query_start;'"

"IMMEDIATE: Restart app if memory leak suspected: 
 docker compose restart app"

"VERIFY: Confirm p99 dropping: 
 curl localhost:9090/api/v1/query?query=http_request_duration_p99"

"MONITOR: Watch error rate for next 5 minutes: 
 watch -n 5 curl -s localhost:3000/api/metrics | grep error_rate"

"ESCALATE: If latency still > 500ms after restart, 
 page database team"`;
  }

  async generate(alert: Alert): Promise<Runbook> {
    const start = Date.now()
    
    console.log('GEMINI STARTING CALL', alert.name)
    
    const placeholders = ["MY_GEMINI_API_KEY", "Gemini_Api_Key", "undefined", ""];
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.Gemini_API_Key,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    ];
    
    const apiKey = keys.find(k => k && !placeholders.includes(k));
    
    console.log('API KEY SELECTION:', {
      found: !!apiKey,
      length: apiKey?.length,
      source: apiKey === process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 
              apiKey === process.env.Gemini_API_Key ? 'Gemini_API_Key' : 
              apiKey === process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'NEXT_PUBLIC_GEMINI_API_KEY' : 'none'
    })
    
    if (!apiKey) {
      console.error('GEMINI ERROR: No valid API Key found (only placeholders or empty)')
      return this.getFallbackRunbook(alert)
    }

    try {
      (global as any)._lastGeminiError = null;
      const ai = new GoogleGenAI({ apiKey })
      
      const prompt = `You are a senior SRE.
Alert: ${alert.name}
Metric: ${alert.metric}  
Value: ${alert.current_value}
Threshold: ${alert.threshold}

Return ONLY this JSON with no markdown:
{
  "incident_title": "short title max 6 words",
  "root_cause": "exactly 2 technical sentences",
  "severity": "P1",
  "severity_reason": "one sentence",
  "estimated_impact": "who is affected",
  "fix_steps": [
    "IMMEDIATE: check logs: docker compose logs app",
    "IMMEDIATE: restart service if memory leak",
    "VERIFY: curl localhost:3000/api/health",
    "MONITOR: watch error rate for 5 minutes",
    "ESCALATE: page team if not resolved in 10min"
  ],
  "prevention": "one architectural recommendation",
  "estimated_resolution_time": "2-5 minutes",
  "runbook_confidence": "HIGH"
}`

      console.log('SENDING TO GEMINI...')
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        }
      })
      
      const raw = response.text || "";
      (global as any)._lastRawResponse = raw;
      console.log('GEMINI RAW RESPONSE:', raw.slice(0, 200));
      
      const cleaned = raw
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleaned);
      const generation_time_ms = Date.now() - start;
      console.log('GEMINI SUCCESS in', generation_time_ms, 'ms');
      
      return {
        id: alert.id,
        alert_id: alert.id,
        ...parsed,
        generated_at: new Date().toISOString(),
        generation_time_ms,
        ai_generated: true
      };
    } catch (error: any) {
      console.error('GEMINI FAILED:', error.message);
      (global as any)._lastGeminiError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        raw: (global as any)._lastRawResponse
      };
      return this.getFallbackRunbook(alert);
    }
  }

  getFallbackRunbook(alert: Alert): Runbook {
    let fix_steps = [
      "IMMEDIATE: Acknowledge alert",
      "IMMEDIATE: Check recent deployments",
      "VERIFY: Check application logs",
      "MONITOR: Watch system metrics",
      "ESCALATE: Page secondary on-call"
    ];

    if (alert.metric.includes("latency")) {
      fix_steps = [
        "IMMEDIATE: Check database connection pool metrics",
        "IMMEDIATE: Restart application pods to clear stalled requests",
        "VERIFY: Run curl against health endpoint to verify response time",
        "MONITOR: Watch p99 latency gauge in Grafana",
        "ESCALATE: Page database team if DB CPU is > 90%"
      ];
    } else if (alert.metric.includes("error")) {
      fix_steps = [
        "IMMEDIATE: Search logs for 'ERROR' or 'Exception'",
        "IMMEDIATE: Check status of downstream dependencies",
        "VERIFY: Perform synthetic transaction to verify functionality",
        "MONITOR: Watch error rate percentage",
        "ESCALATE: Page platform team if network issues suspected"
      ];
    } else if (alert.metric.includes("cpu")) {
      fix_steps = [
        "IMMEDIATE: Identify runaway processes using 'top' or 'htop'",
        "IMMEDIATE: Restart affected containers/pods",
        "VERIFY: Confirm CPU usage drops below 50%",
        "MONITOR: Watch CPU usage metrics for recurrence",
        "ESCALATE: Page capacity planning if sustained high load"
      ];
    } else if (alert.metric.includes("memory")) {
      fix_steps = [
        "IMMEDIATE: Check for OOMKilled events in Kubernetes",
        "IMMEDIATE: Restart affected pods to clear memory leak",
        "VERIFY: Confirm memory usage drops to baseline",
        "MONITOR: Watch memory usage growth rate",
        "ESCALATE: Page application team to investigate leak"
      ];
    } else if (alert.metric.includes("availability")) {
      fix_steps = [
        "IMMEDIATE: Check load balancer health checks",
        "IMMEDIATE: Verify DNS resolution is working",
        "VERIFY: Access application from external network",
        "MONITOR: Watch availability percentage",
        "ESCALATE: Page network team immediately"
      ];
    }

    return {
      id: alert.id,
      alert_id: alert.id,
      incident_title: `Fallback Runbook: ${alert.name}`,
      root_cause: "Automated fallback runbook triggered due to AI generation failure or timeout.",
      severity: alert.severity,
      severity_reason: `Inherited from alert severity ${alert.severity}`,
      estimated_impact: "Potential service degradation or outage",
      fix_steps,
      prevention: "Investigate AI generation failure and improve fallback coverage.",
      estimated_resolution_time: "15-30 minutes",
      runbook_confidence: "LOW",
      generated_at: new Date().toISOString(),
      generation_time_ms: 0,
      ai_generated: false,
    };
  }
}

export const brain = new RunbookBrain();
