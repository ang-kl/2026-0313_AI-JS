import React, { useEffect, useMemo, useRef, useState } from 'react'
import skillsetText from '../skillset.md?raw'
import goalText from '../goal/readme.md?raw'
import skillsText from '../skills/README.md?raw'
import reinventionText from '../script/v3-reinvention-implementation-spec.md?raw'

const STORAGE_KEY = 'v3.strategyKanban.fallback.v3'
const WORKSPACE_KEY = 'v3.strategyKanban.workspace.v1'

const workFiles = [
  { id: 'skillset', label: 'skillset.md', path: 'v3/skillset.md', text: skillsetText },
  { id: 'goal', label: 'goal/readme.md', path: 'v3/goal/readme.md', text: goalText },
  { id: 'skills', label: 'skills/README.md', path: 'v3/skills/README.md', text: skillsText },
  { id: 'reinvention', label: 'reinvention spec', path: 'v3/script/v3-reinvention-implementation-spec.md', text: reinventionText },
]

const defaultBoards = [
  { id: 'board-1', label: '1', name: 'Storyboard 1' },
  { id: 'board-2', label: '2', name: 'Storyboard 2' },
  { id: 'board-3', label: '3', name: 'Storyboard 3' },
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
  const byId = new Map(incoming.filter(lane => lane && lane.id).map(lane => [lane.id, lane]))
  return defaultLanes
    .map((base, index) => {
      const lane = byId.get(base.id) || {}
      return {
        ...base,
        ...lane,
        id: base.id,
        position: Number.isFinite(Number(lane.position)) ? Number(lane.position) : index,
        title: String(lane.title || base.title).trim().slice(0, 80),
        cue: String(lane.cue || base.cue).trim().slice(0, 140),
      }
    })
    .sort((a, b) => a.position - b.position)
    .map((lane, index) => ({ ...lane, position: index }))
}

function loadFallback() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { cards: seedCards, deletedCards: [], lanes: defaultLanes }
    const parsed = JSON.parse(raw)
    return {
      cards: Array.isArray(parsed.cards) ? parsed.cards : seedCards,
      deletedCards: Array.isArray(parsed.deletedCards) ? parsed.deletedCards : [],
      lanes: normaliseLanes(parsed.lanes),
    }
  } catch (_) {
    return { cards: seedCards, deletedCards: [], lanes: defaultLanes }
  }
}

function saveFallback(cards, deletedCards, lanes = defaultLanes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards, deletedCards, lanes }))
  } catch (_) {}
}

