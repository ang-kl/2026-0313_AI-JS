#!/usr/bin/env node
/**
 * count-interactions.js
 *
 * Measures serial, agent and token counts from Claude Code session
 * transcripts (JSONL) on disk. The transcript is the sole authority -
 * nothing is remembered from context.
 *
 * Usage:
 *   node scripts/count-interactions.js --serial
 *   node scripts/count-interactions.js --agents
 *   node scripts/count-interactions.js --tokens
 *   node scripts/count-interactions.js --all
 *   node scripts/count-interactions.js --file <session.jsonl> [--all]
 *   node scripts/count-interactions.js --sessions      # aggregate ALL sessions of this project
 *   node scripts/count-interactions.js --base <n>      # rebase offset, e.g. --base 49
 *
 * Counting rules - CLAUDE-protocol.md SS1, SS4, SS5:
 *
 *   serial = assistant entries on the MAIN thread (isSidechain !== true)
 *            carrying at least one non-empty text block. Tool-only turns and
 *            subagent chatter are excluded.
 *
 *   agents = tool_use blocks named "Task" (older CLI builds) OR "Agent"
 *            (newer ones), grouped by input.subagent_type. MATCH BOTH:
 *            matching one name reported a confident agents_total of 0 on a
 *            corpus that really contained subagent calls. tool_use_blocks_seen
 *            is printed alongside, because 0 agents out of 0 tool calls and
 *            0 out of 4,263 are different facts and a bare zero cannot tell
 *            them apart.
 *
 *   tokens = input_tokens + cache_creation_input_tokens +
 *            cache_read_input_tokens (these three reconcile into
 *            tokens_in_total) and output_tokens, DEDUPED ON message.id.
 *            The transcript writes one line per content block and repeats the
 *            identical usage object on each; summing per entry inflates every
 *            figure by blocks-per-message - measured at 1.91x. Absent usage
 *            blocks are reported as unavailable, never estimated.
 *
 * There is no per-turn accounting here, by design: protocol SS6 (the reply
 * footer) stays OFF until some script emits per-turn figures, and SS5 forbids
 * estimating one. agents_latest_session and latest_session_* are per-SESSION.
 *
 * WHICH DISK: this measures the corpus THIS MACHINE can see. A remote or web
 * container holds only the transcripts of sessions that ran there. A measured
 * serial BELOW a recorded rebase base is evidence of a partial corpus, not a
 * correction - the script says so rather than letting the smaller number pass
 * as diligence.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------- CLI ----------
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => {
  const i = argv.indexOf(f);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

let wantSerial = has('--serial') || has('--all');
let wantAgents = has('--agents') || has('--all');
let wantTokens = has('--tokens') || has('--all');
const allSessions = has('--sessions');
const explicitFile = val('--file');
const base = parseInt(val('--base') || '0', 10) || 0;

// --sessions is a SCOPE flag, not a report flag. On its own it named a scope
// with nothing to report and printed usage; treat it as implying --all.
if (allSessions && !wantSerial && !wantAgents && !wantTokens) {
  wantSerial = wantAgents = wantTokens = true;
}

if (!wantSerial && !wantAgents && !wantTokens) {
  console.log(
    'Usage: count-interactions.js [--serial|--agents|--tokens|--all] ' +
      '[--file <session.jsonl>] [--sessions] [--base <n>]'
  );
  process.exit(0);
}

// ---------- Locate transcript(s) ----------
// Claude Code stores transcripts under ~/.claude/projects/<munged-cwd>/*.jsonl
// where <munged-cwd> is the absolute project path with '/', '\', '.', '_' and
// spaces replaced by '-'.
//
// ONE REPO CAN OWN SEVERAL FOLDERS. Transcripts are keyed on the cwd PATH, not
// on the repository, so a repo opened at more than one path - from a
// subdirectory, from a worktree, from a differently-rooted checkout - has a
// folder per path. Reading only the folder derived from the current cwd is a
// silent undercount that looks like a clean answer.
//
// So: match EVERY folder whose name contains the munged repo-directory name,
// and print each folder with its own subtotal (see printScope) so a reader can
// see which were included rather than trusting a bare sum.
//
// Munge the repo name BEFORE comparing. basename(cwd) still carries '_', '.'
// and spaces, while the folder name has had them replaced by '-'; comparing the
// two raw makes an exact-named folder look absent. Measured here 2026-08-22:
// cwd basename '2026-0313_AI-JS' did not match folder '-home-user-2026-0313-AI-JS'
// until the underscore was munged.
function mungePath(p) {
  return p.replace(/[/\\._ ]/g, '-');
}

function projectDirCandidates() {
  const root = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(root)) return [];
  const dirs = fs
    .readdirSync(root)
    .map((d) => path.join(root, d))
    .filter((d) => fs.statSync(d).isDirectory());

  const needle = mungePath(path.basename(process.cwd())).toLowerCase();
  const matched = dirs.filter((d) => path.basename(d).toLowerCase().includes(needle));
  if (matched.length) return matched;

  // Last resort: the exact full-path folder, in case the repo directory name is
  // itself absent from the folder name.
  const cwdMunged = mungePath(process.cwd());
  return dirs.filter((d) => path.basename(d) === cwdMunged);
}

// Folders contributing to this run, with their file counts - printed so the
// scope of a measurement is visible rather than implied.
const folderScope = [];

function sessionFiles() {
  if (explicitFile) return [path.resolve(explicitFile)];
  const files = [];
  for (const d of projectDirCandidates()) {
    const own = fs.readdirSync(d).filter((f) => f.endsWith('.jsonl'));
    folderScope.push({ dir: d, count: own.length });
    for (const f of own) files.push(path.join(d, f));
  }
  files.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  if (!files.length) {
    console.error('No session transcripts found. Pass --file <session.jsonl>.');
    process.exit(1);
  }
  return allSessions ? files : [files[files.length - 1]];
}

// ---------- Measure ----------
function freshTally() {
  return {
    serial: 0,
    userTurns: 0,
    agentsTotal: 0,
    agentsBreakdown: {},
    toolUseBlocks: 0,
    tokens: { input: 0, output: 0, cache_read: 0, cache_creation: 0 },
    usageMissing: 0,
    lines: 0,
    badLines: 0,
  };
}

// message.id values already counted, so a repeated usage object on the next
// content-block line is not summed twice. Shared across files: ids are unique.
const seenMessageIds = new Set();

function measureFile(file, t) {
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    t.lines++;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      t.badLines++;
      continue;
    }

    const sidechain = e.isSidechain === true;
    const msg = e.message || {};
    const content = Array.isArray(msg.content) ? msg.content : [];

    if (e.type === 'user' && !sidechain) t.userTurns++;
    if (e.type !== 'assistant' || sidechain) continue;

    const hasText = content.some(
      (b) => b && b.type === 'text' && typeof b.text === 'string' && b.text.trim().length > 0
    );
    if (hasText) t.serial++;

    for (const b of content) {
      if (!b || b.type !== 'tool_use') continue;
      t.toolUseBlocks++;
      if (b.name === 'Task' || b.name === 'Agent') {
        t.agentsTotal++;
        const st = (b.input && b.input.subagent_type) || 'unspecified';
        t.agentsBreakdown[st] = (t.agentsBreakdown[st] || 0) + 1;
      }
    }

    const u = msg.usage;
    const id = msg.id;
    if (u && typeof u === 'object') {
      if (id && seenMessageIds.has(id)) continue; // usage already counted
      if (id) seenMessageIds.add(id);
      t.tokens.input += u.input_tokens || 0;
      t.tokens.output += u.output_tokens || 0;
      t.tokens.cache_read += u.cache_read_input_tokens || 0;
      t.tokens.cache_creation += u.cache_creation_input_tokens || 0;
    } else if (hasText) {
      t.usageMissing++;
    }
  }
  return t;
}

// ---------- Run ----------
const files = sessionFiles();
const total = freshTally();
for (const f of files) measureFile(f, total);

// Latest session measured on its own, so per-SESSION figures are separable
// from the aggregate. Not per-turn: a session runs to thousands of replies.
const latestFile = files[files.length - 1];
let latest = total;
if (files.length > 1) {
  seenMessageIds.clear();
  latest = measureFile(latestFile, freshTally());
}

const fmt = (n) => n.toLocaleString('en-SG');
const scope = allSessions ? `${files.length} session(s)` : path.basename(latestFile);

console.log(`# Transcript scope   : ${scope}`);
console.log(`# Project folders    : ${folderScope.length || 1}`);
for (const f of folderScope) {
  console.log(`#   ${path.basename(f.dir)}  ->  ${fmt(f.count)} session(s)`);
}
if (total.badLines) console.log(`# Warning: ${fmt(total.badLines)} unparseable line(s) skipped`);

if (wantSerial) {
  console.log(`serial_measured      : ${fmt(total.serial)}  (main-thread assistant text replies)`);
  console.log(`user_turns           : ${fmt(total.userTurns)}`);
  if (base) {
    console.log(`serial_base          : ${fmt(base)}  (rebase recorded in CLAUDE.md)`);
    if (total.serial < base) {
      console.log('serial_verdict       : PARTIAL CORPUS - measurement is BELOW the recorded');
      console.log('                       base, which is evidence this machine holds only some');
      console.log('                       of the transcripts, NOT that the count should drop.');
      console.log('                       Treat as unavailable: continue from the base plus the');
      console.log('                       replies since, and say which you used. Protocol SS1.');
      console.log(`next_serial          : unavailable (>= ${fmt(base + 1)}; carry forward)`);
    } else {
      console.log(`serial_rebased       : ${fmt(base + total.serial)}  (base + measured)`);
      console.log(`next_serial          : ${fmt(base + total.serial + 1)}`);
    }
  } else {
    console.log('serial_base          : none passed (--base <n>); result is corpus-relative only');
    console.log(`next_serial          : ${fmt(total.serial + 1)}  (no base - verify against CLAUDE.md)`);
  }
}

if (wantAgents) {
  console.log(`agents_total         : ${fmt(total.agentsTotal)}  (Task/Agent tool_use blocks)`);
  console.log(`tool_use_blocks_seen : ${fmt(total.toolUseBlocks)}`);
  const entries = Object.entries(total.agentsBreakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length) {
    console.log('agents_breakdown     :');
    for (const [k, v] of entries) console.log(`  ${k.padEnd(24)} ${fmt(v)}`);
  } else {
    console.log('agents_breakdown     : none');
  }
  console.log(`agents_latest_session: ${fmt(latest.agentsTotal)}  (per SESSION, not per turn)`);
}

if (wantTokens) {
  const tIn = total.tokens.input + total.tokens.cache_creation + total.tokens.cache_read;
  console.log(`tokens_input_uncached: ${fmt(total.tokens.input)}`);
  console.log(`tokens_cache_new     : ${fmt(total.tokens.cache_creation)}`);
  console.log(`tokens_cache_read    : ${fmt(total.tokens.cache_read)}`);
  console.log(`tokens_in_total      : ${fmt(tIn)}  (uncached + cache_new + cache_read)`);
  console.log(`tokens_output        : ${fmt(total.tokens.output)}`);
  console.log(`latest_session_in    : ${fmt(latest.tokens.input + latest.tokens.cache_creation + latest.tokens.cache_read)}`);
  console.log(`latest_session_out   : ${fmt(latest.tokens.output)}`);
  if (total.usageMissing) {
    console.log(
      `tokens_note          : ${fmt(total.usageMissing)} reply(ies) had no usage block - ` +
        'reported, not estimated'
    );
  }
}
