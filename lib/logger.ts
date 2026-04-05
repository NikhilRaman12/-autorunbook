export const logger = {
  _log(level: "INFO" | "WARN" | "ERROR", event: string, data: any = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      service: "autorunbook",
      version: "1.0.0",
      ...data,
    };
    console.log(JSON.stringify(logEntry));
  },
  info(event: string, data: any = {}) {
    this._log("INFO", event, data);
  },
  warn(event: string, data: any = {}) {
    this._log("WARN", event, data);
  },
  error(event: string, error: any, data: any = {}) {
    this._log("ERROR", event, { error: error?.message || String(error), stack: error?.stack, ...data });
  },
  alert(alert: any) {
    this._log("WARN", "alert_fired", { alert });
  },
  runbook(runbook: any, generation_time_ms: number) {
    this._log("INFO", "runbook_generated", { runbook_id: runbook.id, alert_id: runbook.alert_id, generation_time_ms, ai_generated: runbook.ai_generated });
  }
};
