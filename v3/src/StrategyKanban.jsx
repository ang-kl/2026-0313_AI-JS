import React, { useEffect, useMemo, useRef, useState } from 'react'
import skillsetText from '../skillset.md?raw'
import goalText from '../goal/readme.md?raw'
import skillsText from '../skills/README.md?raw'
import reinventionText from '../script/v3-reinvention-implementation-spec.md?raw'
import pkg from '../package.json'

const STORAGE_KEY_PREFIX = 'v3.strategyKanban.fallback.v4.'
const WORKSPACE_KEY = 'v3.strategyKanban.workspace.v1'
const PRIMARY_BOARD_KEY = 'v3-skillset-storyboard'
const APP_VERSION = pkg.version || '3.0.000'

const workFiles = [
  { id: 'skillset', label: 'skillset.md', path: 'v3/skillset.md', text: skillsetText },
  { id: 'goal', label: 'goal/readme.md', path: 'v3/goal/readme.md', text: goalText },
  { id: 'skills', label: 'skills/README.md', path: 'v3/skills/README.md', text: skillsText },
  { id: 'reinvention', label: 'reinvention spec', path: 'v3/script/v3-reinvention-implementation-spec.md', text: reinventionText },
]

const defaultBoards = [
  { id: 'board-1', key: PRIMARY_BOARD_KEY, label: '1', name: 'V3 Storyboard Board' },
  { id: 'board-2', key: 'v3-storyboard-board-2', label: '2', name: 'Storyboard Board 2' },
  { id: 'board-3', key: 'v3-storyboard-board-3', label: '3', name: 'Storyboard Board 3' },
]

const defaultLanes = [
  { id: 'doctrine', position: 0, title: 'Doctrine', cue: 'What must stay true' },
  { id: 'ready', position: 1, title: 'Ready', cue: 'Ready to shape into UI' },
  { id: 'build', position: 2, title: 'Build next', cue: 'Storyboard the product' },
  { id: 'govern', position: 3, title: 'Governance', cue: 'Keep agentic risk visible' },
  { id: 'research', position: 4, title: 'Research / data', cue: 'Evidence before advice' },
  { id: 'decide', position: 5, title: 'Needs decision', cue: 'Choose before building' },
  { id: 'done', position: 6, title: 'Done', cue: 'Accepted direction' },
]

const seedCards = [
  ['north-star', 'doctrine', 'V3 north star', '0-1', 'Doctrine', 'Read a job ad as a work-system signal, not only a vacancy.', 'Every panel returns to apply, prepare, compare, redesign, agent candidate, or withhold.'],
  ['ethos', 'doctrine', 'Ethos as product test', '3', 'Values', 'Curiosity, collaboration, customer focus, first principles, breadth, systems, judgment.', 'Each new feature must name which ethos it serves and what it protects.'],
  ['deterministic-ideals', 'doctrine', 'Computed before explained', '5', 'Engine', 'Numbers come from deterministic code or verified data; LLMs narrate, not invent.', 'Every claim carries from MCF, computed, derived, AI estimate, unverified, or withheld.'],
  ['v2-inheritance', 'ready', 'Keep the V2 edge', 'Version 2', 'Continuity', 'Fast role read, ESCO skills, AI readiness, progression, crossover, comparison.', 'V3 must not bury the simple role answer under organisation theory.'],
  ['ten-c', 'ready', '10C role-reading ritual', 'Workflow', 'Workflow', 'Call, compact, cryptic, cross-reference, people, words, sentence, chain, lesson, outcome.', 'Use as the Ask-to-Decide reasoning path, not as decorative prompts.'],
  ['runtime-honesty', 'ready', 'Runtime honesty', '8', 'Runtime', 'OpenAI primary, Gemini fallback, DMM trace, provider disclosure.', 'Logs and UI disclose provider, fallback, deterministic step, and generated step.'],
  ['centre-map', 'build', 'Centre Map redesign', '13-14, 15.8', 'UI', 'RoleGraph and OrgGraph become the centre. Left floats. Right collapses.', 'On iPhone and iPad mini, the centre gets priority and side panels never crowd it.'],
  ['org-query', 'build', 'Organisation query mode', '15', 'Org', 'Typing DBS should mean: what is this organisation hiring for, building, governing, redesigning?', 'Company resolver, employer postings, function lanes, repeated duties, withhold floor.'],
  ['job-drawer', 'build', 'Floating job drawer', '10.5, 13.2', 'Evidence', 'Keep verbatim posting evidence close to the map as a movable drawer.', 'Source text is never lost while the user compares roles or organisation clusters.'],
  ['demand-proof', 'build', 'Demand-proof ranking', '7.5, 10.3, 13.5', 'Market', 'Split exact title, duty match, segment match, adjacent role, employer context.', 'A search like transformation shows title matches first, then responsibility and segment matches.'],
  ['ledger', 'govern', 'Decide as governance ledger', '6.7, 13.3', 'Govern', 'Decision, evidence, deterministic result, AI interpretation, risk, owner, allowed action.', 'No autonomous action appears deployable without owner, scope, audit, and stop condition.'],
  ['agent-identity', 'govern', 'Agent identity cards', '6.2-6.6', 'Agent', 'Every agent output names purpose, owner, evidence, limits, expiry, and whether LLM was used.', 'Agent candidate is visually distinct from deployable agent.'],
  ['aioe', 'research', 'AIOE backbone', '2.4, 5.7, 13.7', 'Data', 'SSOC to ISCO to SOC to AIOE, with lm2023, ig2023, agg2021, delta, confidence.', 'Missing chain means withhold, never silently convert missing exposure to zero.'],
  ['pro-worker', 'research', 'Pro-worker AI lens', '2.2, 4.10', 'Research', 'Prefer labor-augmenting, expertise-leveling, and new-task creating over blind automation.', 'High exposure triggers deeper reading, not fatalism.'],
  ['agent-count', 'decide', 'Are 11 agents too many?', '11, 19', 'Decision', 'Some seats may be real agents. Others may be deterministic checks or hidden review modes.', 'First release names essential seats, analysis-only seats, and deferred seats.'],
  ['withhold-floor', 'decide', 'Minimum evidence threshold', '10.3, 15.1, 19', 'Decision', 'Decide when visible postings are enough to show organisation-level claims.', 'Thin demand produces withheld or caveated cards, not confident advice.'],
  ['bpr-threshold', 'decide', 'When to recommend BPR', '4.4, 9.6, 15.6, 19', 'Decision', 'A BPR recommendation is strong; it needs enough evidence of friction or role mash-up.', 'Define the trigger from repeated duties, unclear ownership, handoff failure, or governance gap.'],
].map(([id, lane, title, source, kind, body, acceptance], position) => ({
  id, lane, position, title, source, kind, body, acceptance,
}))

const blankDraft = {
  id: '',
  lane: 'build',
  title: '',
  source: '',
  kind: 'Plan',
  body: '',
  acceptance: '',
}

function normaliseCards(list) {
  return [...list]
    .filter(card => card && card.id)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((card, index) => ({ ...card, position: index }))
}

function normaliseLanes(list) {
  const incoming = Array.isArray(list) ? list : []
  const source = incoming.length ? incoming : defaultLanes
  return source
    .filter(lane => lane && lane.id)
    .map((lane, index) => ({
      id: String(lane.id).replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `lane-${index}`,
      position: Number.isFinite(Number(lane.position)) ? Number(lane.position) : index,
      title: String(lane.title || 'New lane').trim().slice(0, 80),
      cue: String(lane.cue || 'Shape this lane').trim().slice(0, 140),
    }))
    .sort((a, b) => a.position - b.position)
    .map((lane, index) => ({ ...lane, position: index }))
}

function fallbackStorageKey(boardKey) {
  return `${STORAGE_KEY_PREFIX}${boardKey || PRIMARY_BOARD_KEY}`
}

function normaliseBoards(list) {
  const incoming = Array.isArray(list) ? list : []
  const byId = new Map(incoming.filter(board => board && board.id).map(board => [board.id, board]))
  const mergedDefaults = defaultBoards.map(base => ({
    ...base,
    ...(byId.get(base.id) || {}),
    key: base.key,
    label: base.label,
    name: base.name,
  }))
  const extras = incoming
    .filter(board => board && board.id && !defaultBoards.some(base => base.id === board.id))
    .map((board, index) => ({
      id: String(board.id),
      key: String(board.key || `v3-storyboard-${board.id}`).replace(/[^a-z0-9-]/gi, '-').slice(0, 80),
      label: String(board.label || index + defaultBoards.length + 1).slice(0, 4),
      name: String(board.name || `Storyboard Board ${index + defaultBoards.length + 1}`).slice(0, 80),
    }))
  return [...mergedDefaults, ...extras]
}

function normaliseSourceFiles(list) {
  const incoming = Array.isArray(list) ? list : []
  const extras = incoming
    .filter(file => file && file.id && !workFiles.some(base => base.id === file.id))
    .map((file, index) => ({
      id: String(file.id || `source-${Date.now()}-${index}`),
      label: String(file.label || 'Imported source').slice(0, 80),
      path: String(file.path || file.label || 'imported source').slice(0, 180),
      text: String(file.text || ''),
    }))
  return [...workFiles, ...extras]
}

function emptyBoard() {
  return { cards: [], deletedCards: [], lanes: defaultLanes }
}

function loadFallback(boardKey = PRIMARY_BOARD_KEY) {
  try {
    const raw = window.localStorage.getItem(fallbackStorageKey(boardKey))
    if (!raw) return boardKey === PRIMARY_BOARD_KEY ? { cards: seedCards, deletedCards: [], lanes: defaultLanes } : emptyBoard()
    const parsed = JSON.parse(raw)
    return {
      cards: Array.isArray(parsed.cards) ? parsed.cards : seedCards,
      deletedCards: Array.isArray(parsed.deletedCards) ? parsed.deletedCards : [],
      lanes: normaliseLanes(parsed.lanes),
    }
  } catch (_) {
    return boardKey === PRIMARY_BOARD_KEY ? { cards: seedCards, deletedCards: [], lanes: defaultLanes } : emptyBoard()
  }
}

function saveFallback(boardKey, cards, deletedCards, lanes = defaultLanes) {
  try {
    window.localStorage.setItem(fallbackStorageKey(boardKey), JSON.stringify({ cards, deletedCards, lanes }))
  } catch (_) {}
}

function loadWorkspace() {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw)
    const sourceFiles = normaliseSourceFiles(parsed.sourceFiles)
    return {
      workOpen: parsed.workOpen !== false,
      inspectorOpen: parsed.inspectorOpen !== false,
      activeFileId: sourceFiles.some(file => file.id === parsed.activeFileId) ? parsed.activeFileId : 'skillset',
      activeBoardId: parsed.activeBoardId || 'board-1',
      boards: normaliseBoards(parsed.boards),
      laneWidths: parsed.laneWidths && typeof parsed.laneWidths === 'object' ? parsed.laneWidths : {},
      sourceFiles,
    }
  } catch (_) {
    return {
      workOpen: true,
      inspectorOpen: true,
      activeFileId: 'skillset',
      activeBoardId: 'board-1',
      boards: normaliseBoards(defaultBoards),
      laneWidths: {},
      sourceFiles: workFiles,
    }
  }
}

