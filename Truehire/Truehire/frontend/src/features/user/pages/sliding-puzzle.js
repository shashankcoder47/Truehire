import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { useAuth } from '../../../context/AuthContext'

const GRID_SIZE = 4
const SWIPE_THRESHOLD = 24
const SOLVED_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]

function shuffleTiles(tiles) {
  const next = [...tiles]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j]
    next[j] = current
  }
  return next
}

function getInversions(tiles) {
  const values = tiles.filter((value) => value !== 0)
  let inversions = 0
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i] > values[j]) inversions += 1
    }
  }
  return inversions
}

function isSolvedBoard(tiles) {
  return tiles.every((value, index) => value === SOLVED_TILES[index])
}

function isSolvableBoard(tiles) {
  const inversions = getInversions(tiles)
  const emptyIndex = tiles.indexOf(0)
  const emptyRowFromBottom = GRID_SIZE - Math.floor(emptyIndex / GRID_SIZE)

  if (GRID_SIZE % 2 !== 0) {
    return inversions % 2 === 0
  }
  if (emptyRowFromBottom % 2 === 0) {
    return inversions % 2 !== 0
  }
  return inversions % 2 === 0
}

function createShuffledBoard() {
  let candidate = SOLVED_TILES
  do {
    candidate = shuffleTiles(SOLVED_TILES)
  } while (!isSolvableBoard(candidate) || isSolvedBoard(candidate))
  return candidate
}

function isAdjacent(indexA, indexB) {
  const rowA = Math.floor(indexA / GRID_SIZE)
  const colA = indexA % GRID_SIZE
  const rowB = Math.floor(indexB / GRID_SIZE)
  const colB = indexB % GRID_SIZE
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1
}

