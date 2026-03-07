/**
 * Test Mode — Admin-only debug logging for workflow diagnostics.
 *
 * When enabled, captures console logs, warnings, errors, network timing,
 * and workflow events into an in-memory buffer. The log can be downloaded
 * as a text file for analysis (works on mobile — saves to Files/Downloads).
 *
 * Toggle via the admin menu or `kodapost:test-mode` localStorage key.
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface TestLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "event";
  category: string;
  message: string;
  data?: string;
}

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

const TEST_MODE_KEY = "kodapost:test-mode";
const MAX_LOG_ENTRIES = 2000;

let _entries: TestLogEntry[] = [];
let _isEnabled = false;
let _originalConsoleLog: typeof console.log | null = null;
let _originalConsoleWarn: typeof console.warn | null = null;
let _originalConsoleError: typeof console.error | null = null;
let _interceptInstalled = false;

// -----------------------------------------------------------------------------
// Enable / Disable
// -----------------------------------------------------------------------------

export function isTestModeEnabled(): boolean {
  return _isEnabled;
}

export function enableTestMode(): void {
  _isEnabled = true;
  _entries = [];
  try {
    localStorage.setItem(TEST_MODE_KEY, "1");
  } catch { /* ignore */ }
  installConsoleIntercept();
  addEntry("info", "system", "Test Mode enabled");
  addEntry("info", "system", `User agent: ${navigator.userAgent}`);
  addEntry("info", "system", `Screen: ${screen.width}x${screen.height}, DPR: ${devicePixelRatio}`);
  addEntry("info", "system", `Viewport: ${window.innerWidth}x${window.innerHeight}`);
  addEntry("info", "system", `Time: ${new Date().toISOString()}`);
}

export function disableTestMode(): void {
  addEntry("info", "system", "Test Mode disabled");
  _isEnabled = false;
  try {
    localStorage.removeItem(TEST_MODE_KEY);
  } catch { /* ignore */ }
  removeConsoleIntercept();
}

/** Restore test mode from localStorage on page load. */
export function restoreTestMode(): void {
  try {
    if (localStorage.getItem(TEST_MODE_KEY) === "1") {
      _isEnabled = true;
      installConsoleIntercept();
      addEntry("info", "system", "Test Mode restored after page reload");
    }
  } catch { /* ignore */ }
}

// -----------------------------------------------------------------------------
// Logging
// -----------------------------------------------------------------------------

export function addEntry(
  level: TestLogEntry["level"],
  category: string,
  message: string,
  data?: unknown
): void {
  if (!_isEnabled) return;

  const entry: TestLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data: data !== undefined ? safeStringify(data) : undefined,
  };

  _entries.push(entry);

  // Prune if over limit
  if (_entries.length > MAX_LOG_ENTRIES) {
    _entries = _entries.slice(-MAX_LOG_ENTRIES);
  }
}

/** Convenience: log a workflow step transition. */
export function logStep(step: string, details?: string): void {
  addEntry("event", "workflow", `Step: ${step}${details ? ` — ${details}` : ""}`);
}

/** Convenience: log an export/publish event with timing. */
export function logExport(
  action: string,
  details: Record<string, unknown>
): void {
  addEntry("event", "export", action, details);
}

// -----------------------------------------------------------------------------
// Console Intercept
// -----------------------------------------------------------------------------

function installConsoleIntercept(): void {
  if (_interceptInstalled) return;
  _interceptInstalled = true;

  _originalConsoleLog = console.log;
  _originalConsoleWarn = console.warn;
  _originalConsoleError = console.error;

  console.log = (...args: unknown[]) => {
    const msg = args.map(String).join(" ");
    // Only capture KodaPost-related logs (prefixed with [Export], [Publish], [KodaPost])
    if (msg.startsWith("[Export]") || msg.startsWith("[Publish]") || msg.startsWith("[KodaPost]")) {
      addEntry("info", "console", msg);
    }
    _originalConsoleLog?.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const msg = args.map(String).join(" ");
    if (msg.startsWith("[Export]") || msg.startsWith("[Publish]") || msg.startsWith("[KodaPost]")) {
      addEntry("warn", "console", msg);
    }
    _originalConsoleWarn?.apply(console, args);
  };

  console.error = (...args: unknown[]) => {
    const msg = args.map(String).join(" ");
    addEntry("error", "console", msg);
    _originalConsoleError?.apply(console, args);
  };
}

function removeConsoleIntercept(): void {
  if (!_interceptInstalled) return;
  _interceptInstalled = false;

  if (_originalConsoleLog) console.log = _originalConsoleLog;
  if (_originalConsoleWarn) console.warn = _originalConsoleWarn;
  if (_originalConsoleError) console.error = _originalConsoleError;

  _originalConsoleLog = null;
  _originalConsoleWarn = null;
  _originalConsoleError = null;
}

// -----------------------------------------------------------------------------
// Export / Download
// -----------------------------------------------------------------------------

export function getLogEntries(): TestLogEntry[] {
  return [..._entries];
}

export function getLogCount(): number {
  return _entries.length;
}

export function clearLog(): void {
  _entries = [];
  addEntry("info", "system", "Log cleared");
}

/** Format log as a plain text report suitable for debugging. */
export function formatLogAsText(): string {
  const header = [
    "=== KodaPost Test Mode Log ===",
    `Generated: ${new Date().toISOString()}`,
    `User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}`,
    `Entries: ${_entries.length}`,
    "=".repeat(50),
    "",
  ].join("\n");

  const body = _entries
    .map((e) => {
      const ts = e.timestamp.split("T")[1]?.replace("Z", "") ?? e.timestamp;
      const levelTag = e.level.toUpperCase().padEnd(5);
      const line = `[${ts}] ${levelTag} [${e.category}] ${e.message}`;
      return e.data ? `${line}\n  DATA: ${e.data}` : line;
    })
    .join("\n");

  return header + body;
}

/** Download the log as a .txt file. Works on mobile (saves to Files/Downloads). */
export function downloadLog(): void {
  const content = formatLogAsText();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `kodapost-debug-${timestamp}.txt`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function safeStringify(data: unknown): string {
  try {
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