function loadWorkspace() {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw)
    return {
      workOpen: parsed.workOpen !== false,
      inspectorOpen: parsed.inspectorOpen !== false,
      activeFileId: workFiles.some(file => file.id === parsed.activeFileId) ? parsed.activeFileId : 'skillset',
      activeBoardId: parsed.activeBoardId || 'board-1',
      boards: Array.isArray(parsed.boards) && parsed.boards.length ? parsed.boards : defaultBoards,
      laneWidths: parsed.laneWidths && typeof parsed.laneWidths === 'object' ? parsed.laneWidths : {},
    }
  } catch (_) {
    return {
      workOpen: true,
      inspectorOpen: true,
      activeFileId: 'skillset',
      activeBoardId: 'board-1',
      boards: defaultBoards,
      laneWidths: {},
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

export default function StrategyKanban() {
  const fallback = useMemo(loadFallback, [])
  const workspace = useMemo(loadWorkspace, [])
  const [lanes, setLanes] = useState(fallback.lanes)
  const [cards, setCards] = useState(fallback.cards)
  const [deletedCards, setDeletedCards] = useState(fallback.deletedCards)
  const [workOpen, setWorkOpen] = useState(workspace.workOpen)
  const [inspectorOpen, setInspectorOpen] = useState(workspace.inspectorOpen)
  const [activeFileId, setActiveFileId] = useState(workspace.activeFileId)
  const [boards, setBoards] = useState(workspace.boards)
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
  const selectionTimerRef = useRef(null)

  const selectedCard = useMemo(
    () => cards.find(card => card.id === selectedId) || null,
    [cards, selectedId],
  )
  const activeFile = useMemo(
    () => workFiles.find(file => file.id === activeFileId) || workFiles[0],
    [activeFileId],
  )

  useEffect(() => {
    let alive = true
    planningApi({ action: 'list' })
      .then(data => {
        if (!alive) return
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setLanes(normaliseLanes(data.lanes || []))
          setStorage(data.storage || 'database')
          setMessage('Saved to planning database.')
        } else {
          setStorage('local')
          setMessage('Planning database unavailable. Using local draft until DB env is connected.')
        }
      })
      .catch(() => {
        if (!alive) return
        setStorage('local')
        setMessage('Planning database unavailable. Using local draft until DB env is connected.')
      })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    function closeMenu(event) {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      setShortcutMenu(null)
      setBoardMenu(null)
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
    saveWorkspace({ workOpen, inspectorOpen, activeFileId, boards, activeBoardId, laneWidths })
  }, [workOpen, inspectorOpen, activeFileId, boards, activeBoardId, laneWidths])

  async function syncBoard(nextCards, note) {
    const ordered = normaliseCards(nextCards)
    setCards(ordered)
    if (storage === 'database') {
      try {
        const data = await planningApi({
          action: 'saveOrder',
          cards: ordered.map(({ id, lane, position }) => ({ id, lane, position })),
        })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || ordered))
          setDeletedCards(data.deletedCards || deletedCards)
          setMessage(note || 'Board saved to database.')
          return
        }
      } catch (_) {}
      setMessage('Move kept on screen, but database save failed.')
      return
    }
    saveFallback(ordered, deletedCards, lanes)
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
        const saved = await planningApi({ action: 'saveCard', card: { ...card, position: ordered.find(item => item.id === card.id)?.position ?? card.position } })
        if (saved && saved.ok) {
          const orderedAfterSave = normaliseCards(ordered)
          const moved = await planningApi({
            action: 'saveOrder',
            cards: orderedAfterSave.map(({ id, lane, position }) => ({ id, lane, position })),
          })
          if (moved && moved.ok) {
            setCards(normaliseCards(moved.cards || orderedAfterSave))
            setDeletedCards(moved.deletedCards || deletedCards)
            setMessage(note)
            return
          }
        }
      } catch (_) {}
      setMessage('Card created on screen, but database save failed.')
      saveFallback(ordered, deletedCards, lanes)
      return
    }
    saveFallback(ordered, deletedCards, lanes)
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

  function createBoard() {
    const nextNumber = boards.length + 1
    const board = { id: `board-${Date.now()}`, label: String(nextNumber), name: `Storyboard ${nextNumber}` }
    setBoards([...boards, board])
    setActiveBoardId(board.id)
    setBoardMenu(null)
    setMessage('Board icon created.')
  }

  function duplicateBoard(boardId) {
    const board = boards.find(item => item.id === boardId)
    if (!board) return
    const copy = { id: `board-${Date.now()}`, label: `${board.label}'`, name: `${board.name} copy` }
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
        const data = await planningApi({ action: 'saveCard', card })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(data.card && data.card.id ? data.card.id : id)
          setEditorOpen(false)
          setMessage('Card saved to planning database.')
          return
        }
      } catch (_) {}
      setMessage('Database save failed. Card kept locally for this browser.')
    }
    const next = normaliseCards([...cards.filter(item => item.id !== id), card])
    setCards(next)
    saveFallback(next, deletedCards, lanes)
    setSelectedId(id)
    setEditorOpen(false)
  }

  async function saveCardRecord(card, successMessage = 'Card saved to planning database.') {
    if (storage === 'database') {
      try {
        const data = await planningApi({ action: 'saveCard', card })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(card.id)
          setMessage(successMessage)
          return
        }
      } catch (_) {}
      setMessage('Database save failed. Card kept locally for this browser.')
    }
    const next = normaliseCards([...cards.filter(item => item.id !== card.id), card])
    setCards(next)
    saveFallback(next, deletedCards, lanes)
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

  async function deleteCard(cardId) {
    const card = cards.find(item => item.id === cardId)
    if (!card) return
    if (storage === 'database') {
      try {
        const data = await planningApi({ action: 'deleteCard', id: cardId })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(null)
          setEditorOpen(false)
          setMessage('Card deleted. It can be restored from Deleted.')
          return
        }
      } catch (_) {}
    }
    const next = cards.filter(item => item.id !== cardId)
    const deleted = [{ ...card, deletedAt: new Date().toISOString() }, ...deletedCards]
    setCards(next)
    setDeletedCards(deleted)
    saveFallback(next, deleted, lanes)
    setSelectedId(null)
    setEditorOpen(false)
  }

  async function restoreCard(cardId) {
    const card = deletedCards.find(item => item.id === cardId)
    if (!card) return
    if (storage === 'database') {
      try {
        const data = await planningApi({ action: 'restoreCard', id: cardId, lane: card.lane || 'decide' })
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
          setSelectedId(cardId)
          setMessage('Card restored from Deleted.')
          return
        }
      } catch (_) {}
    }
    const next = normaliseCards([...cards, { ...card, deletedAt: null }])
    const deleted = deletedCards.filter(item => item.id !== cardId)
    setCards(next)
    setDeletedCards(deleted)
    saveFallback(next, deleted, lanes)
    setSelectedId(cardId)
  }

  function resetLocalDraft() {
    setCards(seedCards)
    setDeletedCards([])
    setLanes(defaultLanes)
    saveFallback(seedCards, [], defaultLanes)
    setMessage('Local draft reset. Database cards are untouched.')
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
        const data = await planningApi({ action: 'saveLanes', lanes: nextLanes })
        if (data && data.ok) {
          setLanes(normaliseLanes(data.lanes || nextLanes))
          setMessage('Lane header saved to planning database.')
          return
        }
      } catch (_) {}
      setMessage('Lane header kept on screen, but database save failed.')
      saveFallback(cards, deletedCards, nextLanes)
      return
    }
    saveFallback(cards, deletedCards, nextLanes)
    setMessage('Lane header saved locally.')
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

  return (
    <main className="strategy-kanban">
      <style>{styles}</style>
      <header className="kanban-hero">
        <div>
          <p className="eyebrow">/plan/kanban</p>
          <h1>V3 Storyboard Board</h1>
          <p className="hero-copy">Move doctrine into product work. Save the board as planning data, not just browser memory.</p>
        </div>
        <div className="hero-actions">
          <a href="/" className="ghost-link">Back to V3</a>
          <button type="button" onClick={() => openNewCard('build')}>New card</button>
          <button type="button" className="light-button" onClick={resetLocalDraft}>Reset local</button>
        </div>
      </header>

      <section className="story-strip" aria-label="Storyboard frame">
        <div><span>Input</span><strong>Job or organisation signal</strong></div>
        <div><span>Map</span><strong>RoleGraph + OrgGraph</strong></div>
        <div><span>Decision</span><strong>Human-owned action</strong></div>
      </section>

      <section className="kanban-note" aria-live="polite">
        <span className={`storage-pill ${storage}`}>{storage === 'database' ? 'Database' : storage === 'loading' ? 'Loading' : 'Local draft'}</span>
        <span>{message}</span>
      </section>

      <section className="planner-shell">
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
                  {workFiles.map(file => <option key={file.id} value={file.id}>{file.label}</option>)}
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
          <pre className="skillset-text" onMouseUp={captureSkillsetSelection} onTouchEnd={captureSkillsetSelection}>
            {activeFile.text}
          </pre>
          <footer className="reader-footer">
            <div className="source-shortcuts" aria-label="Source file shortcuts">
              {workFiles.map(file => (
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
          {lanes.map(lane => {
            const laneCards = cards.filter(card => card.lane === lane.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            const isTarget = selectedCard && selectedCard.lane !== lane.id
            return (
              <article
                key={lane.id}
                className={`lane ${isTarget ? 'lane-target' : ''}`}
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
                      <div className="lane-title">
                        <h2>{lane.title}</h2>
                        <p>{lane.cue}</p>
                      </div>
                      <div className="lane-meta">
                        <span className="count">{cardCount(cards, lane.id)}</span>
                        <button type="button" className="rename-lane" onClick={() => openLaneEdit(lane)}>Rename</button>
                      </div>
                    </>
                  )}
                </header>
                <div className="lane-actions">
                  {isTarget ? <button className="move-here" type="button" onClick={() => moveCard(selectedCard.id, lane.id)}>Move here</button> : null}
                  <button className="add-small" type="button" onClick={() => openNewCard(lane.id)}>Add</button>
                  <button className="lane-size-button" type="button" aria-label={`Shrink ${lane.title}`} onClick={() => resizeLane(lane.id, -36)}>-</button>
                  <button className="lane-size-button" type="button" aria-label={`Expand ${lane.title}`} onClick={() => resizeLane(lane.id, 36)}>+</button>
                </div>
                <div className="cards">
                  {laneCards.map(card => (
                    <article
                      key={card.id}
                      id={`card-${card.id}`}
                      className={`card ${selectedId === card.id ? 'selected' : ''}`}
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
                  ))}
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
  padding: 24px 24px 24px 76px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.kanban-hero, .story-strip, .kanban-note, .planner-shell {
  max-width: 1840px;
  margin-left: auto;
  margin-right: auto;
}
.kanban-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--deep-blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: clamp(30px, 5vw, 58px);
  line-height: 0.96;
  letter-spacing: 0;
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
  gap: 10px;
  flex-wrap: wrap;
}
.hero-actions { justify-content: flex-end; }
button, .ghost-link {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  padding: 0 14px;
  font: inherit;
  font-weight: 750;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
  margin-bottom: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow);
}
.story-strip div {
  min-height: 76px;
  padding: 14px 16px;
  border-right: 1px solid var(--line);
}
.story-strip div:last-child { border-right: 0; }
.story-strip span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.story-strip strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
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
  min-height: 64vh;
}
.workspace-rail {
  position: fixed;
  z-index: 25;
  left: 14px;
  top: 86px;
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
  top: 86px;
  max-height: calc(100vh - 108px);
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
  padding: 14px;
  border-bottom: 1px solid var(--line);
  background: var(--panel-strong);
}
.reader-head h2 {
  margin: 0;
  font-size: 18px;
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
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
}
.skillset-text {
  flex: 1;
  min-height: 300px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--ink);
  font: 13px/1.48 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  user-select: text;
}
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
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 18px;
  scroll-snap-type: x proximity;
}
.inspector {
  grid-column: 2;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  box-shadow: var(--shadow);
}
.lane {
  flex: 0 0 auto;
  width: 312px;
  min-width: 220px;
  max-width: 680px;
  resize: horizontal;
  overflow: auto;
  border: 1px solid var(--lane-line);
  background: var(--lane-bg);
  box-shadow: 0 18px 38px rgba(5, 6, 7, 0.24);
  min-height: 62vh;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  color: var(--lane-text);
}
.lane-target {
  outline: 2px solid rgba(242, 184, 75, 0.42);
  outline-offset: 2px;
}
.lane-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--lane-line);
  background: var(--lane-head);
  backdrop-filter: blur(10px);
}
.lane-title {
  min-width: 0;
}
.lane-head h2 {
  margin: 0;
  font: 800 15px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  color: var(--lane-text);
}
.lane-head p {
  margin: 5px 0 0;
  color: var(--lane-muted);
  font: 12px/1.32 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  line-height: 1.32;
  overflow-wrap: anywhere;
}
.lane-meta {
  display: grid;
  gap: 7px;
  justify-items: end;
  flex: 0 0 auto;
}
.count {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--lane-line);
  background: color-mix(in srgb, var(--lane-bg) 85%, var(--amber));
  color: #f2b84b;
  font: 850 13px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-weight: 850;
}
.rename-lane {
  min-height: 28px;
  padding: 0 8px;
  border-radius: 7px;
  border-color: var(--lane-line);
  background: var(--lane-bg);
  color: var(--lane-text);
  font-size: 11px;
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
  padding: 10px 12px 0;
}
.lane-actions button {
  min-height: 34px;
  font-size: 13px;
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
.lane-size-button {
  min-width: 34px;
  padding: 0;
  border-color: var(--lane-line);
  background: var(--lane-bg);
  color: var(--lane-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}
.card {
  width: 100%;
  min-height: auto;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  background: var(--card-bg);
  padding: 11px 12px;
  text-align: left;
  color: var(--card-text);
  font: 14px/1.42 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
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
  margin-bottom: 9px;
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
  padding-left: 26px;
  font-size: 15px;
  line-height: 1.28;
  overflow-wrap: anywhere;
}
.body, .acceptance {
  display: block;
  margin-top: 8px;
  color: var(--card-muted);
  font-size: 13px;
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
  min-height: 31px;
  justify-content: flex-start;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--menu-text);
  padding: 0 10px;
  font-size: 14px;
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
  top: 16px;
  z-index: 12;
  max-height: calc(100vh - 32px);
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
    padding: 16px 16px 16px 64px;
  }
  .workspace-rail {
    left: 10px;
    top: 72px;
  }
  .kanban-hero {
    align-items: stretch;
    flex-direction: column;
  }
  .hero-actions {
    justify-content: flex-start;
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
}
`
