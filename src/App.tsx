import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { createGame, findHint, getLevel, LEVELS, remainingBlockers, remainingJelly, starsForScore, swap, useBooster as applyBooster } from './game'
import type { GameState } from './game'
import { CandyArt } from './components/Candy'
import { loadProgress, saveProgress } from './lib/storage'
import type { Progress } from './lib/storage'
import { playSound } from './lib/audio'
import { registerServiceWorker } from './lib/pwa'

type Modal = 'help' | 'map' | 'pause' | 'install' | 'result' | 'restart' | null
const colorNames = ['red bean', 'blue diamond', 'orange sweet', 'green pillow', 'purple blossom', 'yellow drop']
const randomSeed = () => globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now()

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    sound: <><path d="m11 4-6 5H2v6h3l6 5z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    mute: <><path d="m11 4-6 5H2v6h3l6 5z"/><path d="m16 9 6 6m0-6-6 6"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2.5m0 3h.01"/></>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    arrow: <><path d="m9 5 7 7-7 7"/></>,
    close: <path d="m6 6 12 12m0-12L6 18"/>,
    home: <><path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6"/></>,
    hint: <><path d="M8 16c0-3-3-3-3-7a7 7 0 1 1 14 0c0 4-3 4-3 7zm1 4h6m-5 3h4"/></>,
    hammer: <><path d="m5 20 10-10M10 6l5-5 8 8-5 5z"/><path d="m3 18 3 3"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.help}</svg>
}