function saveWorkspace(state) {
  try {
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(state))
  } catch (_) {}
}

async function planningApi(payload) {
  const res = await fetch('/api/planning', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

function cardCount(cards, laneId) {
  return cards.filter(card => card.lane === laneId).length
}

function excerptTitle(text) {
  const first = text.split('\n').map(line => line.trim()).find(Boolean) || 'Skillset excerpt'
  return first.replace(/^#+\s*/, '').slice(0, 74)
}

function makeCardId() {
  return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `card-${Date.now()}`
}

function laneCode(title = '') {
  return String(title || 'Lane')
    .replace(/[^a-z0-9 ]/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.slice(0, 3).toUpperCase())
    .join('') || 'LAN'
}

function markerForCard(card, lanes, cards) {
  return markerMetaForCard(card, lanes, cards).label
}

function markerMetaForCard(card, lanes, cards) {
  const laneIndex = Math.max(0, lanes.findIndex(lane => lane.id === card.lane)) + 1
  const lane = lanes[laneIndex - 1] || { title: card.lane }
  const laneCards = cards.filter(item => item.lane === card.lane).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const cardIndex = Math.max(0, laneCards.findIndex(item => item.id === card.id)) + 1
  const code = laneCode(lane.title)
  return {
    cardId: card.id,
    laneId: card.lane,
    laneCode: code,
    laneNumber: laneIndex,
    cardNumber: cardIndex,
    tone: (laneIndex - 1) % 8,
    label: `${code} №${laneIndex}.${String(cardIndex).padStart(2, '0')}`,
  }
}

function markerForLane(lane, lanes) {
  const laneIndex = Math.max(0, lanes.findIndex(item => item.id === lane.id)) + 1
  return {
    laneId: lane.id,
    laneCode: laneCode(lane.title),
    laneNumber: laneIndex,
    tone: (laneIndex - 1) % 8,
    label: `${laneCode(lane.title)} №${laneIndex}`,
  }
}

function slugFileName(value = 'v3-kanban') {
  return String(value || 'v3-kanban')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'v3-kanban'
}

function downloadTextFile(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function boardToMarkdown({ board, lanes, cards, activeFile, version }) {
  const orderedLanes = normaliseLanes(lanes)
  const orderedCards = normaliseCards(cards)
  const lines = [
    '# V3 Storyboard Kanban',
    '',
    `Board: ${board.name}`,
    `Board key: ${board.key}`,
    `Version: ${version}`,
    `Source: ${activeFile.path}`,
    `Saved at: ${new Date().toISOString()}`,
    '',
    'This file is intentionally readable. Upload it back into /plan/kanban with "Open board" to restore the board.',
    '',
  ]

  orderedLanes.forEach((lane) => {
    const laneCards = orderedCards.filter(card => card.lane === lane.id)
    lines.push(`## Lane: ${lane.title}`)
    lines.push(`Lane id: ${lane.id}`)
    lines.push(`Cue: ${lane.cue}`)
    lines.push('')
    if (!laneCards.length) {
      lines.push('_No cards in this lane._')
      lines.push('')
      return
    }
    laneCards.forEach((card) => {
      lines.push(`### Card: ${card.title}`)
      lines.push(`Card id: ${card.id}`)
      lines.push(`Kind: ${card.kind || ''}`)
      lines.push(`Source: ${card.source || ''}`)
      lines.push('Body:')
      lines.push(card.body || '')
      lines.push('')
      lines.push('Acceptance:')
      lines.push(card.acceptance || '')
      lines.push('')
    })
  })
  return `${lines.join('\n').replace(/\n{4,}/g, '\n\n\n')}\n`
}

function parseReadableBoardMarkdown(text) {
  const lines = String(text || '').split(/\r?\n/)
  const lanes = []
  const cards = []
  let currentLane = null
  let currentCard = null
  let field = ''

  function finishCard() {
    if (!currentCard || !currentLane) return
    const card = {
      ...currentCard,
      lane: currentLane.id,
      title: String(currentCard.title || 'Untitled card').trim(),
      body: String(currentCard.body || '').trim(),
      acceptance: String(currentCard.acceptance || '').trim(),
      position: cards.filter(item => item.lane === currentLane.id).length,
    }
    cards.push(card)
    currentCard = null
    field = ''
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const laneMatch = line.match(/^## Lane:\s*(.+)$/)
    if (laneMatch) {
      finishCard()
      currentLane = {
        id: `lane-${lanes.length + 1}-${slugFileName(laneMatch[1])}`,
        position: lanes.length,
        title: laneMatch[1].trim() || `Lane ${lanes.length + 1}`,
        cue: 'Imported from readable storyboard file',
      }
      lanes.push(currentLane)
      continue
    }
    if (!currentLane) continue

    const laneIdMatch = line.match(/^Lane id:\s*(.+)$/)
    if (laneIdMatch && !currentCard) {
      currentLane.id = slugFileName(laneIdMatch[1]) || currentLane.id
      continue
    }
    const cueMatch = line.match(/^Cue:\s*(.*)$/)
    if (cueMatch && !currentCard) {
      currentLane.cue = cueMatch[1].trim() || currentLane.cue
      continue
    }

    const cardMatch = line.match(/^### Card:\s*(.+)$/)
    if (cardMatch) {
      finishCard()
      currentCard = {
        id: makeCardId(),
        title: cardMatch[1].trim() || 'Untitled card',
        source: '',
        kind: 'Imported',
        body: '',
        acceptance: '',
      }
      field = ''
      continue
    }
    if (!currentCard) continue

    const cardIdMatch = line.match(/^Card id:\s*(.+)$/)
    if (cardIdMatch) {
      currentCard.id = cardIdMatch[1].trim() || currentCard.id
      field = ''
      continue
    }
    const kindMatch = line.match(/^Kind:\s*(.*)$/)
    if (kindMatch) {
      currentCard.kind = kindMatch[1].trim() || 'Imported'
      field = ''
      continue
    }
    const sourceMatch = line.match(/^Source:\s*(.*)$/)
    if (sourceMatch) {
      currentCard.source = sourceMatch[1].trim()
      field = ''
      continue
    }
    if (line === 'Body:') {
      field = 'body'
      continue
    }
    if (line === 'Acceptance:') {
      field = 'acceptance'
      continue
    }
    if (field === 'body') currentCard.body += `${currentCard.body ? '\n' : ''}${line}`
    if (field === 'acceptance') currentCard.acceptance += `${currentCard.acceptance ? '\n' : ''}${line}`
  }
  finishCard()
  return {
    lanes: lanes.length ? normaliseLanes(lanes) : defaultLanes,
    cards: normaliseCards(cards),
  }
}

function scoreBlockAgainstCard(text, card) {
  const haystack = `${card.title || ''} ${card.body || ''} ${card.acceptance || ''} ${card.kind || ''}`.toLowerCase()
  const tokens = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 4)
    .slice(0, 20)
  if (!tokens.length) return 0
  return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0)
}

function annotatedSourceBlocks(text, cards, lanes) {
  const orderedCards = normaliseCards(cards)
  return String(text || '').split('\n').map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return { id: `line-${index}`, text: line, marker: '' }
    let best = orderedCards[0] || null
    let bestScore = 0
    for (const card of orderedCards) {
      const score = scoreBlockAgainstCard(trimmed, card)
      if (score > bestScore) {
        best = card
        bestScore = score
      }
    }
    if (!best && orderedCards.length) best = orderedCards[index % orderedCards.length]
    if (bestScore === 0 && orderedCards.length) best = orderedCards[index % orderedCards.length]
    return {
      id: `line-${index}`,
      text: line,
      marker: best ? markerMetaForCard(best, lanes, orderedCards) : null,
    }
  })
}

export default function StrategyKanban() {
  const workspace = useMemo(loadWorkspace, [])
  const activeInitialBoard = normaliseBoards(workspace.boards).find(board => board.id === workspace.activeBoardId) || defaultBoards[0]
  const fallback = useMemo(() => loadFallback(activeInitialBoard.key), [activeInitialBoard.key])
  const [lanes, setLanes] = useState(fallback.lanes)
  const [cards, setCards] = useState(fallback.cards)
  const [deletedCards, setDeletedCards] = useState(fallback.deletedCards)
  const [workOpen, setWorkOpen] = useState(workspace.workOpen)
  const [inspectorOpen, setInspectorOpen] = useState(workspace.inspectorOpen)
  const [activeFileId, setActiveFileId] = useState(workspace.activeFileId)
  const [sourceFiles, setSourceFiles] = useState(normaliseSourceFiles(workspace.sourceFiles))
  const [boards, setBoards] = useState(normaliseBoards(workspace.boards))
  const [activeBoardId, setActiveBoardId] = useState(workspace.activeBoardId)
  const [boardMenu, setBoardMenu] = useState(null)
  const [laneWidths, setLaneWidths] = useState(workspace.laneWidths)
  const [storage, setStorage] = useState('loading')
  const [message, setMessage] = useState('Opening planning board...')
  const [draggingId, setDraggingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(blankDraft)
  const [editorOpen, setEditorOpen] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [excerptToolsOpen, setExcerptToolsOpen] = useState(false)
  const [editingLaneId, setEditingLaneId] = useState('')
  const [laneDraft, setLaneDraft] = useState({ title: '', cue: '' })
  const [shortcutMenu, setShortcutMenu] = useState(null)
  const [laneMenu, setLaneMenu] = useState(null)
  const [selectedLaneId, setSelectedLaneId] = useState('')
  const [textScale, setTextScale] = useState(1)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [printMode, setPrintMode] = useState(false)
  const selectionTimerRef = useRef(null)
  const sourceFileInputRef = useRef(null)
  const boardFileInputRef = useRef(null)

  const selectedCard = useMemo(
    () => cards.find(card => card.id === selectedId) || null,
    [cards, selectedId],
  )
  const activeFile = useMemo(
    () => sourceFiles.find(file => file.id === activeFileId) || sourceFiles[0] || workFiles[0],
    [sourceFiles, activeFileId],
  )
  const activeBoard = useMemo(
    () => boards.find(board => board.id === activeBoardId) || boards[0] || defaultBoards[0],
    [boards, activeBoardId],
  )
  const sourceBlocks = useMemo(
    () => annotatedSourceBlocks(activeFile.text, cards, lanes),
    [activeFile.text, cards, lanes],
  )
  const saveLocation = storage === 'database'
    ? `/api/planning -> ${activeBoard.key}`
    : `localStorage:${fallbackStorageKey(activeBoard.key)}`
  const totalCards = cards.length
  const statusTime = lastSavedAt ? new Date(lastSavedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'not saved this session'

  function boardApi(payload) {
    return planningApi({ ...payload, boardKey: activeBoard.key, boardTitle: activeBoard.name })
  }

  useEffect(() => {
    let alive = true
    setSelectedId(null)
    setEditorOpen(false)
    setStorage('loading')
    const local = loadFallback(activeBoard.key)
    setCards(normaliseCards(local.cards || []))
    setDeletedCards(local.deletedCards || [])
    setLanes(normaliseLanes(local.lanes || []))
    setMessage(`Opening ${activeBoard.name}...`)
    planningApi({ action: 'list', boardKey: activeBoard.key, boardTitle: activeBoard.name })
      .then(data => {
        if (!alive) return
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setLanes(normaliseLanes(data.lanes || []))
          setStorage(data.storage || 'database')
          setLastSavedAt(Date.now())
          setMessage(`${activeBoard.name} saved to planning database.`)
        } else {
          setStorage('local')
          setLastSavedAt(null)
          setMessage(`${activeBoard.name} is using local draft until DB is available.`)
        }
      })
      .catch(() => {
        if (!alive) return
        setStorage('local')
        setLastSavedAt(null)
        setMessage(`${activeBoard.name} is using local draft until DB is available.`)
      })
    return () => { alive = false }
  }, [activeBoard.key, activeBoard.name])

  useEffect(() => {
    function closeMenu(event) {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      setShortcutMenu(null)
      setBoardMenu(null)
      setLaneMenu(null)
    }
    window.addEventListener('click', closeMenu)
    window.addEventListener('keydown', closeMenu)
    return () => {
      if (selectionTimerRef.current) window.clearTimeout(selectionTimerRef.current)
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('keydown', closeMenu)
    }
  }, [])

  useEffect(() => {
    saveWorkspace({ workOpen, inspectorOpen, activeFileId, boards, activeBoardId, laneWidths, sourceFiles })
  }, [workOpen, inspectorOpen, activeFileId, boards, activeBoardId, laneWidths, sourceFiles])

  async function syncBoard(nextCards, note) {
    const ordered = normaliseCards(nextCards)
    setCards(ordered)
    if (storage === 'database') {
      try {
        const data = await boardApi({
          action: 'saveOrder',
          cards: ordered.map(({ id, lane, position }) => ({ id, lane, position })),
        })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || ordered))
          setDeletedCards(data.deletedCards || deletedCards)
          setLastSavedAt(Date.now())
          setMessage(note || 'Board saved to database.')
          return
        }
      } catch (_) {}
      setMessage('Move kept on screen, but database save failed.')
      return
    }
    saveFallback(activeBoard.key, ordered, deletedCards, lanes)
    setLastSavedAt(Date.now())
    setMessage(note || 'Saved locally.')
  }

  function moveCard(cardId, laneId, beforeId = null) {
    const moving = cards.find(card => card.id === cardId)
    if (!moving) return
    const without = cards.filter(card => card.id !== cardId)
    const moved = { ...moving, lane: laneId }
    let next = []
    if (beforeId) {
      for (const card of without) {
        if (card.id === beforeId) next.push(moved)
        next.push(card)
      }
      if (!next.some(card => card.id === moved.id)) next.push(moved)
    } else {
      next = [...without, moved]
    }
    setSelectedId(cardId)
    syncBoard(next, 'Card position saved.')
  }

  async function persistInsertedCard(card, nextCards, note) {
    const ordered = normaliseCards(nextCards)
    setCards(ordered)
    setSelectedId(card.id)
    if (storage === 'database') {
      try {
        const saved = await boardApi({ action: 'saveCard', card: { ...card, position: ordered.find(item => item.id === card.id)?.position ?? card.position } })
        if (saved && saved.ok) {
          const orderedAfterSave = normaliseCards(ordered)
            const moved = await boardApi({
            action: 'saveOrder',
            cards: orderedAfterSave.map(({ id, lane, position }) => ({ id, lane, position })),
          })
          if (moved && moved.ok) {
            setCards(normaliseCards(moved.cards || orderedAfterSave))
            setDeletedCards(moved.deletedCards || deletedCards)
            setLastSavedAt(Date.now())
            setMessage(note)
            return
          }
        }
      } catch (_) {}
      setMessage('Card created on screen, but database save failed.')
      saveFallback(activeBoard.key, ordered, deletedCards, lanes)
      setLastSavedAt(Date.now())
      return
    }
    saveFallback(activeBoard.key, ordered, deletedCards, lanes)
    setLastSavedAt(Date.now())
    setMessage(note)
  }

  function insertCardNear(cardId, side = 'after') {
    const target = cards.find(card => card.id === cardId)
    if (!target) return
    const card = {
      ...blankDraft,
      id: makeCardId(),
      lane: target.lane,
      title: side === 'before' ? 'Card before' : 'Card after',
      kind: 'Plan',
      source: target.source || '',
      body: '',
      acceptance: 'Shape this card from the nearby storyboard context.',
    }
    const next = []
    for (const item of cards) {
      if (item.id === cardId && side === 'before') next.push(card)
      next.push(item)
      if (item.id === cardId && side === 'after') next.push(card)
    }
    persistInsertedCard(card, next, side === 'before' ? 'Card inserted before.' : 'Card inserted after.')
    setShortcutMenu(null)
  }

  function duplicateCard(cardId) {
    const target = cards.find(card => card.id === cardId)
    if (!target) return
    const card = {
      ...target,
      id: makeCardId(),
      title: `${target.title} copy`.slice(0, 140),
      position: target.position + 1,
    }
    const next = []
    for (const item of cards) {
      next.push(item)
      if (item.id === cardId) next.push(card)
    }
    persistInsertedCard(card, next, 'Card duplicated.')
    setShortcutMenu(null)
  }

  function newNoteFromCard(cardId) {
    const target = cards.find(card => card.id === cardId)
    if (!target) return
    const card = {
      ...blankDraft,
      id: makeCardId(),
      lane: target.lane,
      title: `Note: ${target.title}`.slice(0, 140),
      source: target.source || 'kanban',
      kind: 'Note',
      body: target.body,
      acceptance: 'Turn this note into a storyboard card or merge it back into the source card.',
    }
    const next = []
    for (const item of cards) {
      next.push(item)
      if (item.id === cardId) next.push(card)
    }
    persistInsertedCard(card, next, 'Note created from card.')
    setShortcutMenu(null)
  }

  function moveCardToEdge(cardId, edge) {
    const target = cards.find(card => card.id === cardId)
    if (!target) return
    const without = cards.filter(card => card.id !== cardId)
    const next = []
    let inserted = false
    if (edge === 'top') {
      for (const card of without) {
        if (!inserted && card.lane === target.lane) {
          next.push(target)
          inserted = true
        }
        next.push(card)
      }
      if (!inserted) next.push(target)
    } else {
      for (const card of without) {
        next.push(card)
        if (card.lane === target.lane) inserted = true
      }
      const lastSameLane = next.map(card => card.lane).lastIndexOf(target.lane)
      if (lastSameLane >= 0) next.splice(lastSameLane + 1, 0, target)
      else next.push(target)
    }
    syncBoard(next, edge === 'top' ? 'Card moved to top.' : 'Card moved to bottom.')
    setShortcutMenu(null)
  }

  function copyCardLink(cardId) {
    const url = `${window.location.origin}${window.location.pathname}#card-${cardId}`
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {})
    }
    setMessage('Card link copied.')
    setShortcutMenu(null)
  }

  function openShortcutMenu(event, cardId) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(cardId)
    setShortcutMenu({
      cardId,
      x: Math.min(event.clientX || 0, window.innerWidth - 260),
      y: Math.min(event.clientY || 0, window.innerHeight - 360),
    })
  }

  function openBoardMenu(event, boardId) {
    event.preventDefault()
    event.stopPropagation()
    setActiveBoardId(boardId)
    setBoardMenu({
      boardId,
      x: Math.min(event.clientX || 0, window.innerWidth - 236),
      y: Math.min(event.clientY || 0, window.innerHeight - 220),
    })
  }

  function openLaneMenu(event, laneId) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedLaneId(laneId)
    setSelectedId(null)
    setLaneMenu({
      laneId,
      x: Math.min(event.clientX || 0, window.innerWidth - 260),
      y: Math.min(event.clientY || 0, window.innerHeight - 330),
    })
  }

  function openLaneMenuFromButton(event, laneId) {
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setSelectedLaneId(laneId)
    setSelectedId(null)
    setLaneMenu({
      laneId,
      x: Math.min(rect.left, window.innerWidth - 260),
      y: Math.min(rect.bottom + 6, window.innerHeight - 330),
    })
  }

  function selectLane(laneId) {
    setSelectedLaneId(selectedLaneId === laneId ? '' : laneId)
    setSelectedId(null)
  }

  function changeTextScale(delta) {
    setTextScale(current => Math.max(0.86, Math.min(1.18, Number((current + delta).toFixed(2)))))
  }

  function createBoard() {
    const nextNumber = boards.length + 1
    const id = `board-${Date.now()}`
    const board = { id, key: `v3-storyboard-${id}`, label: String(nextNumber), name: `Storyboard Board ${nextNumber}` }
    setBoards([...boards, board])
    setActiveBoardId(board.id)
    setBoardMenu(null)
    setMessage('Board icon created.')
  }

  function duplicateBoard(boardId) {
    const board = boards.find(item => item.id === boardId)
    if (!board) return
    const id = `board-${Date.now()}`
    const copy = { id, key: `v3-storyboard-${id}`, label: `${board.label}'`, name: `${board.name} copy` }
    setBoards([...boards, copy])
    setActiveBoardId(copy.id)
    setBoardMenu(null)
    setMessage('Board icon duplicated.')
  }

  function deleteBoard(boardId) {
    if (boards.length <= 1) {
      setMessage('Keep at least one board icon.')
      setBoardMenu(null)
      return
    }
    const nextBoards = boards.filter(board => board.id !== boardId)
    setBoards(nextBoards)
    if (activeBoardId === boardId) setActiveBoardId(nextBoards[0].id)
    setBoardMenu(null)
    setMessage('Board icon deleted.')
  }

  function resizeLane(laneId, delta) {
    setLaneWidths(current => {
      const width = Math.max(220, Math.min(680, Number(current[laneId] || 312) + delta))
      return { ...current, [laneId]: width }
    })
  }

  function openNewCard(lane = 'build') {
    setDraft({ ...blankDraft, lane })
    setSelectedId(null)
    setEditorOpen(true)
  }

  function openCardFromExcerpt(text = excerpt) {
    const cleanText = text.trim()
    if (!cleanText) return
    setDraft({
      ...blankDraft,
      lane: selectedCard?.lane || 'build',
      title: excerptTitle(cleanText),
      source: activeFile.label,
      kind: 'Excerpt',
      body: cleanText,
      acceptance: 'Review this excerpt and decide whether it becomes doctrine, build work, governance, research, or an open decision.',
    })
    setEditorOpen(true)
    setExcerptToolsOpen(false)
  }

  function openEdit(card) {
    setDraft({ ...card })
    setSelectedId(card.id)
    setEditorOpen(true)
  }

  async function saveCard(event) {
    event.preventDefault()
    const id = draft.id || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `card-${Date.now()}`)
    const card = {
      ...blankDraft,
      ...draft,
      id,
      title: draft.title.trim() || 'Untitled card',
      position: draft.position ?? cards.length,
    }
    if (storage === 'database') {
      try {
        const data = await boardApi({ action: 'saveCard', card })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(data.card && data.card.id ? data.card.id : id)
          setEditorOpen(false)
          setLastSavedAt(Date.now())
          setMessage('Card saved to planning database.')
          return
        }
      } catch (_) {}
      setMessage('Database save failed. Card kept locally for this browser.')
    }
    const next = normaliseCards([...cards.filter(item => item.id !== id), card])
    setCards(next)
    saveFallback(activeBoard.key, next, deletedCards, lanes)
    setLastSavedAt(Date.now())
    setSelectedId(id)
    setEditorOpen(false)
  }

  async function saveCardRecord(card, successMessage = 'Card saved to planning database.') {
    if (storage === 'database') {
      try {
        const data = await boardApi({ action: 'saveCard', card })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(card.id)
          setLastSavedAt(Date.now())
          setMessage(successMessage)
          return
        }
      } catch (_) {}
      setMessage('Database save failed. Card kept locally for this browser.')
    }
    const next = normaliseCards([...cards.filter(item => item.id !== card.id), card])
    setCards(next)
    saveFallback(activeBoard.key, next, deletedCards, lanes)
    setLastSavedAt(Date.now())
    setSelectedId(card.id)
    setMessage('Saved locally.')
  }

  function appendExcerptToSelected() {
    const cleanText = excerpt.trim()
    if (!cleanText || !selectedCard) return
    const nextCard = {
      ...selectedCard,
      source: selectedCard.source || 'skillset.md',
      body: `${selectedCard.body || ''}${selectedCard.body ? '\n\n' : ''}${cleanText}`,
    }
    saveCardRecord(nextCard, 'Excerpt appended to selected card.')
    setExcerptToolsOpen(false)
  }

  function copyExcerpt() {
    const cleanText = excerpt.trim()
    if (!cleanText) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanText).catch(() => {})
    }
    setMessage('Excerpt ready to copy or add to a card.')
  }

  function copySourcePath() {
    const path = activeFile.path
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(path).catch(() => {})
    }
    setMessage(`${activeFile.label} path copied.`)
  }

  function focusCardFromSource(cardId) {
    const card = cards.find(item => item.id === cardId)
    if (!card) return
    setSelectedId(cardId)
    setSelectedLaneId(card.lane)
    setInspectorOpen(true)
    window.setTimeout(() => {
      document.getElementById(`card-${cardId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }, 40)
    setMessage(`Source reference opened ${markerForCard(card, lanes, cards)}.`)
  }

  function focusSourceFromCard(cardId) {
    setWorkOpen(true)
    setSelectedId(cardId)
    window.setTimeout(() => {
      const target = Array.from(document.querySelectorAll('[data-source-card-id]'))
        .find(node => node.getAttribute('data-source-card-id') === cardId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        target.classList.add('source-linked-flash')
        window.setTimeout(() => target.classList.remove('source-linked-flash'), 1400)
        setMessage('Card reference opened its source marker.')
      } else {
        setMessage('No source marker found for this card in the current source file.')
      }
    }, 80)
  }

  async function importSourceFile(event) {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const id = `source-${Date.now()}`
      const imported = {
        id,
        label: file.name,
        path: file.webkitRelativePath || file.name,
        text,
      }
      setSourceFiles(current => normaliseSourceFiles([...current, imported]))
      setActiveFileId(id)
      setMessage(`${file.name} opened in the working drawer.`)
    } catch (_) {
      setMessage('Could not read that source file.')
    } finally {
      event.target.value = ''
    }
  }

  function resetSourceFile() {
    setSourceFiles(workFiles)
    setActiveFileId('skillset')
    setMessage('Source files reset to bundled V3 files.')
  }

  function exportBoardMarkdown() {
    const markdown = boardToMarkdown({ board: activeBoard, lanes, cards, activeFile, version: APP_VERSION })
    downloadTextFile(`${slugFileName(activeBoard.name)}-storyboard.md`, markdown, 'text/markdown')
    setMessage('Readable storyboard Markdown downloaded.')
  }

  function exportBoardJson() {
    const payload = {
      format: 'v3.strategyKanban.board',
      version: APP_VERSION,
      savedAt: new Date().toISOString(),
      board: activeBoard,
      lanes: normaliseLanes(lanes),
      cards: normaliseCards(cards),
      deletedCards,
      sourceFiles,
      activeFileId,
    }
    downloadTextFile(`${slugFileName(activeBoard.name)}-board.json`, JSON.stringify(payload, null, 2), 'application/json')
    setMessage('Board JSON backup downloaded.')
  }

  function exportSourceMarkdown() {
    const extension = activeFile.label.toLowerCase().endsWith('.txt') ? 'txt' : 'md'
    downloadTextFile(`${slugFileName(activeFile.label)}.${extension}`, activeFile.text || '', extension === 'md' ? 'text/markdown' : 'text/plain')
    setMessage(`${activeFile.label} downloaded.`)
  }

  async function importBoardFile(event) {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      let nextLanes = []
      let nextCards = []
      let nextDeletedCards = []
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text)
        nextLanes = normaliseLanes(parsed.lanes || [])
        nextCards = normaliseCards(parsed.cards || [])
        nextDeletedCards = Array.isArray(parsed.deletedCards) ? parsed.deletedCards : []
        if (Array.isArray(parsed.sourceFiles)) setSourceFiles(normaliseSourceFiles(parsed.sourceFiles))
        if (parsed.activeFileId) setActiveFileId(parsed.activeFileId)
      } else {
        const parsed = parseReadableBoardMarkdown(text)
        nextLanes = parsed.lanes
        nextCards = parsed.cards
      }
      setLanes(nextLanes)
      setCards(nextCards)
      setDeletedCards(nextDeletedCards)
      saveFallback(activeBoard.key, nextCards, nextDeletedCards, nextLanes)
      setLastSavedAt(Date.now())
      setSelectedId(null)
      setSelectedLaneId('')
      setMessage(`${file.name} loaded into this board. Save/export again when ready.`)
    } catch (_) {
      setMessage('Could not load that board file. Use the exported storyboard .md or board .json format.')
    } finally {
      event.target.value = ''
    }
  }

  async function deleteCard(cardId) {
    const card = cards.find(item => item.id === cardId)
    if (!card) return
    if (storage === 'database') {
      try {
        const data = await boardApi({ action: 'deleteCard', id: cardId })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(null)
          setEditorOpen(false)
          setLastSavedAt(Date.now())
          setMessage('Card deleted. It can be restored from Deleted.')
          return
        }
      } catch (_) {}
    }
    const next = cards.filter(item => item.id !== cardId)
    const deleted = [{ ...card, deletedAt: new Date().toISOString() }, ...deletedCards]
    setCards(next)
    setDeletedCards(deleted)
    saveFallback(activeBoard.key, next, deleted, lanes)
    setLastSavedAt(Date.now())
    setSelectedId(null)
    setEditorOpen(false)
  }

  async function restoreCard(cardId) {
    const card = deletedCards.find(item => item.id === cardId)
    if (!card) return
    if (storage === 'database') {
      try {
        const data = await boardApi({ action: 'restoreCard', id: cardId, lane: card.lane || 'decide' })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(cardId)
          setLastSavedAt(Date.now())
          setMessage('Card restored from Deleted.')
          return
        }
      } catch (_) {}
    }
    const next = normaliseCards([...cards, { ...card, deletedAt: null }])
    const deleted = deletedCards.filter(item => item.id !== cardId)
    setCards(next)
    setDeletedCards(deleted)
    saveFallback(activeBoard.key, next, deleted, lanes)
    setLastSavedAt(Date.now())
    setSelectedId(cardId)
  }

  function resetLocalDraft() {
    setCards(seedCards)
    setDeletedCards([])
    setLanes(defaultLanes)
    const nextCards = activeBoard.key === PRIMARY_BOARD_KEY ? seedCards : []
    setCards(nextCards)
    saveFallback(activeBoard.key, nextCards, [], defaultLanes)
    setLastSavedAt(Date.now())
    setMessage(`${activeBoard.name} local draft reset. Database cards are untouched.`)
  }

  function openLaneEdit(lane) {
    setEditingLaneId(lane.id)
    setLaneDraft({ title: lane.title || '', cue: lane.cue || '' })
  }

  async function saveLaneHeader(event) {
    event.preventDefault()
    if (!editingLaneId) return
    const nextLanes = normaliseLanes(lanes.map(lane => (
      lane.id === editingLaneId
        ? {
            ...lane,
            title: laneDraft.title.trim() || lane.title,
            cue: laneDraft.cue.trim() || lane.cue,
          }
        : lane
    )))
    setLanes(nextLanes)
    setEditingLaneId('')
    setLaneDraft({ title: '', cue: '' })
    if (storage === 'database') {
      try {
        const data = await boardApi({ action: 'saveLanes', lanes: nextLanes })
        if (data && data.ok) {
          setLanes(normaliseLanes(data.lanes || nextLanes))
          setLastSavedAt(Date.now())
          setMessage('Lane header saved to planning database.')
          return
        }
      } catch (_) {}
      setMessage('Lane header kept on screen, but database save failed.')
      saveFallback(activeBoard.key, cards, deletedCards, nextLanes)
      setLastSavedAt(Date.now())
      return
    }
    saveFallback(activeBoard.key, cards, deletedCards, nextLanes)
    setLastSavedAt(Date.now())
    setMessage('Lane header saved locally.')
  }

  async function persistLanes(nextLanes, nextCards = cards, note = 'Lane layout saved.') {
    const ordered = normaliseLanes(nextLanes)
    setLanes(ordered)
    setCards(normaliseCards(nextCards))
    if (storage === 'database') {
      try {
        const data = await boardApi({ action: 'saveLanes', lanes: ordered })
        if (data && data.ok) {
          const afterLaneSave = normaliseLanes(data.lanes || ordered)
          if (nextCards !== cards) {
            const moved = await boardApi({
              action: 'saveOrder',
              cards: normaliseCards(nextCards).map(({ id, lane, position }) => ({ id, lane, position })),
            })
            if (moved && moved.ok) {
              setLanes(normaliseLanes(moved.lanes || afterLaneSave))
              setCards(normaliseCards(moved.cards || nextCards))
              setDeletedCards(moved.deletedCards || deletedCards)
              setLastSavedAt(Date.now())
              setMessage(note)
              return
            }
          }
          setLanes(afterLaneSave)
          setCards(normaliseCards(data.cards || nextCards))
          setDeletedCards(data.deletedCards || deletedCards)
          setLastSavedAt(Date.now())
          setMessage(note)
          return
        }
      } catch (_) {}
      setMessage('Lane change kept on screen, but database save failed.')
      saveFallback(activeBoard.key, nextCards, deletedCards, ordered)
      setLastSavedAt(Date.now())
      return
    }
    saveFallback(activeBoard.key, nextCards, deletedCards, ordered)
    setLastSavedAt(Date.now())
    setMessage(note)
  }

  function createLane(afterId = '') {
    const index = afterId ? lanes.findIndex(lane => lane.id === afterId) + 1 : lanes.length
    const id = `lane-${Date.now()}`
    const lane = { id, position: index, title: 'New lane', cue: 'Shape this lane' }
    const next = [...lanes]
    next.splice(Math.max(0, index), 0, lane)
    persistLanes(next, cards, 'Lane created.')
  }

  function duplicateLane(laneId) {
    const lane = lanes.find(item => item.id === laneId)
    if (!lane) return
    const index = lanes.findIndex(item => item.id === laneId) + 1
    const id = `lane-${Date.now()}`
    const copy = { ...lane, id, title: `${lane.title} copy`.slice(0, 80), cue: lane.cue || 'Copied lane' }
    const nextLanes = [...lanes]
    nextLanes.splice(index, 0, copy)
    persistLanes(nextLanes, cards, 'Lane duplicated.')
  }

  function deleteLane(laneId) {
    if (lanes.length <= 1) {
      setMessage('Keep at least one lane.')
      return
    }
    const targetIndex = lanes.findIndex(lane => lane.id === laneId)
    if (targetIndex < 0) return
    const fallbackLane = lanes[targetIndex + 1] || lanes[targetIndex - 1]
    const nextLanes = lanes.filter(lane => lane.id !== laneId)
    const nextCards = cards.map(card => card.lane === laneId ? { ...card, lane: fallbackLane.id } : card)
    if (editingLaneId === laneId) setEditingLaneId('')
    persistLanes(nextLanes, nextCards, `Lane deleted. Cards moved to ${fallbackLane.title}.`)
  }

  function moveLane(laneId, direction) {
    const index = lanes.findIndex(lane => lane.id === laneId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= lanes.length) return
    const next = [...lanes]
    const [lane] = next.splice(index, 1)
    next.splice(nextIndex, 0, lane)
    persistLanes(next, cards, 'Lane moved.')
  }

  function onDropLane(event, laneId) {
    event.preventDefault()
    const cardId = event.dataTransfer.getData('text/plain') || draggingId
    if (cardId) moveCard(cardId, laneId)
    setDraggingId(null)
  }

  function onDropCard(event, laneId, beforeId) {
    event.preventDefault()
    event.stopPropagation()
    const cardId = event.dataTransfer.getData('text/plain') || draggingId
    if (cardId && cardId !== beforeId) moveCard(cardId, laneId, beforeId)
    setDraggingId(null)
  }

  function captureSkillsetSelection() {
    if (selectionTimerRef.current) window.clearTimeout(selectionTimerRef.current)
    const selected = String(window.getSelection ? window.getSelection() : '').trim()
    if (!selected || selected.length < 8) {
      setExcerptToolsOpen(false)
      return
    }
    selectionTimerRef.current = window.setTimeout(() => {
      setExcerpt(selected.slice(0, 1800))
      setExcerptToolsOpen(true)
      setMessage(`${activeFile.label} excerpt selected. Choose Copy, New card, or Append.`)
    }, 2000)
  }

  function openPrintPreview() {
    setPrintMode(true)
  }

  function printStoryboard() {
    setPrintMode(true)
    window.setTimeout(() => window.print(), 80)
  }

  return (
    <main className="strategy-kanban" style={{ '--kanban-text-scale': textScale }}>
      <style>{styles}</style>
      <header className="kanban-hero">
        <div className="board-title-group">
          <p className="eyebrow">/plan/kanban</p>
          <h1>{activeBoard.name}</h1>
          <div className="board-quick-status" aria-label="Board quick status">
            <span>{lanes.length} lanes</span>
            <span>{totalCards} cards</span>
            <span>v{APP_VERSION}</span>
          </div>
        </div>
        <div className="hero-actions">
          <a href="/" className="ghost-link">Back to V3</a>
          <button type="button" onClick={() => openNewCard('build')}>New card</button>
          <button type="button" className="light-button" onClick={openPrintPreview}>Preview</button>
          <button type="button" className="light-button" onClick={printStoryboard}>Print/PDF</button>
          <button type="button" className="light-button" onClick={resetLocalDraft}>Reset local</button>
          <span className="text-tools" aria-label="Text size controls">
            <button type="button" className="icon-button" onClick={() => changeTextScale(-0.04)} aria-label="Decrease text size">-</button>
            <button type="button" className="icon-button" onClick={() => setTextScale(1)} aria-label="Reset text size">R</button>
            <button type="button" className="icon-button" onClick={() => changeTextScale(0.04)} aria-label="Increase text size">+</button>
          </span>
        </div>
      </header>

      <section className="story-strip" aria-label="Storyboard frame">
        <div><span>Input</span><strong>Job or organisation signal</strong></div>
        <div><span>Map</span><strong>RoleGraph + OrgGraph</strong></div>
        <div><span>Decision</span><strong>Human-owned action</strong></div>
      </section>

      <section className="planner-shell">
        <input
          ref={sourceFileInputRef}
          className="visually-hidden"
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={importSourceFile}
          aria-label="Open source file"
        />
        <input
          ref={boardFileInputRef}
          className="visually-hidden"
          type="file"
          accept=".md,.markdown,.json,text/markdown,application/json"
          onChange={importBoardFile}
          aria-label="Open board file"
        />
        <nav className="workspace-rail" aria-label="Workspace panels and boards">
          <button type="button" className={`rail-icon ${workOpen ? 'active' : ''}`} title="Working file" aria-label="Toggle working file drawer" onClick={() => setWorkOpen(!workOpen)}>W</button>
          <button type="button" className={`rail-icon ${inspectorOpen ? 'active' : ''}`} title="Selected card" aria-label="Toggle selected card drawer" onClick={() => setInspectorOpen(!inspectorOpen)}>C</button>
          <span className="rail-divider" aria-hidden="true" />
          <div className="board-icons" aria-label="Boards">
            {boards.map(board => (
              <button
                key={board.id}
                type="button"
                className={`board-icon ${activeBoardId === board.id ? 'active' : ''}`}
                title={board.name}
                aria-label={board.name}
                onClick={() => setActiveBoardId(board.id)}
                onContextMenu={event => openBoardMenu(event, board.id)}
              >
                {board.label}
              </button>
            ))}
          </div>
        </nav>

        {workOpen ? (
        <aside className="skillset-reader floating-drawer work-drawer" aria-label="Working file reader">
          <header className="reader-head">
            <div className="reader-title">
              <p className="eyebrow">Source file</p>
              <h2>{activeFile.label}</h2>
              <label className="source-picker">Change source file
                <select value={activeFileId} onChange={event => setActiveFileId(event.target.value)}>
                  {sourceFiles.map(file => <option key={file.id} value={file.id}>{file.label}</option>)}
                </select>
              </label>
            </div>
            <button type="button" className="drawer-close" onClick={() => setWorkOpen(false)} aria-label="Close working file drawer">x</button>
          </header>
          <p className="reader-hint">Highlight text and pause for 2 seconds.</p>
          {excerptToolsOpen ? (
            <div className="excerpt-tools" role="dialog" aria-label="Selected skillset excerpt actions">
              <strong>{excerptTitle(excerpt)}</strong>
              <p>{excerpt.slice(0, 180)}{excerpt.length > 180 ? '...' : ''}</p>
              <div>
                <button type="button" onClick={copyExcerpt}>Copy</button>
                <button type="button" onClick={() => openCardFromExcerpt()}>New card</button>
                <button type="button" className="light-button" disabled={!selectedCard} onClick={appendExcerptToSelected}>Append</button>
                <button type="button" className="light-button" onClick={() => setExcerptToolsOpen(false)}>Close</button>
              </div>
            </div>
          ) : null}
          <div className="skillset-text" onMouseUp={captureSkillsetSelection} onTouchEnd={captureSkillsetSelection}>
            {sourceBlocks.map(block => block.text.trim() ? (
              <p
                key={block.id}
                className={block.text.trim().startsWith('#') ? 'source-line source-heading' : 'source-line'}
                data-source-card-id={block.marker?.cardId || undefined}
              >
                <span>{block.text}</span>
                {block.marker ? (
                  <button
                    type="button"
                    className={`source-marker source-marker-button tone-${block.marker.tone}`}
                    onClick={() => focusCardFromSource(block.marker.cardId)}
                    aria-label={`Open card ${block.marker.label}`}
                  >
                    {block.marker.label}
                  </button>
                ) : null}
              </p>
            ) : <span key={block.id} className="source-break" aria-hidden="true" />)}
          </div>
          <footer className="reader-footer">
            <div className="reader-file-actions" aria-label="Source file functions">
              <span>File functions</span>
              <button type="button" onClick={() => boardFileInputRef.current?.click()}>Open board</button>
              <button type="button" onClick={exportBoardMarkdown}>Save board .md</button>
              <button type="button" onClick={exportBoardJson}>Backup .json</button>
              <button type="button" onClick={() => sourceFileInputRef.current?.click()}>Open source</button>
              <button type="button" onClick={exportSourceMarkdown}>Save source</button>
              <button type="button" onClick={copySourcePath}>Copy path</button>
              <button type="button" onClick={resetSourceFile}>Reset source</button>
              <button type="button" onClick={printStoryboard}>Print/PDF</button>
            </div>
            <div className="source-shortcuts" aria-label="Source file shortcuts">
              {sourceFiles.map(file => (
                <button key={file.id} type="button" className={activeFileId === file.id ? 'active' : ''} onClick={() => setActiveFileId(file.id)}>
                  {file.label}
                </button>
              ))}
            </div>
            <span>{activeFile.path}</span>
          </footer>
        </aside>
        ) : null}

        <section className="board" aria-label="V3 strategy kanban board">
          <div className="lane-create-cell">
            <button type="button" onClick={() => createLane()}>+ Add lane</button>
          </div>
          {lanes.map(lane => {
            const laneMarker = markerForLane(lane, lanes)
            const laneCards = cards.filter(card => card.lane === lane.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            const isTarget = selectedCard && selectedCard.lane !== lane.id
            return (
              <article
                key={lane.id}
                className={`lane ${isTarget ? 'lane-target' : ''} ${selectedLaneId === lane.id ? 'lane-selected' : ''}`}
                style={{ width: laneWidths[lane.id] ? `${laneWidths[lane.id]}px` : undefined }}
                onDragOver={event => event.preventDefault()}
                onDrop={event => onDropLane(event, lane.id)}
              >
                <header className="lane-head">
                  {editingLaneId === lane.id ? (
                    <form className="lane-edit" onSubmit={saveLaneHeader}>
                      <label>Lane header<input value={laneDraft.title} onChange={event => setLaneDraft({ ...laneDraft, title: event.target.value })} /></label>
                      <label>Lane cue<input value={laneDraft.cue} onChange={event => setLaneDraft({ ...laneDraft, cue: event.target.value })} /></label>
                      <div>
                        <button type="submit">Save</button>
                        <button type="button" className="light-button" onClick={() => setEditingLaneId('')}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="lane-title lane-title-button"
                        onClick={() => selectLane(lane.id)}
                        onContextMenu={event => openLaneMenu(event, lane.id)}
                        aria-label={`Select lane ${lane.title}`}
                        aria-pressed={selectedLaneId === lane.id}
                      >
                        <span className={`lane-code-pill tone-${laneMarker.tone}`}>{laneMarker.label}</span>
                        <h2>{lane.title}</h2>
                        <p>{lane.cue}</p>
                      </button>
                      <div className="lane-meta">
                        <span className="count">{cardCount(cards, lane.id)}</span>
                      </div>
                    </>
                  )}
                </header>
                <div className="lane-actions">
                  {isTarget ? <button className="move-here" type="button" onClick={() => moveCard(selectedCard.id, lane.id)}>Move here</button> : null}
                  <button className="add-small" type="button" onClick={() => openNewCard(lane.id)}>+ Card</button>
                  <button className="lane-menu-button" type="button" aria-label={`Open lane menu for ${lane.title}`} onClick={event => openLaneMenuFromButton(event, lane.id)}>...</button>
                </div>
                <div className="cards">
                  {laneCards.map(card => {
                    const cardMarker = markerMetaForCard(card, lanes, cards)
                    return (
                      <article
                        key={card.id}
                        id={`card-${card.id}`}
                        className={`card tone-card-${cardMarker.tone} ${selectedId === card.id ? 'selected' : ''}`}
                        draggable
                        tabIndex={0}
                        role="button"
                        onClick={() => setSelectedId(selectedId === card.id ? null : card.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedId(selectedId === card.id ? null : card.id)
                          }
                        }}
                        onDoubleClick={() => openEdit(card)}
                        onContextMenu={event => openShortcutMenu(event, card.id)}
                        onDragStart={event => {
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', card.id)
                          setDraggingId(card.id)
                        }}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => onDropCard(event, lane.id, card.id)}
                        onDragEnd={() => setDraggingId(null)}
                      >
                        <span className="card-topline">
                          <span className="checkmark" aria-hidden="true" />
                          <button
                            type="button"
                            className={`ref-pill tone-${cardMarker.tone}`}
                            onClick={event => {
                              event.stopPropagation()
                              focusSourceFromCard(card.id)
                            }}
                            aria-label={`Open source reference ${cardMarker.label}`}
                          >
                            {cardMarker.label}
                          </button>
                          <span className="kind">{card.kind}</span>
                          <button
                            type="button"
                            className="card-dots"
                            aria-label={`Open shortcuts for ${card.title}`}
                            onClick={event => openShortcutMenu(event, card.id)}
                          >
                            ...
                          </button>
                        </span>
                        <strong>{card.title}</strong>
                        <span className="source">{card.source || activeFile.label}</span>
                        <span className="body">{card.body}</span>
                        <span className="acceptance">{card.acceptance}</span>
                      </article>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </section>

        {shortcutMenu ? (() => {
          const card = cards.find(item => item.id === shortcutMenu.cardId)
          if (!card) return null
          return (
            <div
              className="shortcut-menu"
              style={{ left: shortcutMenu.x, top: shortcutMenu.y }}
              role="menu"
              aria-label={`Shortcuts for ${card.title}`}
              onClick={event => event.stopPropagation()}
            >
              <button type="button" role="menuitem" onClick={() => { openEdit(card); setShortcutMenu(null) }}>Edit card</button>
              <button type="button" role="menuitem" onClick={() => newNoteFromCard(card.id)}>New note from card</button>
              <button type="button" role="menuitem" onClick={() => copyCardLink(card.id)}>Copy link to card</button>
              <hr />
              <button type="button" role="menuitem" onClick={() => duplicateCard(card.id)}>Duplicate card</button>
              <button type="button" role="menuitem" onClick={() => insertCardNear(card.id, 'before')}>Insert card before</button>
              <button type="button" role="menuitem" onClick={() => insertCardNear(card.id, 'after')}>Insert card after</button>
              <button type="button" role="menuitem" onClick={() => moveCardToEdge(card.id, 'top')}>Move to top</button>
              <button type="button" role="menuitem" onClick={() => moveCardToEdge(card.id, 'bottom')}>Move to bottom</button>
              <button type="button" role="menuitem" onClick={() => { deleteCard(card.id); setShortcutMenu(null) }}>Delete card</button>
              <hr />
              <p>Move to lane</p>
              <div className="shortcut-lanes">
                {lanes.filter(lane => lane.id !== card.lane).map(lane => (
                  <button key={lane.id} type="button" role="menuitem" onClick={() => { moveCard(card.id, lane.id); setShortcutMenu(null) }}>
                    {lane.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })() : null}

        {laneMenu ? (() => {
          const lane = lanes.find(item => item.id === laneMenu.laneId)
          if (!lane) return null
          return (
            <div
              className="shortcut-menu lane-menu"
              style={{ left: laneMenu.x, top: laneMenu.y }}
              role="menu"
              aria-label={`Lane shortcuts for ${lane.title}`}
              onClick={event => event.stopPropagation()}
            >
              <button type="button" role="menuitem" onClick={() => { openLaneEdit(lane); setLaneMenu(null) }}>Rename lane</button>
              <button type="button" role="menuitem" onClick={() => { createLane(lane.id); setLaneMenu(null) }}>Insert lane after</button>
              <button type="button" role="menuitem" onClick={() => { duplicateLane(lane.id); setLaneMenu(null) }}>Duplicate lane</button>
              <hr />
              <button type="button" role="menuitem" onClick={() => { moveLane(lane.id, -1); setLaneMenu(null) }}>Move lane left</button>
              <button type="button" role="menuitem" onClick={() => { moveLane(lane.id, 1); setLaneMenu(null) }}>Move lane right</button>
              <hr />
              <button type="button" role="menuitem" onClick={() => { openNewCard(lane.id); setLaneMenu(null) }}>Add card</button>
              <button type="button" role="menuitem" onClick={() => { resizeLane(lane.id, -36); setLaneMenu(null) }}>Shrink lane</button>
              <button type="button" role="menuitem" onClick={() => { resizeLane(lane.id, 36); setLaneMenu(null) }}>Expand lane</button>
              <button type="button" role="menuitem" onClick={() => { deleteLane(lane.id); setLaneMenu(null) }}>Delete lane</button>
            </div>
          )
        })() : null}

        {boardMenu ? (() => {
          const board = boards.find(item => item.id === boardMenu.boardId)
          if (!board) return null
          return (
            <div
              className="shortcut-menu board-menu"
              style={{ left: boardMenu.x, top: boardMenu.y }}
              role="menu"
              aria-label={`Board shortcuts for ${board.name}`}
              onClick={event => event.stopPropagation()}
            >
              <button type="button" role="menuitem" onClick={createBoard}>Create new board</button>
              <button type="button" role="menuitem" onClick={() => duplicateBoard(board.id)}>Duplicate board</button>
              <button type="button" role="menuitem" onClick={() => deleteBoard(board.id)}>Delete board</button>
            </div>
          )
        })() : null}

        {inspectorOpen ? (
        <aside className="inspector docked-inspector" aria-label="Card editor">
          {selectedCard && !editorOpen ? (
            <>
              <div className="drawer-title-row">
                <p className="eyebrow">Selected card</p>
                <button type="button" className="drawer-close" onClick={() => setInspectorOpen(false)} aria-label="Close selected card drawer">x</button>
              </div>
              <h2>{selectedCard.title}</h2>
              <p>{selectedCard.body}</p>
              <dl>
                <div><dt>Lane</dt><dd>{lanes.find(lane => lane.id === selectedCard.lane)?.title || selectedCard.lane}</dd></div>
                <div><dt>Source</dt><dd>{selectedCard.source || '-'}</dd></div>
                <div><dt>Kind</dt><dd>{selectedCard.kind || '-'}</dd></div>
              </dl>
              <div className="inspector-actions">
                <button type="button" onClick={() => openEdit(selectedCard)}>Amend</button>
                <button type="button" className="danger-button" onClick={() => deleteCard(selectedCard.id)}>Delete</button>
              </div>
            </>
          ) : (
            <>
              <div className="drawer-title-row">
                <p className="eyebrow">{draft.id ? 'Amend card' : 'Create card'}</p>
                <button type="button" className="drawer-close" onClick={() => setInspectorOpen(false)} aria-label="Close selected card drawer">x</button>
              </div>
              <form onSubmit={saveCard} className="card-form">
                <label>Title<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
                <label>Lane
                  <select value={draft.lane} onChange={event => setDraft({ ...draft, lane: event.target.value })}>
                    {lanes.map(lane => <option key={lane.id} value={lane.id}>{lane.title}</option>)}
                  </select>
                </label>
                <label>Kind<input value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value })} /></label>
                <label>Source<input value={draft.source} onChange={event => setDraft({ ...draft, source: event.target.value })} /></label>
                <label>Story<textarea value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} /></label>
                <label>Acceptance<textarea value={draft.acceptance} onChange={event => setDraft({ ...draft, acceptance: event.target.value })} /></label>
                <div className="inspector-actions">
                  <button type="submit">Save card</button>
                  <button type="button" className="light-button" onClick={() => { setEditorOpen(false); setDraft(blankDraft) }}>Cancel</button>
                </div>
              </form>
            </>
          )}

          <section className="deleted-tray">
            <h3>Deleted</h3>
            {deletedCards.length ? deletedCards.slice(0, 8).map(card => (
              <div className="deleted-card" key={card.id}>
                <span>{card.title}</span>
                <button type="button" onClick={() => restoreCard(card.id)}>Restore</button>
              </div>
            )) : <p>No deleted cards.</p>}
          </section>
        </aside>
        ) : null}
      </section>

      <footer className="board-status-footer" aria-label="Board status">
        <span className={`storage-pill ${storage}`}>{storage === 'database' ? 'Database' : storage === 'loading' ? 'Loading' : 'Local draft'}</span>
        <span>Last save: {statusTime}</span>
        <span>Save location: {saveLocation}</span>
        <span>Source: {activeFile.path}</span>
        <span>Version: {APP_VERSION}</span>
        <span>{message}</span>
      </footer>

      {printMode ? (
        <section className="print-preview" role="dialog" aria-modal="true" aria-label="Storyboard print preview">
          <header className="print-preview-bar">
            <div>
              <p className="eyebrow">Storyboard Preview</p>
              <h2>{activeBoard.name}</h2>
            </div>
            <div className="hero-actions">
              <button type="button" onClick={printStoryboard}>Print/PDF</button>
              <button type="button" className="light-button" onClick={() => setPrintMode(false)}>Close</button>
            </div>
          </header>
          <div className="print-sheet">
            <header className="print-title">
              <span>v{APP_VERSION}</span>
              <h1>{activeBoard.name}</h1>
              <p>{lanes.length} lanes / {totalCards} cards / {activeFile.path}</p>
            </header>
            <div className="print-board">
              {lanes.map((lane, laneIndex) => {
                const laneCards = cards.filter(card => card.lane === lane.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                return (
                  <section key={lane.id} className="print-lane">
                    <h2>{laneCode(lane.title)} №{laneIndex + 1} {lane.title}</h2>
                    <p>{lane.cue}</p>
                    {laneCards.map(card => (
                      <article key={card.id} className="print-card">
                        <span>{markerForCard(card, lanes, cards)}</span>
                        <strong>{card.title}</strong>
                        <p>{card.body}</p>
                      </article>
                    ))}
                  </section>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

const styles = `
:root {
  color-scheme: light dark;
  --ink: #162033;
  --muted: #667085;
  --line: #cfd7e6;
  --paper: #f4f7fb;
  --panel: #ffffff;
  --panel-strong: #ffffff;
  --blue: #245fd6;
  --deep-blue: #153f9f;
  --orange: #c87422;
  --amber: #f2b84b;
  --teal: #1b8b95;
  --shadow: 0 16px 38px rgba(22, 32, 51, 0.12);
  --rail-bg: rgba(255, 255, 255, 0.9);
  --lane-bg: #ffffff;
  --lane-head: rgba(255, 255, 255, 0.94);
  --lane-line: #d7deeb;
  --lane-text: #162033;
  --lane-muted: #667085;
  --card-bg: #ffffff;
  --card-border: #d7deeb;
  --card-text: #162033;
  --card-muted: #667085;
  --menu-bg: #ffffff;
  --menu-text: #162033;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #f4f7fb;
    --muted: #aab4c3;
    --line: #2d3542;
    --paper: #080a0d;
    --panel: #11151c;
    --panel-strong: #171c25;
    --blue: #77a7ff;
    --deep-blue: #a9c4ff;
    --orange: #f2b84b;
    --amber: #f2b84b;
    --teal: #5fd0da;
    --shadow: 0 18px 42px rgba(0, 0, 0, 0.36);
    --rail-bg: rgba(14, 18, 24, 0.92);
    --lane-bg: #050607;
    --lane-head: rgba(5, 6, 7, 0.96);
    --lane-line: #242832;
    --lane-text: #eceff4;
    --lane-muted: #a5adba;
    --card-bg: #070809;
    --card-border: #252a33;
    --card-text: #f2f4f8;
    --card-muted: #cbd5e1;
    --menu-bg: #242424;
    --menu-text: #f4f4f5;
  }
}
* { box-sizing: border-box; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
body {
  margin: 0;
  background:
    linear-gradient(90deg, rgba(36, 95, 214, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(27, 139, 149, 0.05) 1px, transparent 1px),
    var(--paper);
  background-size: 32px 32px;
  color: var(--ink);
}
.strategy-kanban {
  min-height: 100vh;
  padding: 58px 18px 34px 68px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: calc(14px * var(--kanban-text-scale, 1));
}
.kanban-hero, .story-strip, .planner-shell, .board-status-footer {
  max-width: 1840px;
  margin-left: auto;
  margin-right: auto;
}
.kanban-hero {
  position: fixed;
  z-index: 22;
  top: 8px;
  left: 68px;
  right: 18px;
  max-width: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  max-height: 4.8vh;
  overflow: hidden;
  margin-bottom: 0;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  box-shadow: 0 8px 22px rgba(22, 32, 51, 0.08);
  padding: 4px 7px;
  backdrop-filter: blur(12px);
}
.eyebrow {
  margin: 0 0 2px;
  color: var(--deep-blue);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: calc(17px * var(--kanban-text-scale, 1));
  line-height: 1.05;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.board-title-group {
  min-width: 0;
}
.board-quick-status {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}
.board-quick-status span {
  min-height: 17px;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0 6px;
  color: var(--muted);
  background: var(--panel-strong);
  font-size: 10px;
  font-weight: 750;
}
.hero-copy {
  max-width: 680px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.45;
}
.hero-actions, .inspector-actions, .lane-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.hero-actions {
  justify-content: flex-end;
  align-items: center;
  flex-wrap: nowrap;
}
button, .ghost-link {
  min-height: 26px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--ink);
  color: #fff;
  padding: 0 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.text-tools {
  display: inline-flex;
  gap: 3px;
  padding-left: 3px;
  border-left: 1px solid var(--line);
}
.icon-button {
  min-width: 26px;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.ghost-link, .light-button, .add-small {
  background: var(--panel);
  color: var(--ink);
}
.danger-button {
  background: #fff6ed;
  color: #8c4a12;
  border-color: #efc99b;
}
.story-strip {
  margin-bottom: 6px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow);
}
.story-strip div {
  min-height: 32px;
  padding: 5px 9px;
  border-right: 1px solid var(--line);
}
.story-strip div:last-child { border-right: 0; }
.story-strip span {
  display: block;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
.story-strip strong {
  display: block;
  margin-top: 2px;
  font-size: calc(12px * var(--kanban-text-scale, 1));
}
.kanban-note {
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(36, 95, 214, 0.22);
  background: rgba(255, 255, 255, 0.76);
  color: var(--muted);
  font-size: 14px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.storage-pill {
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 850;
  background: #e9eefb;
  color: var(--deep-blue);
}
.storage-pill.local, .storage-pill.unavailable { background: #fff3dc; color: #8c5418; }
.planner-shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  min-height: calc(100vh - 116px);
}
.workspace-rail {
  position: fixed;
  z-index: 25;
  left: 14px;
  top: 54px;
  width: 46px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--rail-bg);
  box-shadow: var(--shadow);
  padding: 8px 6px;
  display: grid;
  gap: 8px;
  justify-items: center;
  backdrop-filter: blur(12px);
}
.rail-icon,
.board-icon {
  width: 32px;
  height: 32px;
  min-height: 32px;
  border-radius: 8px;
  padding: 0;
  border-color: var(--line);
  background: var(--panel);
  color: var(--ink);
  font: 850 13px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.rail-icon.active,
.board-icon.active {
  background: var(--ink);
  color: var(--panel);
  border-color: var(--ink);
}
.rail-divider {
  width: 24px;
  height: 8px;
  border-bottom: 1px solid var(--muted);
  opacity: 0.7;
}
.board-icons {
  display: grid;
  gap: 7px;
}
.floating-drawer {
  position: fixed;
  z-index: 20;
  left: 72px;
  top: 70px;
  max-height: calc(100vh - 130px);
  resize: horizontal;
  min-width: 280px;
  max-width: min(72vw, 760px);
}
.skillset-reader {
  width: 360px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.work-drawer {
  resize: horizontal;
}
.reader-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--panel-strong);
}
.reader-head h2 {
  margin: 0;
  font-size: 15px;
}
.reader-title {
  min-width: 0;
  display: grid;
  gap: 8px;
}
.source-picker {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.source-picker select {
  width: min(260px, 100%);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px;
  color: var(--ink);
  background: var(--panel);
  font: inherit;
}
.reader-head span {
  min-height: 26px;
  border-radius: 999px;
  background: #eef4ff;
  color: var(--deep-blue);
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 850;
  white-space: nowrap;
}
.reader-hint {
  margin: 0;
  padding: 7px 12px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
}
.skillset-text {
  flex: 1;
  min-height: 300px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  overflow-wrap: anywhere;
  color: var(--ink);
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  user-select: text;
}
.source-line {
  margin: 0;
  min-height: 19px;
  white-space: pre-wrap;
  display: block;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 46%, transparent);
  padding: 2px 0 3px;
}
.source-line.source-linked-flash {
  background: color-mix(in srgb, var(--panel) 68%, var(--amber));
}
.source-heading {
  margin-top: 5px;
  color: var(--ink);
  font-weight: 850;
}
.source-break {
  display: block;
  height: 8px;
}
.source-marker {
  float: right;
  margin-left: 8px;
  border-radius: 999px;
  min-height: 18px;
  border: 1px solid var(--ref-border, color-mix(in srgb, var(--amber) 45%, var(--line)));
  padding: 0 6px;
  color: var(--ref-text, var(--orange));
  background: var(--ref-bg, color-mix(in srgb, var(--panel) 84%, var(--amber)));
  font: 850 9px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.source-marker-button {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.source-marker-button:hover,
.ref-pill:hover,
.lane-code-pill:hover {
  filter: saturate(1.15);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ref-border) 32%, transparent);
}
.tone-0 { --ref-bg: #eaf1ff; --ref-border: #85a9f8; --ref-text: #153f9f; }
.tone-1 { --ref-bg: #fff2df; --ref-border: #e0a45b; --ref-text: #8c4a12; }
.tone-2 { --ref-bg: #e7f8f5; --ref-border: #75c7bd; --ref-text: #0f6d67; }
.tone-3 { --ref-bg: #f2ecff; --ref-border: #b7a0f4; --ref-text: #6240a7; }
.tone-4 { --ref-bg: #eef7df; --ref-border: #9ac66d; --ref-text: #4f741f; }
.tone-5 { --ref-bg: #ffeaf0; --ref-border: #e89ab1; --ref-text: #9a3656; }
.tone-6 { --ref-bg: #eaf6ff; --ref-border: #7bbde6; --ref-text: #1f638c; }
.tone-7 { --ref-bg: #f5f1e8; --ref-border: #c7aa72; --ref-text: #73551e; }
.reader-footer {
  display: grid;
  gap: 7px;
  padding: 10px 12px;
  border-top: 1px solid var(--line);
  background: var(--panel-strong);
}
.reader-footer span {
  color: var(--muted);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.reader-file-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.reader-file-actions span {
  font-weight: 850;
  text-transform: uppercase;
}
.reader-file-actions button {
  min-height: 24px;
  padding: 0 6px;
  background: var(--panel);
  color: var(--ink);
  font-size: 10.5px;
}
.source-shortcuts {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.source-shortcuts button {
  min-height: 30px;
  flex: 0 0 auto;
  padding: 0 9px;
  background: var(--panel);
  color: var(--ink);
  font-size: 11px;
}
.source-shortcuts button.active {
  background: var(--ink);
  color: var(--panel);
}
.drawer-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.drawer-close {
  min-width: 32px;
  min-height: 32px;
  border-radius: 8px;
  padding: 0;
  background: var(--panel);
  color: var(--ink);
}
.skillset-text::selection {
  background: rgba(242, 184, 75, 0.45);
}
.excerpt-tools {
  margin: 10px 12px 0;
  border: 1px solid rgba(36, 95, 214, 0.26);
  border-radius: 8px;
  background: var(--panel-strong);
  box-shadow: 0 14px 28px rgba(22, 32, 51, 0.14);
  padding: 12px;
}
.excerpt-tools strong {
  display: block;
  font-size: 14px;
}
.excerpt-tools p {
  margin: 7px 0 10px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.42;
}
.excerpt-tools div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.excerpt-tools button {
  min-height: 34px;
  padding: 0 10px;
  font-size: 12px;
}
.excerpt-tools button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
.board {
  grid-column: 1;
  min-width: 0;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 18px;
  scroll-snap-type: x proximity;
}
.lane-create-cell {
  flex: 0 0 132px;
  min-height: calc(100vh - 142px);
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}
.lane-create-cell button {
  width: 100%;
  min-height: 42px;
  border-style: dashed;
  border-color: var(--lane-line);
  background: var(--lane-bg);
  color: var(--lane-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.inspector {
  grid-column: 2;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  box-shadow: var(--shadow);
}
.lane {
  flex: 0 0 auto;
  width: 336px;
  min-width: 260px;
  max-width: 680px;
  resize: horizontal;
  overflow: auto;
  border: 1px solid var(--lane-line);
  background: var(--lane-bg);
  box-shadow: 0 18px 38px rgba(5, 6, 7, 0.24);
  min-height: calc(100vh - 142px);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  color: var(--lane-text);
}
.lane-target {
  outline: 2px solid rgba(242, 184, 75, 0.42);
  outline-offset: 2px;
}
.lane-selected {
  outline: 2px solid rgba(36, 95, 214, 0.36);
  outline-offset: 2px;
}
.lane-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 8px;
  border-bottom: 1px solid var(--lane-line);
  background: var(--lane-head);
  backdrop-filter: blur(10px);
}
.lane-title {
  min-width: 0;
  flex: 1;
}
.lane-title-button {
  width: 100%;
  min-height: auto;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 3px 4px;
  text-align: left;
  display: block;
  cursor: pointer;
}
.lane-title-button:hover {
  background: color-mix(in srgb, var(--lane-bg) 84%, var(--amber));
}
.lane-title-button[aria-pressed="true"] {
  background: color-mix(in srgb, var(--lane-bg) 84%, var(--blue));
}
.lane-head h2 {
  margin: 4px 0 0;
  font: 850 calc(13px * var(--kanban-text-scale, 1))/1.18 Inter, ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  color: var(--lane-text);
}
.lane-code-pill,
.ref-pill {
  min-height: 20px;
  border: 1px solid var(--ref-border);
  border-radius: 999px;
  background: var(--ref-bg);
  color: var(--ref-text);
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  font: 850 10px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  white-space: nowrap;
}
.ref-pill {
  min-height: 23px;
  border-radius: 6px;
  cursor: pointer;
}
.tone-card-0 { border-left: 4px solid #85a9f8; }
.tone-card-1 { border-left: 4px solid #e0a45b; }
.tone-card-2 { border-left: 4px solid #75c7bd; }
.tone-card-3 { border-left: 4px solid #b7a0f4; }
.tone-card-4 { border-left: 4px solid #9ac66d; }
.tone-card-5 { border-left: 4px solid #e89ab1; }
.tone-card-6 { border-left: 4px solid #7bbde6; }
.tone-card-7 { border-left: 4px solid #c7aa72; }
.lane-head p {
  margin: 3px 0 0;
  color: var(--lane-muted);
  font: calc(10.5px * var(--kanban-text-scale, 1))/1.28 Inter, ui-sans-serif, system-ui, sans-serif;
  line-height: 1.32;
  overflow-wrap: anywhere;
}
.lane-meta {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  flex: 0 0 auto;
}
.count {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--lane-line);
  background: color-mix(in srgb, var(--lane-bg) 85%, var(--amber));
  color: #f2b84b;
  font: 850 11px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-weight: 850;
}
.lane-edit {
  width: 100%;
  display: grid;
  gap: 8px;
}
.lane-edit label {
  display: grid;
  gap: 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
}
.lane-edit input {
  width: 100%;
  border: 1px solid #313743;
  border-radius: 8px;
  padding: 8px 9px;
  color: #f5f7fb;
  background: #0d1016;
  font: inherit;
  font-size: 13px;
  text-transform: none;
}
.lane-edit div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.lane-edit button {
  min-height: 32px;
  padding: 0 8px;
  font-size: 12px;
}
.lane-actions {
  padding: 5px 8px 0;
}
.lane-actions button {
  min-height: 24px;
  font-size: 11px;
}
.move-here {
  background: #13223f;
  color: #dbe8ff;
  border-color: rgba(83, 139, 245, 0.42);
}
.add-small {
  border-color: var(--lane-line);
  background: var(--lane-bg);
  color: var(--lane-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.lane-menu-button {
  min-width: 26px;
  padding: 0;
  border-color: var(--lane-line);
  background: var(--lane-bg);
  color: var(--lane-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 7px;
}
.card {
  width: 100%;
  min-height: auto;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  background: var(--card-bg);
  padding: 8px 9px;
  text-align: left;
  color: var(--card-text);
  font: calc(12.5px * var(--kanban-text-scale, 1))/1.38 Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  box-shadow: none;
  cursor: grab;
  display: block;
}
.card:active { cursor: grabbing; }
.card:hover {
  border-color: var(--amber);
  background: color-mix(in srgb, var(--card-bg) 90%, var(--amber));
}
.card.selected {
  border-color: #7b61ff;
  box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.24);
}
.card-topline {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  align-items: center;
  margin-bottom: 7px;
}
.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #555e6d;
  border-radius: 5px;
  flex: 0 0 auto;
}
.kind {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}
.kind { background: color-mix(in srgb, var(--card-bg) 84%, var(--amber)); color: var(--amber); border: 1px solid var(--card-border); }
.card-dots {
  margin-left: auto;
  min-height: 26px;
  min-width: 30px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #a5adba;
  padding: 0 4px;
  font: 900 16px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.card-dots:hover {
  background: #1b2029;
  color: #fff;
}
.source {
  display: block;
  margin-top: 8px;
  color: var(--card-muted);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.card strong {
  display: block;
  padding-left: 0;
  color: var(--card-text);
  font-size: calc(13px * var(--kanban-text-scale, 1));
  line-height: 1.25;
  font-weight: 820;
  overflow-wrap: anywhere;
}
.body, .acceptance {
  display: block;
  margin-top: 7px;
  color: var(--card-muted);
  font-size: calc(11.5px * var(--kanban-text-scale, 1));
  line-height: 1.36;
  overflow-wrap: anywhere;
}
.acceptance {
  color: #9aa4b2;
  border-top: 1px solid #202631;
  padding-top: 8px;
}
.shortcut-menu {
  position: fixed;
  z-index: 30;
  width: 252px;
  border: 1px solid #3b414d;
  border-radius: 8px;
  background: var(--menu-bg);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.42);
  padding: 8px;
  color: var(--menu-text);
}
.shortcut-menu button {
  width: 100%;
  min-height: 28px;
  justify-content: flex-start;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--menu-text);
  padding: 0 10px;
  font-size: 13px;
  font-weight: 650;
}
.shortcut-menu button:hover {
  background: color-mix(in srgb, var(--menu-bg) 82%, var(--amber));
}
.shortcut-menu hr {
  height: 1px;
  border: 0;
  background: #454545;
  margin: 7px 8px;
}
.shortcut-menu p {
  margin: 8px 10px 5px;
  color: #b9bcc4;
  font-size: 12px;
  font-weight: 800;
}
.shortcut-lanes {
  max-height: 150px;
  overflow: auto;
}
.inspector {
  width: 340px;
  resize: horizontal;
  overflow: auto;
  padding: 16px;
}
.docked-inspector {
  position: sticky;
  top: 58px;
  z-index: 12;
  max-height: calc(100vh - 94px);
  min-width: 280px;
  max-width: min(44vw, 520px);
}
.inspector h2 {
  margin: 0 0 10px;
  font-size: 22px;
}
.inspector p {
  color: var(--muted);
  line-height: 1.42;
}
dl {
  display: grid;
  gap: 8px;
  margin: 14px 0;
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid #edf1f7;
  padding-top: 8px;
}
dt { color: var(--muted); font-size: 12px; font-weight: 800; }
dd { margin: 0; font-size: 13px; font-weight: 750; }
.card-form {
  display: grid;
  gap: 10px;
}
.card-form label {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.card-form input, .card-form select, .card-form textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  font: inherit;
  color: var(--ink);
  background: var(--panel);
}
.card-form textarea {
  min-height: 84px;
  resize: vertical;
}
.deleted-tray {
  margin-top: 18px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}
.deleted-tray h3 {
  margin: 0 0 10px;
  font-size: 15px;
}
.deleted-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid #edf1f7;
}
.deleted-card span {
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.deleted-card button {
  min-height: 32px;
  background: #eef4ff;
  color: var(--deep-blue);
}
.board-status-footer {
  position: fixed;
  z-index: 18;
  left: 68px;
  right: 18px;
  bottom: 6px;
  min-height: 24px;
  max-height: 3.4vh;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  box-shadow: 0 12px 28px rgba(22, 32, 51, 0.14);
  display: flex;
  gap: 7px;
  align-items: center;
  flex-wrap: nowrap;
  padding: 3px 6px;
  color: var(--muted);
  font-size: 10px;
  backdrop-filter: blur(10px);
}
.board-status-footer span:not(.storage-pill) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.print-preview {
  position: fixed;
  z-index: 60;
  inset: 0;
  overflow: auto;
  background: #4b5563;
  padding: 18px;
}
.print-preview-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #d5dae4;
  background: #f8fafc;
  color: #111827;
  padding: 10px 12px;
  max-width: 1280px;
  margin: 0 auto 14px;
}
.print-preview-bar h2 {
  margin: 0;
  font-size: 20px;
}
.print-sheet {
  max-width: 1280px;
  min-height: calc(100vh - 90px);
  margin: 0 auto;
  background: #fff;
  color: #111827;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  padding: 24px;
}
.print-title {
  border-bottom: 2px solid #111827;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.print-title span {
  font-size: 12px;
  font-weight: 850;
  color: #475569;
}
.print-title h1 {
  margin-top: 4px;
  font-size: 28px;
}
.print-title p {
  margin: 6px 0 0;
  color: #475569;
}
.print-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}
.print-lane {
  break-inside: avoid;
  border: 1px solid #cbd5e1;
  padding: 10px;
}
.print-lane h2 {
  margin: 0;
  font-size: 14px;
}
.print-lane > p {
  margin: 5px 0 10px;
  color: #64748b;
  font-size: 11px;
}
.print-card {
  break-inside: avoid;
  border-top: 1px solid #e2e8f0;
  padding: 8px 0;
}
.print-card span {
  color: #c87422;
  font-size: 10px;
  font-weight: 850;
}
.print-card strong {
  display: block;
  margin-top: 2px;
  font-size: 12px;
}
.print-card p {
  margin: 4px 0 0;
  color: #475569;
  font-size: 11px;
  line-height: 1.35;
}
button:focus-visible, .ghost-link:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, .card:focus-visible {
  outline: 3px solid var(--amber);
  outline-offset: 2px;
}
@media (max-width: 920px) {
  .planner-shell {
    grid-template-columns: 1fr;
    min-height: 58vh;
  }
  .floating-drawer {
    left: 66px;
    width: min(360px, calc(100vw - 84px));
    max-width: calc(100vw - 84px);
  }
  .docked-inspector {
    grid-column: 1;
    position: static;
    width: min(100%, 520px);
    max-width: 100%;
    max-height: none;
  }
  .skillset-reader {
    max-height: 54vh;
  }
}
@media (max-width: 760px) {
  .strategy-kanban {
    padding: 58px 10px 34px 58px;
  }
  .workspace-rail {
    left: 10px;
    top: 54px;
  }
  .kanban-hero {
    left: 58px;
    right: 10px;
    align-items: center;
    flex-direction: row;
  }
  .hero-actions {
    justify-content: flex-end;
    overflow-x: auto;
  }
  .story-strip {
    grid-template-columns: 1fr;
  }
  .story-strip div {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .story-strip div:last-child {
    border-bottom: 0;
  }
  .board {
    gap: 10px;
  }
  .lane {
    width: 84vw;
    min-height: 58vh;
  }
  .board-status-footer {
    left: 58px;
    right: 10px;
  }
}
@media print {
  body {
    background: #fff;
  }
  .kanban-hero,
  .story-strip,
  .planner-shell,
  .workspace-rail,
  .floating-drawer,
  .board-status-footer,
  .print-preview-bar {
    display: none !important;
  }
  .strategy-kanban {
    padding: 0;
  }
  .print-preview {
    position: static;
    inset: auto;
    overflow: visible;
    background: #fff;
    padding: 0;
  }
  .print-sheet {
    max-width: none;
    min-height: auto;
    box-shadow: none;
    padding: 0;
  }
  .print-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
`
