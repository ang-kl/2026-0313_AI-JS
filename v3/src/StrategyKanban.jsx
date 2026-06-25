import React, { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'v3.strategyKanban.fallback.v2'

const lanes = [
  { id: 'doctrine', title: 'Doctrine', cue: 'What must stay true' },
  { id: 'ready', title: 'Ready', cue: 'Ready to shape into UI' },
  { id: 'build', title: 'Build next', cue: 'Storyboard the product' },
  { id: 'govern', title: 'Governance', cue: 'Keep agentic risk visible' },
  { id: 'research', title: 'Research / data', cue: 'Evidence before advice' },
  { id: 'decide', title: 'Needs decision', cue: 'Choose before building' },
  { id: 'done', title: 'Done', cue: 'Accepted direction' },
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

function loadFallback() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { cards: seedCards, deletedCards: [] }
    const parsed = JSON.parse(raw)
    return {
      cards: Array.isArray(parsed.cards) ? parsed.cards : seedCards,
      deletedCards: Array.isArray(parsed.deletedCards) ? parsed.deletedCards : [],
    }
  } catch (_) {
    return { cards: seedCards, deletedCards: [] }
  }
}

function saveFallback(cards, deletedCards) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards, deletedCards }))
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

export default function StrategyKanban() {
  const fallback = useMemo(loadFallback, [])
  const [cards, setCards] = useState(fallback.cards)
  const [deletedCards, setDeletedCards] = useState(fallback.deletedCards)
  const [storage, setStorage] = useState('loading')
  const [message, setMessage] = useState('Opening planning board...')
  const [draggingId, setDraggingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(blankDraft)
  const [editorOpen, setEditorOpen] = useState(false)

  const selectedCard = useMemo(
    () => cards.find(card => card.id === selectedId) || null,
    [cards, selectedId],
  )

  useEffect(() => {
    let alive = true
    planningApi({ action: 'list' })
      .then(data => {
        if (!alive) return
        if (data && data.ok) {
          setCards(normaliseCards(data.cards || []))
          setDeletedCards(data.deletedCards || [])
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
    saveFallback(ordered, deletedCards)
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

  function openNewCard(lane = 'build') {
    setDraft({ ...blankDraft, lane })
    setSelectedId(null)
    setEditorOpen(true)
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
    saveFallback(next, deletedCards)
    setSelectedId(id)
    setEditorOpen(false)
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
    saveFallback(next, deleted)
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
    saveFallback(next, deleted)
    setSelectedId(cardId)
  }

  function resetLocalDraft() {
    setCards(seedCards)
    setDeletedCards([])
    saveFallback(seedCards, [])
    setMessage('Local draft reset. Database cards are untouched.')
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
        <section className="board" aria-label="V3 strategy kanban board">
          {lanes.map(lane => {
            const laneCards = cards.filter(card => card.lane === lane.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            const isTarget = selectedCard && selectedCard.lane !== lane.id
            return (
              <article
                key={lane.id}
                className={`lane ${isTarget ? 'lane-target' : ''}`}
                onDragOver={event => event.preventDefault()}
                onDrop={event => onDropLane(event, lane.id)}
              >
                <header className="lane-head">
                  <div>
                    <h2>{lane.title}</h2>
                    <p>{lane.cue}</p>
                  </div>
                  <span className="count">{cardCount(cards, lane.id)}</span>
                </header>
                <div className="lane-actions">
                  {isTarget ? <button className="move-here" type="button" onClick={() => moveCard(selectedCard.id, lane.id)}>Move here</button> : null}
                  <button className="add-small" type="button" onClick={() => openNewCard(lane.id)}>Add</button>
                </div>
                <div className="cards">
                  {laneCards.map(card => (
                    <button
                      key={card.id}
                      type="button"
                      className={`card ${selectedId === card.id ? 'selected' : ''}`}
                      draggable
                      onClick={() => setSelectedId(selectedId === card.id ? null : card.id)}
                      onDoubleClick={() => openEdit(card)}
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
                        <span className="kind">{card.kind}</span>
                        <span className="source">skillset.md {card.source || '-'}</span>
                      </span>
                      <strong>{card.title}</strong>
                      <span className="body">{card.body}</span>
                      <span className="acceptance">{card.acceptance}</span>
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </section>

        <aside className="inspector" aria-label="Card editor">
          {selectedCard && !editorOpen ? (
            <>
              <p className="eyebrow">Selected card</p>
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
              <p className="eyebrow">{draft.id ? 'Amend card' : 'Create card'}</p>
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
      </section>
    </main>
  )
}

const styles = `
:root {
  color-scheme: light;
  --ink: #162033;
  --muted: #667085;
  --line: #cfd7e6;
  --paper: #f4f7fb;
  --panel: #ffffff;
  --blue: #245fd6;
  --deep-blue: #153f9f;
  --orange: #c87422;
  --amber: #f2b84b;
  --teal: #1b8b95;
  --shadow: 0 16px 38px rgba(22, 32, 51, 0.12);
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
  padding: 24px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.kanban-hero, .story-strip, .kanban-note, .planner-shell {
  max-width: 1540px;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 14px;
  align-items: start;
}
.board {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(278px, 1fr);
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 18px;
  scroll-snap-type: x proximity;
}
.lane, .inspector {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: var(--shadow);
}
.lane {
  min-height: 62vh;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
}
.lane-target {
  outline: 2px solid rgba(36, 95, 214, 0.28);
  outline-offset: 2px;
}
.lane-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
}
.lane-head h2 {
  margin: 0;
  font-size: 17px;
  letter-spacing: 0;
}
.lane-head p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.32;
}
.count {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e9eefb;
  color: var(--deep-blue);
  font-size: 13px;
  font-weight: 850;
}
.lane-actions {
  padding: 10px 12px 0;
}
.lane-actions button {
  min-height: 34px;
  flex: 1;
  font-size: 13px;
}
.move-here {
  background: #eef4ff;
  color: var(--deep-blue);
  border-color: rgba(36, 95, 214, 0.36);
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}
.card {
  width: 100%;
  min-height: auto;
  border: 1px solid #d7deeb;
  border-left: 5px solid var(--blue);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  text-align: left;
  color: var(--ink);
  font: inherit;
  box-shadow: 0 8px 18px rgba(22, 32, 51, 0.08);
  cursor: grab;
  display: block;
}
.card:active { cursor: grabbing; }
.card.selected {
  border-color: var(--deep-blue);
  border-left-color: var(--orange);
  box-shadow: 0 0 0 3px rgba(36, 95, 214, 0.16), 0 10px 24px rgba(22, 32, 51, 0.14);
}
.card-topline {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 9px;
}
.kind, .source {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}
.kind { background: #e7f5f6; color: #126a72; }
.source { background: #fff3dc; color: #8c5418; }
.card strong {
  display: block;
  font-size: 16px;
  line-height: 1.2;
}
.body, .acceptance {
  display: block;
  margin-top: 9px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.36;
}
.acceptance {
  color: #42526d;
  border-top: 1px solid #edf1f7;
  padding-top: 9px;
}
.inspector {
  position: sticky;
  top: 16px;
  padding: 16px;
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
  background: #fff;
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
button:focus-visible, .ghost-link:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
  outline: 3px solid var(--amber);
  outline-offset: 2px;
}
@media (max-width: 920px) {
  .planner-shell {
    grid-template-columns: 1fr;
  }
  .inspector {
    position: static;
  }
}
@media (max-width: 760px) {
  .strategy-kanban {
    padding: 16px;
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
    grid-auto-columns: minmax(84vw, 1fr);
  }
  .lane {
    min-height: 58vh;
  }
}
`