function Stars({ count, large = false }: { count: number; large?: boolean }) {
  return <span role="img" className={`stars ${large ? 'stars-large' : ''}`} aria-label={`${count} of 3 stars`}>{[1, 2, 3].map(n => <svg key={n} viewBox="0 0 24 24" className={n <= count ? 'earned' : ''} aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z"/></svg>)}</span>
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="dialog" onCancel={e => { e.preventDefault(); onClose() }} aria-labelledby="dialog-title"><button className="icon-btn dialog-close" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button><h2 id="dialog-title">{title}</h2>{children}</dialog>
}

function Landscape() {
  return <div className="landscape" aria-hidden="true"><div className="cloud cloud-one"/><div className="cloud cloud-two"/><div className="cloud cloud-three"/><div className="hill hill-back"/><div className="hill hill-front"/><div className="lollipop lollipop-one"><i/></div><div className="lollipop lollipop-two"><i/></div><div className="floating-sweet sweet-one"><CandyArt color={4} special="none"/></div><div className="floating-sweet sweet-two"><CandyArt color={2} special="none"/></div><span className="sky-spark s1">✦</span><span className="sky-spark s2">✧</span><span className="sky-spark s3">✦</span></div>
}

export default function App() {
  const [initial] = useState(() => loadProgress())
  const [progress, setProgress] = useState<Progress>(initial)
  const [game, setGame] = useState<GameState>(() => initial.savedGame ?? createGame(initial.unlocked, randomSeed()))
  const [selected, setSelected] = useState<number | null>(null)
  const [hint, setHint] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [popping, setPopping] = useState<number[]>([])
  const [presentedGame, setPresentedGame] = useState<GameState | null>(null)
  const [modal, setModal] = useState<Modal>(initial.savedGame && initial.savedGame.status !== 'playing' ? 'result' : null)
  const [hammer, setHammer] = useState(false)
  const [message, setMessage] = useState('A little match. A little magic.')
  const [toast, setToast] = useState('')
  const [offlineReady, setOfflineReady] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null)
  const [storageWarning, setStorageWarning] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const gesture = useRef<{ index: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const displayGame = presentedGame ?? game
  const level = getLevel(game.levelId)
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0)
  const earnedStars = starsForScore(game.levelId, game.score)
  const jellyLeft = remainingJelly(game)
  const frostingLeft = remainingBlockers(game)
  const percent = Math.min(100, game.score / level.starScores[2] * 100)
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout) }
  }, [])
  useEffect(() => {
    const stored = { ...progress, savedGame: game }
    setStorageWarning(!saveProgress(stored))
  }, [game, progress])
  useEffect(() => {
    const onOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
    void registerServiceWorker({ onReady: () => setOfflineReady(true), onUpdate: reg => setUpdate(reg) })
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOnline) }
  }, [])
  useEffect(() => {
    const pauseOnHide = () => { if (document.hidden) setModal(current => current ?? 'pause') }
    document.addEventListener('visibilitychange', pauseOnHide)
    return () => document.removeEventListener('visibilitychange', pauseOnHide)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(timeout)
  }, [toast])

  function finish(next: GameState, showResult = true) {
    let nextProgress = progress
    if (next.status === 'won') {
      nextProgress = { ...progress, unlocked: Math.max(progress.unlocked, Math.min(LEVELS.length, next.levelId + 1)), stars: { ...progress.stars, [next.levelId]: Math.max(progress.stars[next.levelId] ?? 0, starsForScore(next.levelId, next.score)) }, best: { ...progress.best, [next.levelId]: Math.max(progress.best[next.levelId] ?? 0, next.score) } }
      setProgress(nextProgress)
      playSound('win', progress.sound)
    }
    setStorageWarning(!saveProgress({ ...nextProgress, savedGame: next }))
    setGame(next)
    if (next.status !== 'playing' && showResult) setModal('result')
  }

  function startLevel(id: number) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    finish(createGame(id, randomSeed()), false)
    setPresentedGame(null)
    setSelected(null); setHint([]); setHammer(false); setBusy(false); setPopping([])
    setMessage('A little match. A little magic.'); setModal(null)
  }

  function perform(a: number, b: number) {
    if (busy || modal || game.status !== 'playing') return
    const result = swap(game, a, b)
    setSelected(null); setHint([])
    if (!result.valid) {
      setMessage('Try a swap that makes a match!'); playSound('invalid', progress.sound)
      return
    }
    setBusy(true)
    setPresentedGame(game)
    finish(result.game, false)
    playSound('swap', progress.sound)
    const indices = [...new Set(result.events.flatMap(e => e.indices))]
    setPopping(indices)
    const gain = result.game.score - game.score
    const cascades = result.events.filter(e => e.type === 'clear').length
    setMessage(gain >= 1000 ? 'Sugar spectacular!' : cascades >= 3 ? 'Sweet cascade!' : gain >= 500 ? 'Delicious!' : 'Sweet match!')
    later(() => {
      setPopping([]); setPresentedGame(null); setBusy(false)
      if (result.game.status !== 'playing') setModal('result')
      playSound('match', progress.sound)
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 40 : 340)
  }

  function pick(index: number) {
    if (busy || modal || game.status !== 'playing') return
    if (hammer) {
      const result = applyBooster(game, 'hammer', index)
      setHammer(false); setSelected(null); setHint([])
      if (result.valid) { finish(result.game); playSound('match', progress.sound); setMessage('One sweet little smash!') }
      return
    }
    if (!game.board[index]) return
    playSound('select', progress.sound)
    if (selected === index) { setSelected(null); return }
    if (selected !== null && (Math.abs(selected - index) === 8 || (Math.floor(selected / 8) === Math.floor(index / 8) && Math.abs(selected - index) === 1))) { perform(selected, index); return }
    setSelected(index); setHint([])
  }

  function pointerDown(e: PointerEvent, index: number) {
    gesture.current = { index, x: e.clientX, y: e.clientY }
    suppressClick.current = false
  }
  function pointerUp(e: PointerEvent) {
    const start = gesture.current
    gesture.current = null
    if (!start || hammer) return
    const dx = e.clientX - start.x, dy = e.clientY - start.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return
    suppressClick.current = true
    const row = Math.floor(start.index / 8), col = start.index % 8
    let next = -1
    if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && col < 7) next = start.index + 1; if (dx < 0 && col > 0) next = start.index - 1 }
    else { if (dy > 0 && row < 7) next = start.index + 8; if (dy < 0 && row > 0) next = start.index - 8 }
    if (next >= 0) perform(start.index, next)
  }

  function showHint() {
    if (busy || game.status !== 'playing') return
    const pair = findHint(game)
    setSelected(null); setHammer(false)
    if (pair) { setHint(pair); setMessage('These two have a little chemistry.'); playSound('select', progress.sound) }
  }

  return <>
    <Landscape />
    <div className="app-shell">
      <header className="header"><a href="#" className="brand" aria-label="Sugar Spell home" onClick={e => { e.preventDefault(); setModal('map') }}><span className="brand-swirl" aria-hidden="true">✺</span><span>sugar<span className="brand-second">spell<span className="brand-spark">✦</span></span></span></a><nav aria-label="Game controls"><span className="free-label"><Icon name="heart" size={15}/> Made for a sweet break</span><button className="icon-btn" aria-label={progress.sound ? 'Turn sound off' : 'Turn sound on'} aria-pressed={progress.sound} onClick={() => { setProgress(p => ({ ...p, sound: !p.sound })); playSound('select', !progress.sound) }}><Icon name={progress.sound ? 'sound' : 'mute'}/></button><button className="icon-btn" aria-label="How to play" onClick={() => setModal('help')}><Icon name="help"/></button><button className="icon-btn install-top" aria-label="Install on iPhone" onClick={() => setModal('install')}><Icon name="download"/></button></nav></header>

      <main className="main-layout">
        <section className="play-section" aria-label="Candy game">
          <div className="level-heading"><div><div className="eyebrow"><span/> THE SWEET MEADOWS</div><h1>{level.name}</h1><p>Make a match. Find your happy place.</p></div><button className="level-pill" onClick={() => setModal('map')}>Level {game.levelId}<Icon name="arrow" size={16}/></button></div>

          <div className="game-card">
            <div className="game-stats"><div className="moves-counter"><span>MOVES</span><strong data-testid="moves">{game.movesLeft}</strong></div><div className="score-stats"><div className="score-label"><span>SCORE <strong data-testid="score">{game.score.toLocaleString()}</strong></span><Stars count={earnedStars}/></div><div className="score-track" role="progressbar" aria-label="Score toward three stars" aria-valuemin={0} aria-valuemax={level.starScores[2]} aria-valuenow={Math.min(game.score, level.starScores[2])}><div style={{ width: `${percent}%` }}/>{level.starScores.map((s, i) => <span key={s} style={{ left: `${Math.min(96, s / level.starScores[2] * 96)}%` }} aria-hidden="true">{i === 0 ? '★' : '·'}</span>)}</div><span className="goal-label">GOAL {level.targetScore.toLocaleString()}{level.clearJelly ? ` · ${jellyLeft} jelly left` : ''}{level.clearBlockers ? ` · ${frostingLeft} frosting left` : ''}</span></div><button className="pause-button" aria-label="Pause game" onClick={() => setModal('pause')}><Icon name="pause"/></button></div>

            <div className={`board-wrap ${hammer ? 'hammer-mode' : ''}`}><div className="board" ref={boardRef} role="group" aria-label="Candy board, 8 rows and 8 columns. Tap two adjacent candies or swipe to swap." aria-busy={busy} data-testid="board" onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null }}>
              {displayGame.board.map((candy, index) => <button key={index} data-cell={index} className={`cell ${(Math.floor(index / 8) + index % 8) % 2 ? 'cell-alt' : ''} ${selected === index ? 'selected' : ''} ${hint.includes(index) ? 'hinted' : ''} ${popping.includes(index) ? 'popping' : ''} ${game.jelly[index] ? 'jelly' : ''} ${game.blockers[index] ? 'blocked' : ''}`} aria-label={`Row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}: ${candy ? `${colorNames[candy.color]}${candy.special !== 'none' ? `, ${candy.special}` : ''}` : 'frosting'}${game.jelly[index] ? ', jelly' : ''}${game.blockers[index] ? `, ${game.blockers[index]} frosting layers` : ''}`} aria-pressed={selected === index} disabled={busy || game.status !== 'playing'} onPointerDown={e => pointerDown(e, index)} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } pick(index) }} onKeyDown={e => {
                const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }
                if (e.key in offsets) { e.preventDefault(); const next = index + offsets[e.key]; if (next >= 0 && next < 64 && !((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && Math.floor(next / 8) !== Math.floor(index / 8))) boardRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus() }
                if (e.key === 'Escape') { setSelected(null); setHammer(false); setHint([]) }
              }}>{candy ? <span key={candy.id} className="candy"><CandyArt color={candy.color} special={candy.special}/></span> : <span className="frosting-art" aria-hidden="true">✿</span>}{game.jelly[index] > 1 && <span className="double-jelly" aria-hidden="true"/>}</button>)}
            </div>{busy && <span className="match-praise" aria-hidden="true">{message}</span>}</div>

            <div className="board-caption" aria-live="polite">{hammer ? 'Tap a candy or frosting to use your hammer.' : message}</div>
            <div className="boosters" aria-label="Boosters"><button className={`booster ${hammer ? 'active' : ''}`} aria-label={`Lollipop hammer, ${game.boosters.hammer} left`} aria-pressed={hammer} disabled={busy || game.status !== 'playing' || game.boosters.hammer === 0} onClick={() => { setHammer(h => !h); setSelected(null); setHint([]) }}><span className="booster-icon hammer-icon"><Icon name="hammer" size={27}/><b>{game.boosters.hammer}</b></span><span>Sweet smash</span></button><button className="booster" aria-label={`Shuffle, ${game.boosters.shuffle} left`} disabled={busy || game.status !== 'playing' || game.boosters.shuffle === 0} onClick={() => { const result = applyBooster(game, 'shuffle'); if (result.valid) { finish(result.game); setHint([]); setSelected(null); setHammer(false); setMessage('A fresh little mix!'); playSound('swap', progress.sound) } }}><span className="booster-icon shuffle-icon"><Icon name="refresh" size={27}/><b>{game.boosters.shuffle}</b></span><span>Sugar shuffle</span></button><button className="booster" aria-label="Show a hint" disabled={busy || game.status !== 'playing'} onClick={showHint}><span className="booster-icon hint-icon"><Icon name="hint" size={27}/><b>∞</b></span><span>A little hint</span></button></div>
          </div>
          <p className="play-tip"><span aria-hidden="true">✧</span> {game.status === 'playing' ? 'Swap two sweets. Match 3 or more. Let the magic happen.' : <button className="text-button" onClick={() => setModal('result')}>View your results <Icon name="arrow" size={14}/></button>}</p>
        </section>

        <aside className="sidebar">
          <section className="journey-card"><div className="section-topline"><span className="eyebrow">YOUR SWEET ESCAPE</span><span className="star-total">★ {totalStars}<small> / 60</small></span></div><h2>A sprinkle of<br/>adventure.</h2><p>Little wins. Lovely places.<br/>One sweet level at a time.</p><div className="mini-map" aria-label={`Level ${game.levelId} of 20`}><div className="map-cloud"/><div className="map-hill map-hill-one"/><div className="map-hill map-hill-two"/><svg className="map-path" viewBox="0 0 300 230" aria-hidden="true"><path d="M40 214C15 152 240 210 225 142S48 148 80 92s135-42 132-83"/></svg>{[1, 2, 3, 4, 5].map((n, i) => { const id = Math.min(LEVELS.length - 4, Math.max(1, game.levelId - 1)) + i; return <button key={n} style={{ left: `${[12, 48, 72, 24, 62][i]}%`, bottom: `${[7, 17, 38, 55, 78][i]}%` }} className={`map-node ${id === game.levelId ? 'current' : ''} ${id > progress.unlocked ? 'locked' : ''}`} disabled={id > progress.unlocked} aria-label={`Play level ${id}${id > progress.unlocked ? ', locked' : ''}`} onClick={() => id === game.levelId ? setToast('You’re already on this sweet adventure!') : startLevel(id)}>{id > progress.unlocked ? <Icon name="lock" size={16}/> : id}{id === game.levelId && <span className="you-label">YOU</span>}</button> })}<span className="map-flower flower-one" aria-hidden="true">✿</span><span className="map-flower flower-two" aria-hidden="true">✿</span></div><button className="journey-button" onClick={() => setModal('map')}>Explore the journey<Icon name="arrow" size={16}/></button></section>

          <section className="recipe-card"><div className="recipe-title"><span className="recipe-spark" aria-hidden="true">✦</span><h2>A recipe for magic</h2></div><div className="recipe-row"><span className="recipe-candy"><CandyArt color={1} special="striped-h"/></span><div><strong>Match 4</strong><p>A stripe of something special.</p></div></div><div className="recipe-row"><span className="recipe-candy"><CandyArt color={4} special="wrapped"/></span><div><strong>Make an L or T</strong><p>A wonderfully sweet explosion.</p></div></div><div className="recipe-row"><span className="recipe-candy"><CandyArt color={0} special="color-bomb"/></span><div><strong>Match 5 in a line</strong><p>A little rainbow. A lot of wow.</p></div></div><button className="text-button" onClick={() => setModal('help')}>Show me how<Icon name="arrow" size={14}/></button></section>
          <button className="install-card" onClick={() => setModal('install')}><span className="phone-icon" aria-hidden="true">♡</span><span><strong>Take a little sweet with you.</strong><small>Add Sugar Spell to your iPhone</small></span><Icon name="arrow" size={16}/></button>
        </aside>
      </main>
      <footer className="footer"><span>SUGAR SPELL <i>✦</i> A little escape. A lot of sweet.</span><span className="connection"><i className={offlineReady || !online ? 'ready' : ''}/>{!online ? 'You’re playing offline' : offlineReady ? 'Ready for offline play' : 'Just you & the sweets'}</span><button onClick={() => setModal('install')}>Play anywhere<Icon name="arrow" size={12}/></button></footer>
    </div>
    {storageWarning && <div className="notice" role="status">Progress can’t be saved in this browser. Allow site storage to keep your levels.</div>}
    {update && <div className="update-banner" role="status"><span>A fresh batch is ready. Your progress is saved.</span><button disabled={busy} onClick={() => { const worker = update.waiting; if (!worker) return; navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); worker.postMessage({ type: 'SKIP_WAITING' }) }}>Update game</button></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
    {modal && <Dialog title={modal === 'help' ? 'A little candy magic' : modal === 'map' ? 'Your sweet journey' : modal === 'install' ? 'Sweetness to go' : modal === 'pause' ? 'Take a little breather' : modal === 'restart' ? 'A fresh start?' : game.status === 'won' ? 'Sweet success!' : 'So close, sweet thing!'} onClose={() => setModal(null)}>
      {modal === 'help' && <><p>Tap two neighboring candies, or swipe a candy, to swap. Match at least three of the same color. Swaps that don’t match are free.</p><div className="help-candies">{[0, 1, 4].map((c, i) => <span key={c}><CandyArt color={c} special={['striped-h', 'wrapped', 'color-bomb'][i]}/><strong>{['Match 4', 'Make T / L', 'Match 5'][i]}</strong></span>)}</div><p>Striped sweets clear a row or column. Wrapped sweets burst around them. Swap a rainbow truffle with any candy to clear its color. Swap two special candies for a bigger surprise.</p><p>Reach the score goal before your moves run out. Later levels add jelly to clear with matches and frosting to break with adjacent matches. Boosters refresh every level; hints are always free.</p><p className="small-note">Keyboard: arrow keys move focus, Enter selects, Escape clears selection. Your progress stays on this device. No timers, lives, ads, or purchases.</p><button className="primary" onClick={() => { setProgress(p => ({ ...p, tutorialSeen: true })); setModal(null) }}>Let’s make some magic</button></>}
      {modal === 'map' && <><p>Twenty little adventures. Earn stars, unlock new places, and revisit your favorites.</p><div className="level-grid">{LEVELS.map(l => <button key={l.id} className={`level-tile ${l.id === game.levelId ? 'current' : ''}`} disabled={l.id > progress.unlocked} aria-label={`Level ${l.id}: ${l.name}${l.id > progress.unlocked ? ', locked' : ''}`} onClick={() => l.id === game.levelId ? setModal(null) : startLevel(l.id)}>{l.id > progress.unlocked ? <Icon name="lock"/> : <strong>{l.id}</strong>}<Stars count={progress.stars[l.id] ?? 0}/></button>)}</div><p className="small-note">{progress.unlocked} of 20 levels unlocked · {totalStars} stars collected</p></>}
      {modal === 'pause' && <><div className="pause-illustration" aria-hidden="true"><CandyArt color={0} special="none"/></div><p>Your sweets aren’t going anywhere.<br/>Come back whenever you’re ready.</p><button className="primary" onClick={() => setModal(null)}>Keep playing<Icon name="arrow" size={18}/></button><div className="dialog-actions"><button className="secondary" onClick={() => setModal('map')}><Icon name="home" size={18}/>Level journey</button><button className="secondary" onClick={() => setModal('restart')}><Icon name="refresh" size={18}/>Restart level</button></div></>}
      {modal === 'restart' && <><p>This starts level {game.levelId} again with a fresh board. Your stars and completed levels are safe.</p><button className="primary" onClick={() => startLevel(game.levelId)}>Restart this level</button><button className="secondary full-width" onClick={() => setModal(null)}>Keep this board</button></>}
      {modal === 'install' && <><div className="install-illustration" aria-hidden="true">✺</div><p>Keep a pocket-sized happy place on every iPhone. Open this game in <strong>Safari</strong>, then:</p><ol className="install-steps"><li><span>1</span>Tap Safari’s Share button <b aria-hidden="true">↥</b></li><li><span>2</span>Choose <strong>Add to Home Screen</strong></li><li><span>3</span>Tap <strong>Add</strong>, and find your sweet escape.</li></ol><p>Let the first load finish online. When “Ready for offline play” appears, you can play without a connection.</p><p className="small-note">Free to play. No account needed. Each device keeps its own progress. Clearing website data removes that device’s saves.</p><button className="primary" onClick={() => setModal(null)}>Sounds sweet</button></>}
      {modal === 'result' && <><Stars count={earnedStars} large/><p>{game.status === 'won' ? game.levelId === LEVELS.length ? 'You’ve explored every corner of the Sweet Meadows! Revisit any level to collect all 60 stars.' : 'Another lovely little win. The next adventure is waiting.' : 'Every sweet adventure takes a little practice. Try a fresh board — you’ve got this.'}</p><div className="result-score"><span>LEVEL {game.levelId} SCORE</span><strong>{game.score.toLocaleString()}</strong></div><button className="primary" onClick={() => startLevel(game.status === 'won' && game.levelId < LEVELS.length ? game.levelId + 1 : game.levelId)}>{game.status === 'won' && game.levelId < LEVELS.length ? 'Next sweet adventure' : 'Play again'}<Icon name="arrow" size={18}/></button><button className="secondary full-width" onClick={() => setModal('map')}>Explore the journey</button></>}
    </Dialog>}
  </>
}
