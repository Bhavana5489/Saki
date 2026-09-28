import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, Volume2, VolumeX, Flame, Trophy } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
}

interface HitRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface PathPoint {
  x: number;
  y: number;
  scale: number;
  time: number;
}

export const TableTennisGame: React.FC = () => {
  const { isReducedMotion, isMuted, toggleMute, playPaddleHit, playTableBounce, playFloorBounce, playWinCheer } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match State (Standard 11-Point Tournament Match)
  const [playerScore, setPlayerScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [consecutiveRally, setConsecutiveRally] = useState(0);
  const [bestRally, setBestRally] = useState(0);
  const [lastScorer, setLastScorer] = useState<'player' | 'rival' | null>(null);
  const [currentServer, setCurrentServer] = useState<'player' | 'rival'>('player');
  const [shotFeedback, setShotFeedback] = useState<string | null>(null);
  const [matchWinner, setMatchWinner] = useState<'player' | 'rival' | null>(null);

  // High performance physical simulation state
  const stateRef = useRef({
    gameState: 'serve' as 'serve' | 'playing' | 'point_pause' | 'match_over',
    pointPauseEndTime: 0,
    rivalServeTime: 0,
    consecutiveHits: 0,
    bestHits: 0,
    playerScore: 0,
    rivalScore: 0,
    currentServer: 'player' as 'player' | 'rival',
    floorLevel: -0.72,
    tableWidth: 1.68,
    tableLength: 2.85,
    netHeight: 0.155,
    gravity: -0.0016,

    // 3D Physical Space Coordinates
    ball: {
      x: 0,
      y: 0.28,
      z: -1.15,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      lastHitter: '' as 'player' | 'opponent' | '',
      bouncedPlayerSide: false,
      bouncedOpponentSide: false,
      floorBounces: 0
    },

    // Player Paddle (Near side z = -1.25)
    playerBat: {
      x: 0.15,
      y: 0.25,
      z: -1.25,
      targetX: 0.15,
      targetY: 0.25,
      vx: 0,
      vy: 0,
      prevX: 0.15,
      prevY: 0.25,
      tilt: 0.35,
      swingProgress: 0,
      isSmash: false
    },

    // Rival Paddle (Far side z = 1.35)
    opponentBat: {
      x: 0,
      y: 0.28,
      z: 1.35,
      targetX: 0,
      targetY: 0.28,
      tilt: -0.45,
      swingProgress: 0
    },

    particles: [] as Particle[],
    hitRings: [] as HitRing[],
    pathHistory: [] as PathPoint[],
    camera: {
      yOffset: 1.76,
      zOffset: 3.12
    }
  });

  // Calculate server in table tennis rules (alternates every 2 points, 1 point in deuce)
  const getNextServer = (pScore: number, rScore: number): 'player' | 'rival' => {
    const total = pScore + rScore;
    if (pScore >= 10 && rScore >= 10) {
      return total % 2 === 0 ? 'player' : 'rival';
    }
    return Math.floor(total / 2) % 2 === 0 ? 'player' : 'rival';
  };

  // Serve Ball
  const serveBall = useCallback((fromPlayer = true) => {
    const s = stateRef.current;
    if (s.gameState === 'playing' || s.gameState === 'point_pause' || s.gameState === 'match_over') return;

    s.gameState = 'playing';
    s.pathHistory = [];
    s.consecutiveHits = 0;
    s.ball.floorBounces = 0;
    setConsecutiveRally(0);
    setLastScorer(null);

    if (fromPlayer) {
      // Player serves smoothly forward with World Tour arc
      s.ball.x = s.playerBat.x * 0.4;
      s.ball.y = 0.26;
      s.ball.z = -1.15;

      // Target opponent table center-forward
      const targetX = (Math.random() - 0.5) * 0.40;
      const targetZ = 0.85;
      const vz = 0.052;
      const framesToTarget = (targetZ - s.ball.z) / vz;
      const vx = (targetX - s.ball.x) / framesToTarget;
      // Vy to arc over net (y=0.155 at z=0) and bounce at y=0 at targetZ
      const vy = (-s.ball.y - 0.5 * s.gravity * (framesToTarget * framesToTarget)) / framesToTarget + 0.003;

      s.ball.vx = vx;
      s.ball.vy = vy;
      s.ball.vz = vz;
      s.ball.spinX = 0;
      s.ball.spinY = 0;
      s.ball.lastHitter = 'player';
      s.ball.bouncedPlayerSide = false;
      s.ball.bouncedOpponentSide = false;
      setShotFeedback('SERVE');
      playPaddleHit(1.05);
    } else {
      // Rival serves smoothly towards player table
      s.ball.x = s.opponentBat.x * 0.4;
      s.ball.y = 0.26;
      s.ball.z = 1.15;

      const targetX = (Math.random() - 0.5) * 0.50;
      const targetZ = -0.85;
      const vz = -0.050;
      const framesToTarget = (targetZ - s.ball.z) / vz;
      const vx = (targetX - s.ball.x) / framesToTarget;
      const vy = (-s.ball.y - 0.5 * s.gravity * (framesToTarget * framesToTarget)) / framesToTarget + 0.003;

      s.ball.vx = vx;
      s.ball.vy = vy;
      s.ball.vz = vz;
      s.ball.spinX = 0;
      s.ball.spinY = 0;
      s.ball.lastHitter = 'opponent';
      s.ball.bouncedPlayerSide = false;
      s.ball.bouncedOpponentSide = false;
      setShotFeedback('RIVAL SERVE');
      playPaddleHit(0.95);
    }
  }, [playPaddleHit]);

  // Reset Match
  const resetMatch = useCallback(() => {
    const s = stateRef.current;
    s.gameState = 'serve';
    s.playerScore = 0;
    s.rivalScore = 0;
    s.consecutiveHits = 0;
    s.currentServer = 'player';
    s.pathHistory = [];
    s.ball.floorBounces = 0;
    setPlayerScore(0);
    setRivalScore(0);
    setConsecutiveRally(0);
    setLastScorer(null);
    setCurrentServer('player');
    setShotFeedback('READY — SWIPE TO SERVE');
    setMatchWinner(null);

    s.ball.x = 0;
    s.ball.y = 0.28;
    s.ball.z = -1.15;
    s.ball.vx = 0;
    s.ball.vy = 0;
    s.ball.vz = 0;
  }, []);

  // Main 60fps Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // 3D Perspective Projection Function
    const project3D = (x: number, y: number, z: number, width: number, height: number) => {
      const camZ = z + stateRef.current.camera.zOffset;
      const aspectFov = Math.min(width * 0.88, height * 0.65);
      const scale = aspectFov / Math.max(0.1, camZ);
      const cx = width / 2;
      const cy = height * 0.16;

      const screenX = cx + x * scale;
      const screenY = cy - (y - stateRef.current.camera.yOffset) * scale;
      return { x: screenX, y: screenY, scale };
    };

    const spawnParticles = (x: number, y: number, color = '#FFFFFF', count = 10) => {
      if (isReducedMotion) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.2;
        stateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          color,
          alpha: 1,
          size: Math.random() * 3.5 + 1.8,
          life: 1
        });
      }
    };

    const spawnHitRing = (x: number, y: number, color = '#FFD166') => {
      if (isReducedMotion) return;
      stateRef.current.hitRings.push({
        x,
        y,
        radius: 8,
        maxRadius: 36,
        alpha: 1,
        color
      });
    };

    const endPoint = (winner: 'player' | 'rival', curTime: number, reason = '') => {
      const s = stateRef.current;
      if (s.gameState === 'point_pause' || s.gameState === 'match_over') return;

      if (winner === 'player') {
        s.playerScore += 1;
        setPlayerScore(s.playerScore);
        setLastScorer('player');
        setShotFeedback(reason || 'POINT FOR YOU! 🎯');
        playWinCheer();
      } else {
        s.rivalScore += 1;
        setRivalScore(s.rivalScore);
        setLastScorer('rival');
        setShotFeedback(reason || 'POINT FOR RIVAL');
      }

      // Check Match Winner (First to 11, lead by 2)
      if (
        (s.playerScore >= 11 && s.playerScore - s.rivalScore >= 2) ||
        (s.rivalScore >= 11 && s.rivalScore - s.playerScore >= 2)
      ) {
        s.gameState = 'match_over';
        const finalWinner = s.playerScore > s.rivalScore ? 'player' : 'rival';
        setMatchWinner(finalWinner);
        return;
      }

      s.gameState = 'point_pause';
      s.pointPauseEndTime = curTime + 1100;
      const nextServer = getNextServer(s.playerScore, s.rivalScore);
      s.currentServer = nextServer;
      setCurrentServer(nextServer);
      if (nextServer === 'rival') {
        s.rivalServeTime = curTime + 1700;
      }
    };

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const s = stateRef.current;
      const b = s.ball;
      const pBat = s.playerBat;
      const oBat = s.opponentBat;

      // -------------------------------------------------------------
      // 1. UPDATE PLAYER BAT (Smooth 1:1 pointer tracking & tilt)
      // -------------------------------------------------------------
      const dx = pBat.targetX - pBat.x;
      const dy = pBat.targetY - pBat.y;
      pBat.vx = (pBat.targetX - pBat.prevX) * 30;
      pBat.vy = (pBat.targetY - pBat.prevY) * 30;
      pBat.prevX = pBat.targetX;
      pBat.prevY = pBat.targetY;

      pBat.x += dx * 0.72;
      pBat.y += dy * 0.72;
      pBat.tilt = Math.max(-0.65, Math.min(0.65, 0.35 + (pBat.x * 0.32) - (pBat.vx * 0.04)));
      if (pBat.swingProgress > 0) {
        pBat.swingProgress = Math.max(0, pBat.swingProgress - dt * 4.5);
      }

      // -------------------------------------------------------------
      // 2. POINT PAUSE & SERVE TRANSITIONS
      // -------------------------------------------------------------
      if (s.gameState === 'point_pause') {
        const remainingPause = s.pointPauseEndTime - time;

        if (remainingPause > 400) {
          // Ball completes physical arc to floor
          b.vy += s.gravity * 3.5;
          b.x += b.vx;
          b.y += b.vy;
          b.z += b.vz;

          if (b.y <= s.floorLevel) {
            b.y = s.floorLevel;
            if (Math.abs(b.vy) > 0.015) {
              b.vy = -b.vy * 0.52;
              b.vx *= 0.85;
              b.vz *= 0.85;
              if (b.floorBounces < 2) {
                b.floorBounces++;
                playFloorBounce(0.9 + Math.random() * 0.2);
                const floorProj = project3D(b.x, s.floorLevel, b.z, width, height);
                spawnParticles(floorProj.x, floorProj.y, '#C89B60', 5);
              }
            } else {
              b.vy = 0;
            }
          }
        } else {
          // Floats smoothly back into server position
          const isPlayerServer = s.currentServer === 'player';
          b.vx *= 0.85;
          b.vy *= 0.85;
          const targetBallX = isPlayerServer ? pBat.x * 0.4 : 0;
          const targetBallY = 0.26;
          const targetBallZ = isPlayerServer ? -1.15 : 1.15;
          b.x += (targetBallX - b.x) * 0.18;
          b.y += (targetBallY - b.y) * 0.18;
          b.z += (targetBallZ - b.z) * 0.18;
        }

        if (time >= s.pointPauseEndTime) {
          s.gameState = 'serve';
          s.pathHistory = [];
          setShotFeedback(s.currentServer === 'player' ? 'SWIPE TO SERVE' : 'RIVAL SERVE');
        }
      } else if (s.gameState === 'serve') {
        const isPlayerServer = s.currentServer === 'player';
        if (isPlayerServer) {
          b.x = pBat.x * 0.4;
          b.y = pBat.y + 0.14 + Math.sin(time * 0.005) * 0.012;
          b.z = -1.15;
          b.vx = 0;
          b.vy = 0;
          b.vz = 0;

          oBat.targetX = -0.15;
          oBat.targetY = 0.28;
          oBat.x += (oBat.targetX - oBat.x) * 0.15;
          oBat.y += (oBat.targetY - oBat.y) * 0.15;
        } else {
          // Rival prepares serve and fires after brief pause
          b.x = oBat.x;
          b.y = oBat.y + 0.14 + Math.sin(time * 0.005) * 0.012;
          b.z = 1.15;
          b.vx = 0;
          b.vy = 0;
          b.vz = 0;

          if (time >= s.rivalServeTime && s.rivalServeTime > 0) {
            s.rivalServeTime = 0;
            serveBall(false);
          }
        }
      }

      // -------------------------------------------------------------
      // 3. TABLE TENNIS WORLD TOUR ARCADE PHYSICS
      // -------------------------------------------------------------
      if (s.gameState === 'playing') {
        b.vy += s.gravity;
        b.vx += b.spinX * 0.02;

        b.x += b.vx;
        b.y += b.vy;
        b.z += b.vz;

        // Motion trail ribbon
        const proj = project3D(b.x, b.y, b.z, width, height);
        s.pathHistory.push({
          x: proj.x,
          y: proj.y,
          scale: proj.scale,
          time
        });
        if (s.pathHistory.length > 20) {
          s.pathHistory.shift();
        }

        // --- Table Surface Bounce Physics ---
        const tHalfW = s.tableWidth / 2;
        const tHalfL = s.tableLength / 2;
        const onTableX = Math.abs(b.x) <= tHalfW + 0.16;
        const onTableZ = Math.abs(b.z) <= tHalfL + 0.14;

        if (b.y <= 0.02 && b.vy < 0 && onTableX && onTableZ) {
          b.y = 0.02;
          b.vy = 0.029; // Crisp upward bounce
          b.vx *= 0.98;

          playTableBounce(Math.min(1.3, Math.max(0.75, Math.abs(b.vz) / 0.05)));
          spawnParticles(proj.x, proj.y, '#FFAB2B', 6);
          spawnHitRing(proj.x, proj.y, 'rgba(255, 171, 43, 0.7)');

          if (b.z < 0) {
            b.bouncedPlayerSide = true;
          } else {
            b.bouncedOpponentSide = true;
          }
        }

        // --- 100% ACCURATE PLAYER SWIPE & SMASH MECHANICS ---
        const swipeSpeed = Math.hypot(pBat.vx, pBat.vy);
        
        // Paddle is physically at z = -1.25. If held still, you must wait for ball to reach -1.18.
        // If swiping fast, you can "reach forward" to hit it early up to z = -0.90!
        const reachZ = -1.18 + Math.min(0.28, swipeSpeed * 10);

        if (b.z <= reachZ && b.z >= -1.45 && b.vz < 0) {
          const distToBatX = b.x - pBat.x;
          const distToBatY = (b.y - pBat.y);
          const hitDist = Math.hypot(distToBatX, distToBatY);

          // 100% accurate player contact zone (0.24 perfectly matches visual paddle radius)
          if (hitDist <= 0.24) {
            pBat.swingProgress = 1;
            
            const isSmash = swipeSpeed > 0.028 || (pBat.vy > 0.012 && b.y > 0.16);
            const isBlock = swipeSpeed < 0.006; // Holding paddle still
            pBat.isSmash = isSmash;

            // Ballistic target calculation to opponent's table
            const swipeInfluence = pBat.vx * 0.08;
            const targetX = Math.max(-0.75, Math.min(0.75, (pBat.x * 0.45) + swipeInfluence + (distToBatX * 0.3)));
            
            // Block shots drop short, smashes go deep
            const targetZ = isBlock ? (0.20 + Math.random() * 0.2) : (isSmash ? 1.18 : (0.75 + Math.min(0.40, swipeSpeed * 5)));
            const forwardVz = isBlock ? 0.038 : (isSmash ? 0.072 : 0.052);

            const framesToBounce = (targetZ - b.z) / forwardVz;
            const vx = (targetX - b.x) / framesToBounce;
            // Arc that clears net and lands cleanly at y=0 at targetZ
            const vy = (-b.y - 0.5 * s.gravity * (framesToBounce * framesToBounce)) / framesToBounce + (isSmash ? 0.001 : 0.0035);

            b.vz = forwardVz;
            b.vx = vx;
            b.vy = vy;
            b.spinX = pBat.vx * 0.002;
            b.lastHitter = 'player';
            b.bouncedOpponentSide = false;

            s.consecutiveHits += 1;
            setConsecutiveRally(s.consecutiveHits);
            if (s.consecutiveHits > s.bestHits) {
              s.bestHits = s.consecutiveHits;
              setBestRally(s.bestHits);
            }

            if (isSmash) {
              setShotFeedback('POWER SMASH! 🔥');
            } else if (Math.abs(targetX) > 0.48) {
              setShotFeedback('CORNER ATTACK 🎯');
            } else if (s.consecutiveHits >= 6) {
              setShotFeedback(`${s.consecutiveHits} RALLY! 🔥`);
            } else {
              setShotFeedback(`${s.consecutiveHits} RALLY`);
            }

            playPaddleHit(isSmash ? 1.25 : 1.05);
            spawnParticles(proj.x, proj.y, isSmash ? '#FF4545' : '#FFD166', isSmash ? 16 : 8);
            spawnHitRing(proj.x, proj.y, isSmash ? '#FF4545' : '#FFD166');
          }
        }

        // --- SKILLED, FAIR RIVAL AI ---
        let targetOpponentX = 0;
        let targetOpponentY = 0.28;

        // Proactive tracking as ball leaves player side
        if (b.vz > 0 && b.z > -0.2) {
          const arrivalZ = 1.30 - b.z;
          const predictedX = b.x + (b.vx * (arrivalZ / Math.max(0.01, b.vz)));
          // CPU covers the table
          targetOpponentX = Math.max(-0.80, Math.min(0.80, predictedX));
          targetOpponentY = Math.max(0.18, Math.min(0.48, b.y));
        }

        // Slower AI movement speed and tracking delay so the player can win by hitting fast/wide shots!
        const aiTrackingSpeed = 0.065; // Reduced from 0.12 (slower to react)
        oBat.targetX += (targetOpponentX - oBat.targetX) * aiTrackingSpeed;
        oBat.targetY += (targetOpponentY - oBat.targetY) * aiTrackingSpeed;
        
        const dx = oBat.targetX - oBat.x;
        const dy = oBat.targetY - oBat.y;
        const moveDist = Math.hypot(dx, dy);
        
        // Lower the maximum physical distance the AI paddle can travel per frame
        const maxCpuSpeed = 0.028; // Reduced from 0.036 (slower running speed)
        
        if (moveDist > 0) {
          const actualMoveDist = Math.min(moveDist, maxCpuSpeed);
          oBat.x += (dx / moveDist) * actualMoveDist;
          oBat.y += (dy / moveDist) * actualMoveDist;
        }

        oBat.tilt = Math.max(-0.7, Math.min(0.7, -0.45 + (targetOpponentX - oBat.x) * 0.8));

        // Rival Paddle Hit Detection (z = 0.90 to 1.45)
        if (b.z >= 0.90 && b.z <= 1.45 && b.vz > 0) {
          const distToOppX = b.x - oBat.x;
          const distToOppY = (b.y - oBat.y);
          const hitDist = Math.hypot(distToOppX, distToOppY);

          // Accurate contact radius (0.28) - returns standard shots, beaten by fast smashes & corner angles!
          if (hitDist <= 0.28) {
            oBat.swingProgress = 1;

            // Do NOT teleport b.z! Let the ball bounce naturally.

            // Target landing spot on player's table: varied across left, center, right
            const targetX = (Math.random() - 0.5) * 0.65;
            const targetZ = -(0.75 + Math.random() * 0.35);
            const returnVz = -(0.050 + Math.min(0.015, s.consecutiveHits * 0.001));

            const framesToBounce = (targetZ - b.z) / returnVz;
            const vx = (targetX - b.x) / framesToBounce;
            const vy = (-b.y - 0.5 * s.gravity * (framesToBounce * framesToBounce)) / framesToBounce + 0.0035;

            b.vz = returnVz;
            b.vx = vx;
            b.vy = vy;
            b.lastHitter = 'opponent';
            b.bouncedPlayerSide = false;

            playPaddleHit(0.96);
            spawnParticles(proj.x, proj.y, '#3B4252', 8);
            spawnHitRing(proj.x, proj.y, '#2E3440');
          } else if (hitDist < 0.75) {
            // Out of reach swing
            oBat.swingProgress = 1;
          }
        }

        // --- BULLETPROOF POINT COMPLETION RULES ---
        // A. Ball past Rival side (vz > 0)
        if (b.vz > 0 && (b.z > 1.48 || (Math.abs(b.x) > 1.25 && b.z > 0.4))) {
          if (b.bouncedOpponentSide) {
            // Clean winner by player!
            spawnParticles(proj.x, proj.y, '#FFD166', 16);
            endPoint('player', time, 'WINNER! 🎯');
          } else {
            // Player hit out
            endPoint('rival', time, 'OUT');
          }
        }
        // B. Ball past Player side (vz < 0)
        else if (b.vz < 0 && (b.z < -1.45 || (Math.abs(b.x) > 1.25 && b.z < -0.4))) {
          if (b.bouncedPlayerSide) {
            // Rival scored
            endPoint('rival', time, 'MISSED');
          } else {
            // Rival hit out
            endPoint('player', time, 'RIVAL OUT! 🎯');
          }
        }
        // C. Ball fell to floor or dropped low
        if (b.y <= s.floorLevel + 0.05 || b.y < -0.35) {
          if (b.lastHitter === 'player') {
            if (b.bouncedOpponentSide) {
              endPoint('player', time, 'POINT FOR YOU! 🎯');
            } else {
              endPoint('rival', time, 'POINT FOR RIVAL');
            }
          } else {
            if (b.bouncedPlayerSide) {
              endPoint('rival', time, 'POINT FOR RIVAL');
            } else {
              endPoint('player', time, 'POINT FOR YOU! 🎯');
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 4. CLEAN, ZEN TABLE TENNIS RENDERING
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // A. Warm Natural Birch/Oak Wood Court Floor
      const floorGrad = ctx.createLinearGradient(0, 0, 0, height);
      floorGrad.addColorStop(0, '#EBD2AF');
      floorGrad.addColorStop(0.12, '#DFBA88');
      floorGrad.addColorStop(0.55, '#D5AB75');
      floorGrad.addColorStop(1, '#C89B60');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 0, width, height);

      // Horizontal Wood Plank Seams
      const plankCount = 18;
      const plankHeight = height / plankCount;
      for (let i = 0; i < plankCount; i++) {
        const py = i * plankHeight;
        ctx.strokeStyle = 'rgba(140, 95, 45, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();

        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fillRect(0, py, width, plankHeight);
        }
      }

      // Top Soft Ambient Glow
      const topGlow = ctx.createLinearGradient(0, 0, 0, height * 0.22);
      topGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      topGlow.addColorStop(0.5, 'rgba(255, 250, 240, 0.45)');
      topGlow.addColorStop(1, 'rgba(255, 250, 240, 0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height * 0.22);

      // B. 3D Table Geometry
      const tHalfW = s.tableWidth / 2;
      const tHalfL = s.tableLength / 2;
      const skirtDepth = -0.09;
      const floorY = s.floorLevel;

      const pFarLeft = project3D(-tHalfW, 0, tHalfL, width, height);
      const pFarRight = project3D(tHalfW, 0, tHalfL, width, height);
      const pNearRight = project3D(tHalfW, 0, -tHalfL, width, height);
      const pNearLeft = project3D(-tHalfW, 0, -tHalfL, width, height);

      const pSkirtNearRight = project3D(tHalfW, skirtDepth, -tHalfL, width, height);
      const pSkirtNearLeft = project3D(-tHalfW, skirtDepth, -tHalfL, width, height);
      const pSkirtFarRight = project3D(tHalfW, skirtDepth, tHalfL, width, height);

      // 1. Table Under-Shadow on Floor
      ctx.fillStyle = 'rgba(80, 50, 20, 0.28)';
      ctx.beginPath();
      ctx.moveTo(pFarLeft.x - 10, pFarLeft.y + 4);
      ctx.lineTo(pFarRight.x + 10, pFarRight.y + 4);
      ctx.lineTo(pNearRight.x + 16, pSkirtNearRight.y + 12);
      ctx.lineTo(pNearLeft.x - 16, pSkirtNearLeft.y + 12);
      ctx.closePath();
      ctx.fill();

      // 2. 3D Table Support Legs
      const legInsetX = 0.16;
      const legInsetZ = 0.24;
      const drawTableLeg = (top: { x: number; y: number; scale: number }, foot: { x: number; y: number; scale: number }) => {
        const legWidth = Math.max(3, 7 * (foot.scale / 180));
        ctx.strokeStyle = '#2B303A';
        ctx.lineWidth = legWidth;
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();

        ctx.fillStyle = '#1A1C20';
        ctx.fillRect(foot.x - legWidth * 0.7, foot.y - 2, legWidth * 1.4, 4);
      };

      const pLegFarLeftTop = project3D(-tHalfW + legInsetX, skirtDepth, tHalfL - legInsetZ, width, height);
      const pLegFarLeftFoot = project3D(-tHalfW + legInsetX, floorY, tHalfL - legInsetZ, width, height);
      const pLegFarRightTop = project3D(tHalfW - legInsetX, skirtDepth, tHalfL - legInsetZ, width, height);
      const pLegFarRightFoot = project3D(tHalfW - legInsetX, floorY, tHalfL - legInsetZ, width, height);
      const pLegNearLeftTop = project3D(-tHalfW + legInsetX, skirtDepth, -tHalfL + legInsetZ, width, height);
      const pLegNearLeftFoot = project3D(-tHalfW + legInsetX, floorY, -tHalfL + legInsetZ, width, height);
      const pLegNearRightTop = project3D(tHalfW - legInsetX, skirtDepth, -tHalfL + legInsetZ, width, height);
      const pLegNearRightFoot = project3D(tHalfW - legInsetX, floorY, -tHalfL + legInsetZ, width, height);

      drawTableLeg(pLegFarLeftTop, pLegFarLeftFoot);
      drawTableLeg(pLegFarRightTop, pLegFarRightFoot);
      drawTableLeg(pLegNearLeftTop, pLegNearLeftFoot);
      drawTableLeg(pLegNearRightTop, pLegNearRightFoot);

      // 3. Cobalt Blue Front & Side Aprons
      ctx.fillStyle = '#166DB8';
      ctx.beginPath();
      ctx.moveTo(pNearLeft.x, pNearLeft.y);
      ctx.lineTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pSkirtNearRight.x, pSkirtNearRight.y);
      ctx.lineTo(pSkirtNearLeft.x, pSkirtNearLeft.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#10538E';
      ctx.beginPath();
      ctx.moveTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pFarRight.x, pFarRight.y);
      ctx.lineTo(pSkirtFarRight.x, pSkirtFarRight.y);
      ctx.lineTo(pSkirtNearRight.x, pSkirtNearRight.y);
      ctx.closePath();
      ctx.fill();

      // 4. Vibrant Sky Blue Table Surface
      const tableGrad = ctx.createLinearGradient(0, pFarLeft.y, 0, pNearLeft.y);
      tableGrad.addColorStop(0, '#2898DC');
      tableGrad.addColorStop(0.35, '#2BA0E6');
      tableGrad.addColorStop(1, '#2389C7');

      ctx.fillStyle = tableGrad;
      ctx.beginPath();
      ctx.moveTo(pFarLeft.x, pFarLeft.y);
      ctx.lineTo(pFarRight.x, pFarRight.y);
      ctx.lineTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pNearLeft.x, pNearLeft.y);
      ctx.closePath();
      ctx.fill();

      // White Border Lines
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pFarLeft.x, pFarLeft.y);
      ctx.lineTo(pFarRight.x, pFarRight.y);
      ctx.lineTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pNearLeft.x, pNearLeft.y);
      ctx.closePath();
      ctx.stroke();

      // Center Divider Line
      const pFarCenter = project3D(0, 0, tHalfL, width, height);
      const pNearCenter = project3D(0, 0, -tHalfL, width, height);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(pFarCenter.x, pFarCenter.y);
      ctx.lineTo(pNearCenter.x, pNearCenter.y);
      ctx.stroke();

      // 5. White Net (at z = 0)
      const pNetLeft = project3D(-tHalfW - 0.07, 0, 0, width, height);
      const pNetRight = project3D(tHalfW + 0.07, 0, 0, width, height);
      const pNetTopLeft = project3D(-tHalfW - 0.07, s.netHeight, 0, width, height);
      const pNetTopRight = project3D(tHalfW + 0.07, s.netHeight, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.moveTo(pNetLeft.x, pNetLeft.y);
      ctx.lineTo(pNetRight.x, pNetRight.y);
      ctx.lineTo(pNetTopRight.x, pNetTopRight.y);
      ctx.lineTo(pNetTopLeft.x, pNetTopLeft.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(pNetTopLeft.x, pNetTopLeft.y);
      ctx.lineTo(pNetTopRight.x, pNetTopRight.y);
      ctx.stroke();

      ctx.fillStyle = '#22252A';
      ctx.fillRect(pNetTopLeft.x - 3, pNetTopLeft.y, 6, pNetLeft.y - pNetTopLeft.y + 6);
      ctx.fillRect(pNetTopRight.x - 3, pNetTopRight.y, 6, pNetRight.y - pNetTopRight.y + 6);

      // 6. RIVAL PADDLE (Far side - Charcoal Black)
      const oppProj = project3D(oBat.x, oBat.y, oBat.z, width, height);
      const oppRadius = Math.max(16, 28 * (oppProj.scale / 180));

      ctx.save();
      ctx.translate(oppProj.x, oppProj.y);
      ctx.rotate(oBat.tilt);

      // Handle
      ctx.fillStyle = '#A67B48';
      ctx.beginPath();
      ctx.roundRect(-oppRadius * 0.18, -oppRadius * 1.3, oppRadius * 0.36, oppRadius * 0.75, 4);
      ctx.fill();

      // Rim
      ctx.fillStyle = '#E8C595';
      ctx.beginPath();
      ctx.ellipse(0, 0, oppRadius * 1.05, oppRadius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rubber Face
      ctx.fillStyle = '#282A2E';
      ctx.beginPath();
      ctx.ellipse(0, 0, oppRadius * 0.98, oppRadius * 1.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. MOTION TRAIL RIBBON
      if (s.pathHistory.length > 2) {
        for (let i = 0; i < s.pathHistory.length - 1; i++) {
          const p1 = s.pathHistory[i];
          const p2 = s.pathHistory[i + 1];
          const ageRatio = i / s.pathHistory.length;
          const alpha = ageRatio * 0.65;
          const ribbonWidth = Math.max(2, 6 * (p2.scale / 180) * ageRatio);

          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = ribbonWidth;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // 8. CONTACT SHOCKWAVE HIT RINGS
      for (let i = s.hitRings.length - 1; i >= 0; i--) {
        const ring = s.hitRings[i];
        ring.radius += 2.4;
        ring.alpha -= 0.05;

        if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
          s.hitRings.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.alpha;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 9. PARTICLES & SPARKS
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.04;

        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 10. TABLE TENNIS BALL (Golden Yellow 3D Shaded Sphere)
      const ballProj = project3D(b.x, b.y, b.z, width, height);
      const ballRadius = Math.max(7, 13 * (ballProj.scale / 180));

      const shadowY = b.y >= 0 ? 0.005 : s.floorLevel;
      const ballShadowProj = project3D(b.x, shadowY, b.z, width, height);
      const heightAboveSurface = Math.max(0, b.y - shadowY);
      const shadowAlpha = Math.max(0, 0.42 - heightAboveSurface * 0.45);
      const shadowRadius = ballRadius * (1 + heightAboveSurface * 0.6);

      if (shadowAlpha > 0) {
        ctx.fillStyle = `rgba(18, 50, 80, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(ballShadowProj.x, ballShadowProj.y, shadowRadius * 1.1, shadowRadius * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const ballGrad = ctx.createRadialGradient(
        ballProj.x - ballRadius * 0.35, ballProj.y - ballRadius * 0.35, ballRadius * 0.1,
        ballProj.x, ballProj.y, ballRadius
      );
      ballGrad.addColorStop(0, '#FFFFFF');
      ballGrad.addColorStop(0.25, '#FFF275');
      ballGrad.addColorStop(0.65, '#FFC226');
      ballGrad.addColorStop(1, '#D68900');

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballProj.x, ballProj.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // 11. PLAYER PADDLE (Sleek Proportional Red Racket)
      const playerProj = project3D(pBat.x, pBat.y, pBat.z, width, height);
      const playerBatRadius = Math.max(22, 38 * (playerProj.scale / 180));

      ctx.save();
      ctx.translate(playerProj.x, playerProj.y);
      ctx.rotate(pBat.tilt);

      if (pBat.swingProgress > 0) {
        const recoil = Math.sin(pBat.swingProgress * Math.PI) * 0.14;
        ctx.scale(1 + recoil, 1 - recoil);
      }

      // Handle
      const handleW = playerBatRadius * 0.34;
      const handleH = playerBatRadius * 1.25;
      const handleGrad = ctx.createLinearGradient(-handleW / 2, 0, handleW / 2, 0);
      handleGrad.addColorStop(0, '#9C6F3B');
      handleGrad.addColorStop(0.5, '#DAB37B');
      handleGrad.addColorStop(1, '#835928');
      ctx.fillStyle = handleGrad;
      ctx.beginPath();
      ctx.roundRect(-handleW / 2, playerBatRadius * 0.2, handleW, handleH, 5);
      ctx.fill();

      // Blade Rim
      ctx.fillStyle = '#F5DEB3';
      ctx.beginPath();
      ctx.ellipse(0, -playerBatRadius * 0.32, playerBatRadius * 1.05, playerBatRadius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red Rubber Face
      const rubberGrad = ctx.createRadialGradient(
        -playerBatRadius * 0.28, -playerBatRadius * 0.6, playerBatRadius * 0.15,
        0, -playerBatRadius * 0.32, playerBatRadius
      );
      rubberGrad.addColorStop(0, '#D64040');
      rubberGrad.addColorStop(0.65, '#B22222');
      rubberGrad.addColorStop(1, '#7A1414');
      ctx.fillStyle = rubberGrad;
      ctx.beginPath();
      ctx.ellipse(0, -playerBatRadius * 0.32, playerBatRadius * 0.98, playerBatRadius * 1.08, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReducedMotion, playFloorBounce, playPaddleHit, playTableBounce, playWinCheer]);

  // Touch & Mouse Pointer Handling
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const normX = ((px / rect.width) - 0.5) * 2;
    const normY = ((py / rect.height) - 0.5) * 2;

    const s = stateRef.current;
    const prevTargetX = s.playerBat.targetX;
    const prevTargetY = s.playerBat.targetY;

    s.playerBat.targetX = normX * 1.30;
    s.playerBat.targetY = Math.max(0.05, Math.min(0.9, 0.26 - normY * 0.55));

    // Direct swipe to serve when in serve state
    if (s.gameState === 'serve' && s.currentServer === 'player') {
      const moveDelta = Math.hypot(s.playerBat.targetX - prevTargetX, s.playerBat.targetY - prevTargetY);
      if (moveDelta > 0.02) {
        serveBall(true);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
    if (stateRef.current.gameState === 'serve' && stateRef.current.currentServer === 'player') {
      serveBall(true);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#DFBA88',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'none'
        }}
      />

      {/* Clean 11-Point Tournament Scoreboard Header */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 20
        }}
      >
        {/* Match Score Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            color: '#2C302E'
          }}
        >
          {/* YOU (Player) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {currentServer === 'player' && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#E63946',
                  boxShadow: '0 0 8px #E63946'
                }}
              />
            )}
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D64040', letterSpacing: '0.04em' }}>YOU</span>
            <span
              style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                color: '#2C302E',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {playerScore}
            </span>
          </div>

          <span style={{ fontSize: '1.1rem', color: '#D5C8B8', fontWeight: 800 }}>:</span>

          {/* RIVAL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                color: '#2C302E',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {rivalScore}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4A5568', letterSpacing: '0.04em' }}>RIVAL</span>
            {currentServer === 'rival' && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#4A5568',
                  boxShadow: '0 0 8px #4A5568'
                }}
              />
            )}
          </div>

          <span style={{ fontSize: '0.9rem', color: '#D5C8B8', fontWeight: 800 }}>|</span>

          {/* Active Rally Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame
              size={16}
              color={consecutiveRally >= 5 ? '#FF4500' : '#EA580C'}
              style={{
                filter: consecutiveRally >= 5 ? 'drop-shadow(0 0 6px rgba(255, 69, 0, 0.6))' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
            <span
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                color: consecutiveRally >= 5 ? '#EA580C' : '#6A7279',
                minWidth: '16px',
                textAlign: 'center'
              }}
            >
              {consecutiveRally}
            </span>
          </div>
        </div>

        {/* Top Controls: Sound & Restart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.90)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              color: isMuted ? 'var(--text-tertiary)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={resetMatch}
            aria-label="Restart Match"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.90)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Real-time Shot Feedback Pill */}
      {shotFeedback && !matchWinner && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: '116px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            color: '#FFD166',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            pointerEvents: 'none',
            zIndex: 20
          }}
        >
          {shotFeedback}
        </div>
      )}

      {/* Match Over Modal */}
      {matchWinner && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 50
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              borderRadius: '24px',
              padding: '28px 24px',
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.20)',
              border: '1px solid rgba(255, 255, 255, 0.6)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: matchWinner === 'player' ? 'rgba(46, 160, 67, 0.12)' : 'rgba(230, 57, 70, 0.12)',
                color: matchWinner === 'player' ? '#2EA043' : '#E63946',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Trophy size={30} />
            </div>

            <h3
              style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#1F2421',
                marginBottom: '6px',
                fontFamily: 'var(--font-display)'
              }}
            >
              {matchWinner === 'player' ? 'VICTORY! 🏆' : 'MATCH COMPLETED'}
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#6A7279', marginBottom: '18px' }}>
              {matchWinner === 'player'
                ? 'Outstanding performance! You won the tournament match.'
                : 'Good fight! Keep training to beat your rival.'}
            </p>

            {/* Score Box */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: '#F7FAFC',
                padding: '12px 18px',
                borderRadius: '16px',
                marginBottom: '20px',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D64040' }}>YOU</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1F2421' }}>{playerScore}</div>
              </div>
              <div style={{ fontSize: '1.2rem', color: '#CBD5E1', fontWeight: 900 }}>:</div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4A5568' }}>RIVAL</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1F2421' }}>{rivalScore}</div>
              </div>
            </div>

            <button
              onClick={resetMatch}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#1F2421',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.15s ease'
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
