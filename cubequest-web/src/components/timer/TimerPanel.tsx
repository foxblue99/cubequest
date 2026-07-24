'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateScramble, generate2x2Scramble, formatTime } from '@/lib/scramble';
import { calcAo5, calcAo12, calcStats, type AvgInput } from '@/lib/averages';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { Penalty, type SolveResult } from '@/types';
import GhostRace from './GhostRace';

type TimerPhase = 'idle' | 'inspection' | 'running' | 'stopped';

const INSPECTION_SECONDS = 15;

/** Local result entry (combines SolveResult with AvgInput shape) */
interface LocalResult {
  id: string;
  eventType: string;
  scramble: string;
  timeMs: number | null;
  penalty: Penalty;
  finalTimeMs: number | null;
  isPB: boolean;
  note?: string;
  createdAt: string;
}

function resultToAvgInput(r: LocalResult): AvgInput {
  return { timeMs: r.timeMs, penalty: r.penalty };
}

export default function TimerPanel() {
  const auth = getAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setIsAuthenticated(!!getAuth()?.token); setHydrated(true); }, []);

  // --- State ---
  const [puzzle, setPuzzle] = useState<'333'|'222'>('333');
  const [trainingMode, setTrainingMode] = useState<'full'|'cross'|'f2l'|'oll'|'pll'>('full');
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [scramble, setScramble] = useState(() => generateScramble());
  const [inspectionRemaining, setInspectionRemaining] = useState(INSPECTION_SECONDS);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [results, setResults] = useState<LocalResult[]>([]);
  const [stats, setStats] = useState<{ best: number | null; ao5: number | 'DNF' | null; ao12: number | 'DNF' | null; count: number }>({
    best: null,
    ao5: null,
    ao12: null,
    count: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const newScramble = useCallback(() => puzzle === '222' ? generate2x2Scramble() : generateScramble(), [puzzle]);

  // --- Refs ---
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHoldingRef = useRef(false);
  const timerAreaRef = useRef<HTMLDivElement>(null);

  // --- Split timing state ---
  const [stageSplits, setStageSplits] = useState<{cross:number|null,f2l:number|null,oll:number|null,pll:number|null}>({cross:null,f2l:null,oll:null,pll:null});
  const [currentStage, setCurrentStage] = useState<'wait'|'cross'|'f2l'|'oll'|'pll'|'done'>('wait');
  const stageStartRef = useRef<number>(0);

  const advanceStage = () => {
    const now = Date.now();
    if (currentStage === 'wait') {
      setCurrentStage('cross');
      stageStartRef.current = now;
    } else if (currentStage !== 'done') {
      const elapsed = now - stageStartRef.current;
      setStageSplits(prev => ({...prev, [currentStage]: elapsed}));
      const stages: Array<'cross'|'f2l'|'oll'|'pll'> = ['cross','f2l','oll','pll'];
      const idx = stages.indexOf(currentStage as any);
      if (idx < 3) {
        setCurrentStage(stages[idx+1]);
        stageStartRef.current = now;
      } else {
        setCurrentStage('done');
      }
    }
  };
  const resetStages = () => {
    setStageSplits({cross:null,f2l:null,oll:null,pll:null});
    setCurrentStage('wait');
    stageStartRef.current = 0;
  };

  // --- Load existing results on mount ---
  useEffect(() => {
    if (getAuth()?.token) {
      loadResults();
    }
  }, []);

  // --- Recalculate stats when results change ---
  useEffect(() => {
    const fullSolves = results.filter(r => r.eventType === '333' || r.eventType === '222');
    const avgInputs = fullSolves.map(resultToAvgInput);
    setStats(calcStats(avgInputs));
  }, [results]);

  // --- Keyboard controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        // During running: space stops the timer
        if (phase === 'running') {
          stopTimer();
          setPhase('stopped');
          return;
        }
        if (!isHoldingRef.current) {
          isHoldingRef.current = true;
          handlePressDown();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isHoldingRef.current) {
          isHoldingRef.current = false;
          handlePressUp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, inspectionRemaining, elapsedMs]);

  // --- Load results from API ---
  const loadResults = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = (await api.getMyResults({ limit: '50' })) as { results?: SolveResult[] };
      if (res?.results) {
        setResults(res.results as LocalResult[]);
      }
    } catch {
      // Silently fail — timer works offline
    }
  };

  // --- Timer loop with requestAnimationFrame ---
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
    const tick = () => {
      setElapsedMs(performance.now() - startTimeRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimer = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    const final = performance.now() - startTimeRef.current;
    setElapsedMs(final);
  }, []);

  // --- Inspection countdown ---
  const startInspection = useCallback(() => {
    setInspectionRemaining(INSPECTION_SECONDS);
    inspectionIntervalRef.current = setInterval(() => {
      setInspectionRemaining((prev) => {
        if (prev <= 1) {
          // Time's up — auto-start
          if (inspectionIntervalRef.current) {
            clearInterval(inspectionIntervalRef.current);
          }
          setPhase('running');
          startTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startTimer]);

  const stopInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // --- Press handlers ---
  const handlePressDown = useCallback(() => {
    if (phase === 'idle') {
      // Start inspection
      setPhase('inspection');
      setSaveError(null);
      startInspection();
    } else if (phase === 'running') {
      // Stop the timer
      stopTimer();
      setPhase('stopped');
    }
  }, [phase, startInspection, stopTimer]);

  const handlePressUp = useCallback(() => {
    if (phase === 'inspection') {
      // Release during inspection → start timer
      stopInspection();
      setPhase('running');
      startTimer();
    }
  }, [phase, stopInspection, startTimer]);

  // --- Touch handlers ---
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      isHoldingRef.current = true;
      handlePressDown();
    },
    [handlePressDown]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        handlePressUp();
      }
    },
    [handlePressUp]
  );

  // --- Save result ---
  const saveResult = async (penalty: Penalty, finalMs: number) => {
    const currentAuth = getAuth();
    if (!currentAuth?.token) {
      // Add locally without saving
      const local: LocalResult = {
        id: `local-${Date.now()}`,
        eventType: trainingMode !== 'full' ? trainingMode : (puzzle === '222' ? '222' : '333'),
        scramble,
        timeMs: elapsedMs,
        penalty,
        finalTimeMs: finalMs,
        isPB: false,
        createdAt: new Date().toISOString(),
      };
      setResults((prev) => [local, ...prev]);
      resetTimer();
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = (await api.createResult({
        eventType: trainingMode !== 'full' ? trainingMode : (puzzle === '222' ? '222' : '333'),
        scramble,
        timeMs: Math.round(elapsedMs),
        penalty,
        crossMs: trainingMode === 'cross' ? Math.round(elapsedMs) : (stageSplits.cross ?? undefined),
        f2lMs: trainingMode === 'f2l' ? Math.round(elapsedMs) : (stageSplits.f2l ?? undefined),
        ollMs: trainingMode === 'oll' ? Math.round(elapsedMs) : (stageSplits.oll ?? undefined),
        pllMs: trainingMode === 'pll' ? Math.round(elapsedMs) : (stageSplits.pll ?? undefined),
        note: trainingMode !== 'full' ? `CFOP: ${trainingMode}` : undefined,
      })) as { result?: SolveResult; stats?: unknown };
      if (res?.result) {
        setResults((prev) => [res.result as LocalResult, ...prev]);
      }
      resetTimer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败';
      setSaveError(msg);
      // Even on error, add locally
      const local: LocalResult = {
        id: `local-${Date.now()}`,
        eventType: trainingMode !== 'full' ? trainingMode : (puzzle === '222' ? '222' : '333'),
        scramble,
        timeMs: elapsedMs,
        penalty,
        finalTimeMs: finalMs,
        isPB: false,
        createdAt: new Date().toISOString(),
      };
      setResults((prev) => [local, ...prev]);
      resetTimer();
    } finally {
      setSaving(false);
    }
  };

  // --- Reset for next solve ---
  const resetTimer = () => {
    setPhase('idle');
    setScramble(newScramble());
    setElapsedMs(0);
    setInspectionRemaining(INSPECTION_SECONDS);
    setSaveError(null);
    resetStages();
  };

  // --- Penalty actions ---
  const handlePenaltyOk = () => {
    // No penalty
    saveResult(Penalty.NONE, elapsedMs);
  };

  const handlePenaltyPlus2 = () => {
    saveResult(Penalty.PLUS_TWO, elapsedMs + 2000);
  };

  const handlePenaltyDnf = () => {
    saveResult(Penalty.DNF, Infinity);
  };

  const handleDiscard = () => {
    resetTimer();
  };

  // --- Derived display values ---
  const displayTime = (): string => {
    switch (phase) {
      case 'inspection':
        return String(inspectionRemaining);
      case 'running':
        return formatTime(elapsedMs);
      case 'stopped':
        return formatTime(elapsedMs);
      default:
        return '0.00';
    }
  };

  const displayColor = (): string => {
    switch (phase) {
      case 'inspection':
        return inspectionRemaining <= 5 ? 'var(--color-accent-orange)' : 'var(--color-accent-green)';
      case 'running':
        return 'var(--color-foreground)';
      case 'stopped':
        return 'var(--color-primary)';
      default:
        return 'var(--color-muted)';
    }
  };

  const phasePrompt = (): string => {
    switch (phase) {
      case 'idle':
        return '按住空格键 / 触摸屏幕 开始计时';
      case 'inspection':
        return '松开开始计时';
      case 'running':
        return '再次按下 / 点击 停止';
      case 'stopped':
        return '';
      default:
        return '';
    }
  };

  const phasePromptSub = (): string => {
    switch (phase) {
      case 'idle':
        return 'Press & hold Space / Touch to start';
      default:
        return '';
    }
  };

  // --- Computed stats strings ---
  const ao5Str = stats.ao5 === 'DNF' ? 'DNF' : stats.ao5 !== null ? formatTime(stats.ao5) : '—';
  const ao12Str = stats.ao12 === 'DNF' ? 'DNF' : stats.ao12 !== null ? formatTime(stats.ao12) : '—';
  const bestStr = stats.best !== null ? formatTime(stats.best) : '—';

  // --- Last 12 results for display ---
  const recentResults = results.slice(0, 12);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* --- Stats Row --- */}
      <div className="grid grid-cols-4 gap-3 w-full">
        <StatBox label="PB" value={bestStr} highlight={stats.best !== null && stats.best > 0} />
        <StatBox label="ao5" value={ao5Str} highlight={typeof stats.ao5 === 'number'} />
        <StatBox label="ao12" value={ao12Str} highlight={typeof stats.ao12 === 'number'} />
        <StatBox label="计数" value={String(stats.count)} />
      </div>

      {/* --- Puzzle Select + Scramble --- */}
      <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-[var(--color-muted)] uppercase tracking-wider">打乱 / Scramble</div>
          <div className="flex rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden">
            <button onClick={()=>{setPuzzle('222');setScramble(generate2x2Scramble());}}
              className={`px-3 py-1 text-xs font-bold transition-colors ${puzzle==='222'? 'bg-[var(--color-primary)] text-white':'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}>2×2</button>
            <button onClick={()=>{setPuzzle('333');setScramble(generateScramble());}}
              className={`px-3 py-1 text-xs font-bold transition-colors ${puzzle==='333'? 'bg-[var(--color-primary)] text-white':'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}>3×3</button>
          </div>
          {/* Phase training selector */}
          <div className="flex rounded-lg overflow-hidden border border-white/[0.06] ml-2">
            {(['full','cross','f2l','oll','pll'] as const).map(m => (
              <button key={m} onClick={() => setTrainingMode(m)}
                className={`px-2 py-1 text-[10px] font-bold transition-colors ${trainingMode===m ? 'bg-purple-500/20 text-purple-400' : 'text-[var(--color-muted)] hover:text-white'}`}>
                {m==='full'?'全部':m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="font-mono text-lg sm:text-xl leading-relaxed tracking-wide text-[var(--color-foreground)] text-center" suppressHydrationWarning>
          {scramble}
        </div>
        <button
          onClick={() => {
            if (phase === 'idle') {
              setScramble(newScramble());
            }
          }}
          disabled={phase !== 'idle'}
          className="mt-3 text-xs px-3 py-1 rounded-lg bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🔄 新打乱
        </button>
      </div>

      {/* Ghost Race — live PB comparison */}
      <GhostRace isRunning={phase === 'running'} elapsedMs={elapsedMs} />

      {/* --- Timer Area --- */}
      {trainingMode !== 'full' && (
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
            🎯 {trainingMode.toUpperCase()} 专项训练
          </span>
        </div>
      )}
      <div
        ref={timerAreaRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          relative w-full select-none cursor-pointer
          rounded-2xl border-2 transition-all duration-200
          flex flex-col items-center justify-center py-12 sm:py-16
          ${
            phase === 'inspection'
              ? 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/5'
              : phase === 'running'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : phase === 'stopped'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-muted)]'
          }
        `}
      >
        {/* Timer display */}
        <div
          className="timer-display font-mono font-bold select-none"
          style={{
            fontSize: phase === 'idle' ? '3rem' : '5rem',
            color: displayColor(),
            lineHeight: 1.1,
            transition: 'font-size 0.2s ease',
          }}
        >
          {phase === 'running' || phase === 'stopped' ? displayTime() : displayTime()}
        </div>

        {/* Phase prompt */}
        {phase !== 'stopped' && (
          <div className="mt-3 text-sm text-[var(--color-muted)]">{phasePrompt()}</div>
        )}
        {phase === 'idle' && (
          <div className="text-xs text-[var(--color-border)] mt-1">{phasePromptSub()}</div>
        )}

        {/* Inspection progress bar */}
        {phase === 'inspection' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-border)] rounded-b-2xl overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{ width: `${((INSPECTION_SECONDS - inspectionRemaining) / INSPECTION_SECONDS) * 100}%`, backgroundColor: inspectionRemaining <= 5 ? 'var(--color-accent-orange)' : 'var(--color-accent-green)' }}
            />
          </div>
        )}

        {/* Stage indicators — shown during running */}
        {phase === 'running' && (
          <div className="flex gap-2 mt-4 items-center">
            {(['cross','f2l','oll','pll'] as const).map((s, i) => {
              const isActive = currentStage === s;
              const isDone = stageSplits[s] !== null;
              const colors = ['#FF5900','#009B48','#FFD500','#0046AD'];
              return (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-40'}`}
                    style={{color:isActive?colors[i]:undefined}}>
                    {s}
                  </div>
                  <div className={`w-2 h-2 rounded-full transition-all ${isActive?'scale-150':''}`}
                    style={{
                      background: isDone ? colors[i] : isActive ? colors[i] : 'transparent',
                      border: !isDone && !isActive ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
                      boxShadow: isActive ? `0 0 8px ${colors[i]}80` : 'none',
                    }} />
                  {isDone && <div className="text-[8px] font-mono text-white/50">{formatTime(stageSplits[s]!)}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Keyboard hint for stage advance */}
        {phase === 'running' && currentStage !== 'done' && (
          <div className="text-[9px] text-white/20 mt-2">按空格键切阶段</div>
        )}

        {/* No-op — removed dangling code */}

        {/* Stopped - penalty buttons */}
        {phase === 'stopped' && (
          <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={handlePenaltyOk}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-accent-green)] text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              ✓ OK
            </button>
            <button
              onClick={handlePenaltyPlus2}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-accent-orange)] text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              +2
            </button>
            <button
              onClick={handlePenaltyDnf}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              DNF
            </button>
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-surface)] text-[var(--color-muted)] font-semibold text-sm border border-[var(--color-border)] hover:text-[var(--color-foreground)] transition-all disabled:opacity-50"
            >
              🗑 删除
            </button>
          </div>
        )}

        {/* Saving indicator */}
        {saving && (
          <div className="mt-3 text-xs text-[var(--color-muted)] animate-pulse">保存中...</div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="mt-2 text-xs text-[var(--color-accent-orange)]">{saveError}</div>
        )}
      </div>

      {/* --- Authentication warning --- */}
      {hydrated && !isAuthenticated && (
        <div className="w-full bg-[var(--color-surface)]/50 border border-dashed border-[var(--color-border)] rounded-xl p-3 text-center">
          <p className="text-xs text-[var(--color-muted)]">
            ⚠️ 未登录，成绩不会保存到服务器。{' '}
            <a href="/login" className="text-[var(--color-primary)] hover:underline">
              登录
            </a>
          </p>
        </div>
      )}

      {/* --- Recent Results List --- */}
      {recentResults.length > 0 && (
        <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              📋 最近成绩
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              最近 {recentResults.length} 次
            </span>
          </div>
          <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto">
            {recentResults.map((r, i) => {
              const effectiveMs =
                r.penalty === Penalty.DNF
                  ? Infinity
                  : r.penalty === Penalty.PLUS_TWO
                    ? (r.timeMs ?? 0) + 2000
                    : r.timeMs ?? 0;
              const display = formatTime(effectiveMs);
              const penaltyLabel =
                r.penalty === Penalty.DNF
                  ? 'DNF'
                  : r.penalty === Penalty.PLUS_TWO
                    ? '+2'
                    : '';
              return (
                <div
                  key={r.id || i}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span className="text-[var(--color-muted)] w-6 text-right tabular-nums">
                    {i + 1}
                  </span>
                  <span className="w-12 text-[9px] text-[var(--color-muted)]">
                    {r.eventType === '333' ? '🧊三阶' : r.eventType === '222' ? '💎二阶' : `🎯${r.eventType?.toUpperCase()||''}`}
                  </span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      r.penalty === Penalty.DNF
                        ? 'text-red-400'
                        : r.isPB
                          ? 'text-[var(--color-accent-green)]'
                          : 'text-[var(--color-foreground)]'
                    }`}
                  >
                    {display}
                  </span>
                  <span className="w-10 text-right">
                    {penaltyLabel && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          r.penalty === Penalty.DNF
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]'
                        }`}
                      >
                        {penaltyLabel}
                      </span>
                    )}
                    {r.isPB && !penaltyLabel && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]">
                        PB
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Keyboard legend (desktop hint) --- */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-[var(--color-border)]">
        <span>按住 <kbd className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] font-mono">Space</kbd> 观察 → 松开开始计时 → 再按停止</span>
      </div>
    </div>
  );
}

/** Small stat box component */
function StatBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 text-center">
      <div className="text-xs text-[var(--color-muted)] mb-1 uppercase tracking-wider">{label}</div>
      <div
        className={`font-mono text-lg font-bold tabular-nums ${
          highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
