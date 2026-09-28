import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, Trophy, Flame, Timer, Volume2, VolumeX } from 'lucide-react';

interface ColorDefinition {
  name: string;
  hex: string;
  bgHex: string;
}

const COLOR_PALETTE: ColorDefinition[] = [
  { name: 'RED', hex: '#E63946', bgHex: 'rgba(230, 57, 70, 0.12)' },
  { name: 'BLUE', hex: '#2563EB', bgHex: 'rgba(37, 99, 235, 0.12)' },
  { name: 'GREEN', hex: '#16A34A', bgHex: 'rgba(22, 163, 74, 0.12)' },
  { name: 'YELLOW', hex: '#CA8A04', bgHex: 'rgba(202, 138, 4, 0.14)' },
  { name: 'PURPLE', hex: '#9333EA', bgHex: 'rgba(147, 51, 234, 0.12)' },
  { name: 'ORANGE', hex: '#EA580C', bgHex: 'rgba(234, 88, 12, 0.12)' }
];

interface Question {
  wordIndex: number;      // The text of the word (e.g. "RED")
  colorIndex: number;     // The ink color (e.g. #2563EB Blue)
  targetIndex: number;    // The correct answer index (ink color)
  options: number[];      // 4 color options
}

export const StroopGame: React.FC = () => {
  const { isReducedMotion, isMuted, toggleMute, playStroopCorrect, playStroopMistake, playWinCheer } = useApp();

  // Test State: Starts directly in 'playing' mode with zero intermediate option screens
  const [gameState, setGameState] = useState<'playing' | 'results'>('playing');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  // Generate a random Stroop question (Matches ink color)
  const generateQuestion = useCallback((): Question => {
    const numColors = COLOR_PALETTE.length;
    const wordIndex = Math.floor(Math.random() * numColors);
    
    // 78% chance of incongruent (clashing) color for authentic Stroop challenge
    let colorIndex = wordIndex;
    if (Math.random() < 0.78) {
      const otherIndices = Array.from({ length: numColors }, (_, i) => i).filter(i => i !== wordIndex);
      colorIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
    }

    const targetIndex = colorIndex; // Match ink color

    // Pick 4 options including the correct target
    const remainingIndices = Array.from({ length: numColors }, (_, i) => i).filter(i => i !== targetIndex);
    const wrongOptions = remainingIndices.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [targetIndex, ...wrongOptions].sort(() => Math.random() - 0.5);

    return {
      wordIndex,
      colorIndex,
      targetIndex,
      options
    };
  }, []);

  // Start / Restart game directly
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(30);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    setReactionTimes([]);
    setFeedback(null);

    const q = generateQuestion();
    setCurrentQuestion(q);
    questionStartTimeRef.current = Date.now();
  }, [generateQuestion]);

  // Initial auto-start on mount
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('results');
            playWinCheer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, playWinCheer]);

  // Handle color option click
  const handleAnswer = (selectedColorIndex: number) => {
    if (gameState !== 'playing' || !currentQuestion) return;

    const reactionTime = Date.now() - questionStartTimeRef.current;
    setReactionTimes((prev) => [...prev, reactionTime]);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = selectedColorIndex === currentQuestion.targetIndex;

    if (isCorrect) {
      const pointValue = Math.max(10, Math.floor(100 - reactionTime * 0.08)) + streak * 5;
      setScore((prev) => prev + Math.max(10, pointValue));
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
      setCorrectAttempts((prev) => prev + 1);
      setFeedback('correct');

      playStroopCorrect(newStreak);
    } else {
      setStreak(0);
      setFeedback('wrong');
      playStroopMistake();
    }

    setTimeout(() => {
      setFeedback(null);
      const nextQ = generateQuestion();
      setCurrentQuestion(nextQ);
      questionStartTimeRef.current = Date.now();
    }, 110);
  };

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const accuracyPct = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : 0;

  // Cognitive Flexibility Assessment
  const getCognitiveRating = () => {
    if (accuracyPct >= 90 && avgReactionTime < 550) return { title: 'Laser Sharp', badge: 'Zen Focus', color: '#16A34A' };
    if (accuracyPct >= 80 && avgReactionTime < 750) return { title: 'High Agility', badge: 'Great Flow', color: '#2563EB' };
    if (accuracyPct >= 70) return { title: 'Focused Mind', badge: 'Steady Focus', color: '#CA8A04' };
    return { title: 'Warm-up Complete', badge: 'Good Practice', color: '#9333EA' };
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        maxWidth: '520px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. DIRECT GAMEPLAY SCREEN */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'playing' && currentQuestion && (
        <div
          className="fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: '16px'
          }}
        >
          {/* Top HUD: Timer, Streak, Score */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Timer size={16} color={timeLeft <= 5 ? '#E63946' : 'var(--text-secondary)'} />
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: timeLeft <= 5 ? '#E63946' : 'var(--text-primary)'
                }}
              >
                {timeLeft}s
              </span>
            </div>

            {/* Streak */}
            {streak > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(234, 88, 12, 0.12)',
                  color: '#EA580C',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <Flame size={14} />
                <span>{streak}x Streak</span>
              </div>
            )}

            {/* Score & Sound Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>SCORE</span>
                <span style={{ fontSize: '1.20rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {score}
                </span>
              </div>

              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border-subtle)',
                  color: isMuted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>

          {/* Direct Prompt Callout */}
          <div
            style={{
              padding: '5px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(37, 99, 235, 0.10)',
              color: '#2563EB',
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}
          >
            TAP THE INK COLOR
          </div>

          {/* Central Stimulus Word Card */}
          <div
            style={{
              width: '100%',
              minHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-2xl)',
              border: `2.5px solid ${
                feedback === 'correct' ? '#16A34A' : feedback === 'wrong' ? '#E63946' : 'var(--border-subtle)'
              }`,
              boxShadow: feedback ? '0 8px 28px rgba(0, 0, 0, 0.12)' : 'var(--shadow-card)',
              transition: isReducedMotion ? 'none' : 'border-color 0.15s ease, transform 0.15s ease',
              transform: feedback === 'correct' ? 'scale(1.02)' : feedback === 'wrong' ? 'scale(0.98)' : 'scale(1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                fontSize: '3.4rem',
                fontWeight: 900,
                color: COLOR_PALETTE[currentQuestion.colorIndex].hex,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)'
              }}
            >
              {COLOR_PALETTE[currentQuestion.wordIndex].name}
            </span>
          </div>

          {/* 4 Large Responsive Color Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              marginTop: '6px'
            }}
          >
            {currentQuestion.options.map((colIdx) => {
              const colorDef = COLOR_PALETTE[colIdx];
              return (
                <button
                  key={colIdx}
                  onClick={() => handleAnswer(colIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '16px 14px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-subtle)',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease, border-color 0.15s ease'
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: colorDef.hex,
                      boxShadow: `0 0 10px ${colorDef.hex}55`
                    }}
                  />
                  <span
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {colorDef.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. RESULTS SCREEN */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'results' && (
        <div
          className="fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            padding: '28px 24px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(22, 163, 74, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A'
            }}
          >
            <Trophy size={32} />
          </div>

          <div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: `${getCognitiveRating().color}18`,
                color: getCognitiveRating().color,
                fontSize: '0.80rem',
                fontWeight: 700,
                marginBottom: '8px'
              }}
            >
              {getCognitiveRating().badge}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {getCognitiveRating().title}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Final Score: <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>{score}</strong>
            </p>
          </div>

          {/* Metric Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              width: '100%'
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-page)',
                padding: '12px 8px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>ACCURACY</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                {accuracyPct}%
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-page)',
                padding: '12px 8px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>REACTION</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                {avgReactionTime}ms
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-page)',
                padding: '12px 8px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>BEST STREAK</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EA580C', marginTop: '2px' }}>
                {bestStreak}x
              </div>
            </div>
          </div>

          {/* Action Button: Directly restart */}
          <button
            onClick={startGame}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.96rem',
              border: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={16} />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
