"use client";

import { ChatMessage } from "@/lib/types";
import styles from "./ToolProgress.module.css";

/**
 * Visible above the assistant bubble while the Ask pipeline runs.
 * Claude-style timeline: each tool call is one row, with the most
 * recent three visible and the rest collapsed by default.
 */
export default function ToolProgress({
  message,
}: {
  message: ChatMessage;
}) {
  const progress = message.progress ?? [];
  if (!progress.length) return null;

  // Reduce the stream into: header state, ordered tool rows, and
  // a separate composer row when the composer phase ran.
  const toolRows: ToolRow[] = [];
  let composerStarted = false;
  let composerFinished = false;
  let composerFailed = false;
  let composerResultCount: number | undefined;
  let finalError: string | undefined;
  let httpStatus: number | undefined;

  for (const event of progress) {
    if (event.type === "tool_started") {
      const existing = toolRows.find(
        (r) => r.toolName === event.tool_name && !r.finished,
      );
      if (existing) {
        existing.started = true;
        existing.label = event.tool_label;
        existing.step = event.step;
      } else {
        toolRows.push({
          toolName: event.tool_name,
          label: event.tool_label,
          started: true,
          finished: false,
          failed: false,
          step: event.step,
          elapsedMs: 0,
          resultCount: undefined,
          errorMessage: undefined,
        });
      }
    } else if (event.type === "tool_finished") {
      const row =
        toolRows.find(
          (r) => r.toolName === event.tool_name && !r.finished,
        ) ?? toolRows[toolRows.length - 1];
      if (!row) continue;
      row.finished = true;
      row.failed = event.status === "failed";
      row.elapsedMs = event.elapsed_ms;
      row.resultCount = event.result_count;
      row.errorMessage = event.error_message;
    } else if (event.type === "composer") {
      if (event.status === "started") composerStarted = true;
      if (event.status === "finished") {
        composerFinished = true;
        composerResultCount = event.result_count;
      }
      if (event.status === "failed") composerFailed = true;
    } else if (event.type === "error") {
      finalError = event.error_message;
      httpStatus = event.http_status;
    }
  }

  // Don't render the timeline if there were no real tool calls.
  if (!toolRows.length && !composerStarted && !finalError) return null;

  const allFinished: boolean = Boolean(message.finalised);
  const finishedCount = toolRows.filter((r) => r.finished).length;
  const totalElapsed = sum(toolRows.map((r) => r.elapsedMs));
  const headerState = computeHeader({
    allFinished,
    composerStarted,
    composerFinished,
    composerFailed,
    finishedCount,
    hasError: !!finalError,
  });

  const visibleRows = toolRows.slice(-3);
  const hiddenRows = toolRows.slice(0, Math.max(0, toolRows.length - 3));

  return (
    <div className={styles.timeline} data-testid="tool-progress">
      <div className={styles.header} aria-live="polite">
        <span className={styles.headerIcon} aria-hidden="true">
          {finalError ? "!" : headerState.icon}
        </span>
        <span className={styles.headerLabel}>{headerState.label}</span>
        {allFinished && !finalError ? (
          <span className={styles.headerMeta}>
            {toolRows.length === 1
              ? "1 tool"
              : `${toolRows.length} tools`}{" "}
            · {(totalElapsed / 1000).toFixed(1)} s
          </span>
        ) : null}
      </div>

      {finalError ? (
        <p className={styles.errorMessage} role="alert">
          {httpStatus === 502
            ? "I couldn't reach the Ask composer right now. Try again in a moment."
            : finalError}
        </p>
      ) : null}

      {hiddenRows.length ? (
        <details className={styles.disclosure}>
          <summary className={styles.disclosureSummary}>
            Show {hiddenRows.length} earlier{" "}
            {hiddenRows.length === 1 ? "step" : "steps"}
          </summary>
          <ul className={styles.steps}>
            {hiddenRows.map((row, idx) => (
              <Row
                key={`${row.toolName}-${idx}-hidden`}
                row={row}
                composerStarted={composerStarted && !composerFinished && !composerFailed && idx === hiddenRows.length - 1}
              />
            ))}
          </ul>
        </details>
      ) : null}

      {visibleRows.length || composerStarted ? (
        <ul className={styles.steps}>
          {visibleRows.map((row, idx) => (
            <Row
              key={`${row.toolName}-${idx}`}
              row={row}
              composerStarted={false}
            />
          ))}
          {composerStarted ? (
            <ComposerRow
              finished={composerFinished}
              failed={composerFailed}
              resultCount={composerResultCount}
              hidden={false}
            />
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

interface ToolRow {
  toolName: string;
  label: string;
  started: boolean;
  finished: boolean;
  failed: boolean;
  step: number;
  elapsedMs: number;
  resultCount: number | undefined;
  errorMessage: string | undefined;
}

function Row({
  row,
  composerStarted,
}: {
  row: ToolRow;
  composerStarted: boolean;
}) {
  const state = row.failed
    ? "failed"
    : row.finished
      ? "finished"
      : "running";
  const showCount = row.finished && !row.failed && row.resultCount !== undefined;
  const meta = row.failed
    ? "failed"
    : row.finished
      ? `${(row.elapsedMs / 1000).toFixed(2)} s`
      : composerStarted
        ? "running…"
        : "running…";
  return (
    <li className={styles.step} data-state={state}>
      <span className={styles.stepDot} aria-hidden="true" />
      <span className={styles.stepLabel}>{row.label}</span>
      <span className={styles.stepMeta}>
        {meta}
        {showCount
          ? ` · ${row.resultCount} ${row.resultCount === 1 ? "result" : "results"}`
          : ""}
      </span>
    </li>
  );
}

function ComposerRow({
  finished,
  failed,
  resultCount,
  hidden,
}: {
  finished: boolean;
  failed: boolean;
  resultCount: number | undefined;
  hidden: boolean;
}) {
  const state = failed ? "failed" : finished ? "finished" : "running";
  const meta = failed
    ? "failed"
    : finished
      ? resultCount !== undefined
        ? `${(resultCount === 1 ? "1 source" : `${resultCount} sources`)} cited`
        : "done"
      : "writing…";
  return (
    <li className={styles.step} data-state={state} data-stage="composer" hidden={hidden}>
      <span className={styles.stepDot} aria-hidden="true" />
      <span className={styles.stepLabel}>Writing answer</span>
      <span className={styles.stepMeta}>{meta}</span>
    </li>
  );
}

function computeHeader({
  allFinished,
  composerStarted,
  composerFinished,
  composerFailed,
  finishedCount,
  hasError,
}: {
  allFinished: boolean;
  composerStarted: boolean;
  composerFinished: boolean;
  composerFailed: boolean;
  finishedCount: number;
  hasError: boolean;
}): { icon: string; label: string } {
  if (hasError) return { icon: "!", label: "Something went wrong" };
  if (composerFailed) return { icon: "●", label: "Couldn't write the answer" };
  if (!allFinished && composerStarted && !composerFinished) {
    return { icon: "◐", label: "Writing answer" };
  }
  if (!allFinished) {
    return { icon: "◐", label: "Thinking" };
  }
  if (finishedCount === 0) {
    return { icon: "✓", label: "No tools needed" };
  }
  return {
    icon: "✓",
    label: `Used ${finishedCount} ${finishedCount === 1 ? "tool" : "tools"}`,
  };
}

function sum(values: number[]): number {
  return values.reduce((acc, n) => acc + n, 0);
}