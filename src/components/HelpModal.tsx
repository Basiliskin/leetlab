// Help / feature guide modal: one place that explains everything the app
// can do — layout, running and testing, keyboard shortcuts, autocomplete,
// the algorithm snippet pack, sandbox services, and data management. The
// snippet reference is generated from ALGO_SNIPPET_DEFS so it never drifts
// from what the editor actually offers.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ALGO_SNIPPET_DEFS,
  snippetPreview,
} from "../infrastructure/algoSnippets";
import { SANDBOX_SERVICE_CONSTRUCTORS } from "../services/sandbox-bindings";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  { id: "layout", label: "Layout" },
  { id: "running", label: "Run & test" },
  { id: "keys", label: "Shortcuts" },
  { id: "complete", label: "Autocomplete" },
  { id: "snippets", label: "Snippets" },
  { id: "services", label: "Sandbox services" },
  { id: "data", label: "Problems & data" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const SHORTCUTS: [string[], string][] = [
  [[MOD, "Enter"], "Run code against the test cases"],
  [[MOD, "Shift", "Enter"], "Submit (records a submission)"],
  [["Ctrl", "Space"], "Open autocomplete"],
  [["Tab"], "Indent · accept completion · next snippet field"],
  [["Shift", "Tab"], "Outdent · previous snippet field"],
  [["Esc"], "Close autocomplete / leave snippet fields"],
  [[MOD, "/"], "Toggle line comment"],
  [[MOD, "Z"], "Undo"],
  [isMac ? ["⌘", "Shift", "Z"] : ["Ctrl", "Y"], "Redo"],
  // CodeMirror's foldKeymap: Ctrl-Shift-[ / ] (Cmd-Alt-[ / ] on macOS) for
  // the block at the cursor, Ctrl-Alt-[ / ] everywhere for all blocks.
  [
    isMac ? ["⌘", "Alt", "["] : ["Ctrl", "Shift", "["],
    "Fold the block at the cursor",
  ],
  [
    isMac ? ["⌘", "Alt", "]"] : ["Ctrl", "Shift", "]"],
    "Unfold the block at the cursor",
  ],
  [["Ctrl", "Alt", "["], "Fold all"],
  [["Ctrl", "Alt", "]"], "Unfold all"],
];

const SERVICE_NOTES: Record<string, string> = {
  redis:
    "Redis emulation — strings, lists, hashes, sets, sorted sets, TTL, pub/sub",
  pg: "PostgreSQL-style MVCC transaction manager",
  rabbitmq: "RabbitMQ broker — exchanges, queues, routing keys, ack/nack",
  kafka: "Kafka broker — topics, partitions, consumer groups, offsets",
  queue: "BullMQ-style job queue — jobs, workers, retries, backoff",
};

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="help-keys">
      {keys.map((k, i) => (
        <span key={i}>
          {i > 0 ? "+" : null}
          <kbd>{k}</kbd>
        </span>
      ))}
    </span>
  );
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [section, setSection] = useState<SectionId>("layout");
  const [query, setQuery] = useState("");
  const [openSnippet, setOpenSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const snippets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALGO_SNIPPET_DEFS.filter(
      (d) =>
        !q ||
        d.label.toLowerCase().includes(q) ||
        d.detail.toLowerCase().includes(q) ||
        d.group.toLowerCase().includes(q),
    );
  }, [query]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="help-modal-title">How leetlab works</h2>
            <p className="modal-sub">
              Everything runs in your browser. Nothing is sent anywhere unless
              you use Generate with your own API key.
            </p>
          </div>
          <button
            type="button"
            className="modal-x"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <nav className="help-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`chip ${section === s.id ? "on" : ""}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="help-body">
          {section === "layout" && (
            <>
              <h3>Three panels</h3>
              <ul>
                <li>
                  <b>Problem list</b> (left): search, filter by difficulty,
                  status and category. A ✓ marks problems you've solved.
                </li>
                <li>
                  <b>Problem pane</b> (middle) has five tabs: <b>Description</b>
                  , <b>Submissions</b> (your history for this problem),{" "}
                  <b>Testcases</b>, <b>Result</b> and <b>Console</b>.
                </li>
                <li>
                  <b>Editor</b> (right): JavaScript / TypeScript toggle, Format
                  (Prettier), Run and Submit.
                </li>
              </ul>
              <h3>Collapsing</h3>
              <ul>
                <li>
                  Click <kbd>«</kbd> in a panel's header to hide it. It shrinks
                  to a slim rail; click the rail to bring it back. The editor
                  takes the freed space.
                </li>
                <li>Which panels are hidden is remembered between visits.</li>
                <li>
                  Running code reopens the problem pane on the Result tab, so
                  results are never hidden.
                </li>
                <li>
                  In the editor, click the ⌄ arrows in the gutter to fold code
                  blocks.
                </li>
              </ul>
              <h3>On a phone</h3>
              <ul>
                <li>
                  ☰ opens the problem list, ⋯ holds the menu actions, and the{" "}
                  <b>Editor / Problem · Tests</b> tabs switch views.
                </li>
              </ul>
            </>
          )}

          {section === "running" && (
            <>
              <h3>Run vs Submit</h3>
              <ul>
                <li>
                  <b>Run Code</b> executes your solution against every test case
                  and shows the verdict on the Result tab.
                </li>
                <li>
                  <b>Submit</b> does the same and also records the attempt in
                  Submissions. If your last run wasn't Accepted, you're asked to
                  confirm first. An Accepted submit marks the problem as solved.
                </li>
                <li>
                  Each run has a 6-second time limit (Time Limit Exceeded after
                  that).
                </li>
              </ul>
              <h3>Test cases</h3>
              <ul>
                <li>
                  <b>Input</b> is a JSON array of arguments. For{" "}
                  <code>twoSum(nums, target)</code> it's{" "}
                  <code>[[2,7,11,15], 9]</code>.
                </li>
                <li>
                  For class problems, input is a list of calls:{" "}
                  <code>[["MinStack",[]],["push",[3]],["getMin",[]]]</code>. The
                  first call constructs the class.
                </li>
                <li>
                  <b>Expected</b> is JSON and compared structurally (key order
                  doesn't matter). Leave it empty to just see the output.
                </li>
                <li>
                  Add your own cases, delete them, or use{" "}
                  <b>Restore default cases</b>.
                </li>
              </ul>
              <h3>Debugging</h3>
              <ul>
                <li>
                  <code>console.log</code> / <code>warn</code> /{" "}
                  <code>error</code> / <code>info</code> output appears on the
                  Console tab and under the results. The <code>clg</code>,{" "}
                  <code>clv</code> and <code>cltable</code> snippets insert them
                  quickly.
                </li>
                <li>
                  In TypeScript mode, type errors are underlined as you type.
                  Hover a squiggle to read the message.
                </li>
              </ul>
            </>
          )}

          {section === "keys" && (
            <>
              <table className="help-table">
                <tbody>
                  {SHORTCUTS.map(([keys, what]) => (
                    <tr key={what}>
                      <td>
                        <Keys keys={keys} />
                      </td>
                      <td>{what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {section === "complete" && (
            <>
              <h3>What autocomplete offers</h3>
              <ul>
                <li>
                  <b>Your own variables and functions</b> in scope, plus
                  JavaScript keywords.
                </li>
                <li>
                  <b>Built-in globals</b>: <code>Math</code>, <code>Map</code>,{" "}
                  <code>Promise</code>, <code>JSON</code>… Typing{" "}
                  <code>Math.</code> lists their members.
                </li>
                <li>
                  <b>Type-aware members</b> in TypeScript mode, e.g.{" "}
                  <code>nums.</code> lists array methods.
                </li>
                <li>
                  <b>Constructor templates</b> in TypeScript mode: typing{" "}
                  <code>new ReadableStream(</code> (also the other stream types
                  and <code>AbortController</code>) offers ready-made usage
                  examples to insert.
                </li>
                <li>
                  <b>Sandbox services</b>: <code>redis.</code>, <code>pg.</code>
                  , <code>kafka.</code>… list their methods with signatures.
                </li>
                <li>
                  <b>Algorithm snippets</b>: short names that expand into common
                  patterns. See the Snippets tab.
                </li>
              </ul>
              <p className="help-note">
                The list opens after a short pause in typing. Press{" "}
                <kbd>Ctrl</kbd>+<kbd>Space</kbd> to open it any time.
              </p>
            </>
          )}

          {section === "snippets" && (
            <>
              <p className="help-note">
                Type a snippet name in the editor and pick it from the list.
                After it expands, <kbd>Tab</kbd> jumps between the placeholders.
                Placeholders with the same name are edited together. Snippets
                don't appear inside strings or comments or after a{" "}
                <code>.</code>.
              </p>
              <input
                className="help-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter snippets… (e.g. graph, sort, heap)"
              />
              <table className="help-table snippets">
                <tbody>
                  {snippets.map((d) => (
                    <SnippetRow
                      key={d.label}
                      label={d.label}
                      detail={d.detail}
                      group={d.group}
                      preview={snippetPreview(d.template)}
                      open={openSnippet === d.label}
                      onToggle={() =>
                        setOpenSnippet((o) => (o === d.label ? null : d.label))
                      }
                    />
                  ))}
                </tbody>
              </table>
              {snippets.length === 0 && (
                <div className="empty">
                  <b>No snippet matches “{query}”</b>
                </div>
              )}
            </>
          )}

          {section === "services" && (
            <>
              <p className="help-note">
                Some problems use in-browser emulations of backend services.
                They are always available as globals in your code, with
                autocomplete. No real servers are involved.
              </p>
              <table className="help-table">
                <tbody>
                  {Object.entries(SANDBOX_SERVICE_CONSTRUCTORS).map(
                    ([name, ctor]) => (
                      <tr key={name}>
                        <td>
                          <code>{name}</code>
                        </td>
                        <td>
                          {SERVICE_NOTES[name] ?? ctor.name}
                          <span className="help-dim"> · {ctor.name}</span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </>
          )}

          {section === "data" && (
            <>
              <h3>Your progress</h3>
              <ul>
                <li>
                  Code, custom test cases, submissions and solved status are
                  saved in this browser automatically, separately for JavaScript
                  and TypeScript.
                </li>
                <li>
                  <b>⇩ Export</b> downloads a backup file and <b>⇧ Import</b>{" "}
                  restores it, e.g. on another computer.
                </li>
              </ul>
              <h3>More problems</h3>
              <ul>
                <li>
                  <b>+ Generate</b> asks an LLM for a new problem. You review it
                  before it's added to the Generated category.
                </li>
                <li>
                  <b>⚙ Providers</b> manages which LLM APIs and keys Generate
                  uses. Keys stay in this browser and are never exported.
                </li>
              </ul>
              <h3>TypeScript status badge</h3>
              <ul>
                <li>
                  <b>compiler ready</b>: the real TypeScript compiler loaded
                  from the CDN.
                </li>
                <li>
                  <b>fallback stripper</b>: the CDN couldn't be reached, so a
                  simple type-stripper is used. Most code still works, but type
                  checking is off.
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SnippetRow(props: {
  label: string;
  detail: string;
  group: string;
  preview: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="snip-row" onClick={props.onToggle}>
        <td>
          <code>{props.label}</code>
        </td>
        <td>
          {props.detail}
          <span className="help-dim"> · {props.group}</span>
        </td>
        <td className="snip-caret">{props.open ? "▾" : "▸"}</td>
      </tr>
      {props.open && (
        <tr>
          <td colSpan={3}>
            <pre className="snip-preview">{props.preview}</pre>
          </td>
        </tr>
      )}
    </>
  );
}