function getIndexFromRowCol(row, col) {
  return row * GRID_SIZE + col
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function SlidingPuzzle() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [tiles, setTiles] = useState(SOLVED_TILES)
  const [initialTiles, setInitialTiles] = useState(SOLVED_TILES)
  const [moves, setMoves] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const puzzleSolved = useMemo(() => isSolvedBoard(tiles), [tiles])
  const canPlayPuzzle = gameStarted && !puzzleSolved

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      setIsLoading(false)
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!gameStarted || puzzleSolved) return undefined
    const timer = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, puzzleSolved])

  const handleStartOrShuffle = () => {
    const shuffled = createShuffledBoard()
    setTiles(shuffled)
    setInitialTiles(shuffled)
    setMoves(0)
    setElapsedSeconds(0)
    setGameStarted(true)
  }

  const handleRestart = () => {
    if (!gameStarted) {
      handleStartOrShuffle()
      return
    }
    setTiles([...initialTiles])
    setMoves(0)
    setElapsedSeconds(0)
    setGameStarted(true)
  }

  const handleTileClick = (tileValue) => {
    if (!canPlayPuzzle || tileValue === 0) return
    const tileIndex = tiles.indexOf(tileValue)
    const emptyIndex = tiles.indexOf(0)
    if (!isAdjacent(tileIndex, emptyIndex)) return

    const nextTiles = [...tiles]
    nextTiles[emptyIndex] = tileValue
    nextTiles[tileIndex] = 0
    setTiles(nextTiles)
    setMoves((previous) => previous + 1)
  }

  const handlePushMove = useCallback((direction) => {
    if (!canPlayPuzzle) return

    const emptyIndex = tiles.indexOf(0)
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE)
    const emptyCol = emptyIndex % GRID_SIZE
    let targetRow = emptyRow
    let targetCol = emptyCol

    if (direction === "up") targetRow -= 1
    if (direction === "down") targetRow += 1
    if (direction === "left") targetCol -= 1
    if (direction === "right") targetCol += 1

    if (
      targetRow < 0 ||
      targetRow >= GRID_SIZE ||
      targetCol < 0 ||
      targetCol >= GRID_SIZE
    ) {
      return
    }

    const targetIndex = getIndexFromRowCol(targetRow, targetCol)
    const nextTiles = [...tiles]
    nextTiles[emptyIndex] = nextTiles[targetIndex]
    nextTiles[targetIndex] = 0
    setTiles(nextTiles)
    setMoves((previous) => previous + 1)
  }, [canPlayPuzzle, tiles])

  const handleBoardTouchStart = (event) => {
    const touch = event.touches?.[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleBoardTouchEnd = (event) => {
    const touch = event.changedTouches?.[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY)

    if (horizontal && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      handlePushMove(deltaX > 0 ? "right" : "left")
      return
    }
    if (!horizontal && Math.abs(deltaY) >= SWIPE_THRESHOLD) {
      handlePushMove(deltaY > 0 ? "down" : "up")
    }
  }

  useEffect(() => {
    if (!canPlayPuzzle) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "ArrowUp") {
        event.preventDefault()
        handlePushMove("up")
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        handlePushMove("down")
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        handlePushMove("left")
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        handlePushMove("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canPlayPuzzle, handlePushMove])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>Sliding Puzzle | TrueHire</title>
      </Head>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef2ff_38%,#f8fafc_72%,#e0e7ff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-5rem] top-20 h-72 w-72 rounded-full bg-sky-200/60 blur-[120px]" />
          <div className="absolute right-[-4rem] top-16 h-80 w-80 rounded-full bg-indigo-200/55 blur-[140px]" />
          <div className="absolute bottom-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-100/55 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(242,247,255,0.88))] p-7 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-9">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500">Quick Action</p>
                  <h1 className="mt-3 max-w-xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
                    Sliding Puzzle
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Rearrange the board into the solved state by guiding the empty slot through the grid.
                    Use taps, swipes, or keyboard arrows to finish cleanly and fast.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartOrShuffle}
                    className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#4f46e5,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_-20px_rgba(79,70,229,0.58)] transition hover:scale-[1.01]"
                  >
                    {gameStarted ? "Shuffle Again" : "Start Puzzle"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
                  >
                    Restart Run
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/overview")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[36px] border border-slate-200/70 bg-[linear-gradient(160deg,#111827_0%,#1e3a8a_45%,#4338ca_100%)] p-7 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]">
              <div className="flex h-full flex-col justify-between gap-7">
                <div>
                  <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/75">
                    Puzzle Brief
                  </div>
                  <h2 className="mt-5 text-3xl font-bold tracking-[-0.04em]">
                    Focus on clean moves, not speed alone.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/75">
                    The best runs usually come from controlling the empty tile first, then moving the numbered blocks with intention.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <HighlightCard label="Board" value="4 x 4" />
                  <HighlightCard label="Controls" value="Tap / Swipe" />
                  <HighlightCard label="Goal" value="1 to 15" />
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[34px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-7">
              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <StatCard label="Moves" value={moves} accent="from-sky-500 to-cyan-400" />
                <StatCard label="Time" value={formatDuration(elapsedSeconds)} accent="from-indigo-500 to-violet-500" />
                <StatCard
                  label="Status"
                  value={!gameStarted ? "Ready" : puzzleSolved ? "Solved" : "In Progress"}
                  accent={puzzleSolved ? "from-emerald-500 to-teal-400" : "from-slate-700 to-slate-500"}
                />
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">How to play</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <li>Tap a tile next to the empty space to slide it.</li>
                  <li>Swipe on mobile or use arrow keys for directional control.</li>
                  <li>Match the solved order with the empty tile in the final slot.</li>
                </ul>
              </div>

              {!gameStarted && (
                <div className="mt-6 rounded-[24px] border border-indigo-200 bg-indigo-50/80 px-4 py-4 text-sm text-indigo-700">
                  Start the puzzle to generate a solvable board and begin tracking your run.
                </div>
              )}

              {gameStarted && puzzleSolved && (
                <div className="mt-6 rounded-[24px] border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                  You solved it in {moves} moves and {formatDuration(elapsedSeconds)}. Nice work.
                </div>
              )}
            </div>

            <section className="rounded-[34px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Live Board</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Make each move count.</h2>
                  </div>
                  <p className="text-sm text-slate-500">Tap a highlighted tile, or use push controls below.</p>
                </div>

                <div
                  className="mx-auto w-full max-w-[min(92vw,28rem)] touch-none rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] p-4 shadow-inner sm:p-5"
                  onTouchStart={handleBoardTouchStart}
                  onTouchEnd={handleBoardTouchEnd}
                >
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                    {tiles.map((tileValue, index) => {
                      const emptyIndex = tiles.indexOf(0)
                      const canMove = tileValue !== 0 && isAdjacent(index, emptyIndex) && canPlayPuzzle
                      return tileValue === 0 ? (
                        <div
                          key={`empty-${index}`}
                          className="aspect-square rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(135deg,#e2e8f0,#cbd5e1)] opacity-80"
                        />
                      ) : (
                        <button
                          key={tileValue}
                          type="button"
                          onClick={() => handleTileClick(tileValue)}
                          disabled={!canMove}
                          className={`aspect-square rounded-2xl text-base font-bold transition sm:text-lg ${
                            canMove
                              ? "bg-[linear-gradient(145deg,#0f172a,#4f46e5,#38bdf8)] text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)] hover:scale-[1.03]"
                              : "cursor-not-allowed border border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {tileValue}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[min(92vw,28rem)] rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                  <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Push Controls
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div />
                    <PushButton label="Up" onClick={() => handlePushMove("up")} disabled={!canPlayPuzzle} />
                    <div />
                    <PushButton label="Left" onClick={() => handlePushMove("left")} disabled={!canPlayPuzzle} />
                    <PushButton label="Down" onClick={() => handlePushMove("down")} disabled={!canPlayPuzzle} />
                    <PushButton label="Right" onClick={() => handlePushMove("right")} disabled={!canPlayPuzzle} />
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white">
      <div className={`h-2 bg-gradient-to-r ${accent}`} />
      <div className="px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      </div>
    </div>
  )
}

function HighlightCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  )
}

function PushButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
        disabled
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : "bg-[linear-gradient(135deg,#0f172a,#4f46e5,#38bdf8)] text-white shadow-[0_12px_25px_rgba(79,70,229,0.22)] hover:brightness-105"
      }`}
    >
      {label}
    </button>
  )
}



