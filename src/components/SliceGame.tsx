import React, { useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

interface SliceableItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'orange' | 'watermelon' | 'soap' | 'kiwi' | 'crystal' | 'cake';
  primaryColor: string;
  innerColor: string;
  detailColor: string;
  isSliced: boolean;
  leftHalf: { x: number; y: number; vx: number; vy: number; rot: number; vRot: number; alpha: number };
  rightHalf: { x: number; y: number; vx: number; vy: number; rot: number; vRot: number; alpha: number };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export const SliceGame: React.FC = () => {
  const { theme, isReducedMotion, playSliceSound } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Knife physics state
  const knifeRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    vRot: number;
    isFlipping: boolean;
    isStuck: boolean;
    stuckY: number;
    knifeLength: number;
    knifeWidth: number;
  }>({
    x: 90,
    y: 260,
    vx: 0,
    vy: 0,
    rotation: -0.35,
    vRot: 0,
    isFlipping: false,
    isStuck: true,
    stuckY: 280,
    knifeLength: 74,
    knifeWidth: 16
  });

  const cameraXRef = useRef(0);
  const itemsRef = useRef<SliceableItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextItemIdRef = useRef(1);

  // Palette of items to slice
  const itemDefinitions = [
    { type: 'orange', primaryColor: '#FFA500', innerColor: '#FFD700', detailColor: '#FFFFFF', w: 50, h: 50 },
    { type: 'watermelon', primaryColor: '#2E8B57', innerColor: '#FF4D6D', detailColor: '#2B2B2B', w: 58, h: 52 },
    { type: 'soap', primaryColor: '#9D8DF1', innerColor: '#E2DCFC', detailColor: '#7965E8', w: 56, h: 44 },
    { type: 'kiwi', primaryColor: '#8B5A2B', innerColor: '#76B947', detailColor: '#262626', w: 48, h: 48 },
    { type: 'crystal', primaryColor: '#4CC9F0', innerColor: '#D0F4DE', detailColor: '#FFFFFF', w: 46, h: 56 },
    { type: 'cake', primaryColor: '#FF758F', innerColor: '#FFF0F3', detailColor: '#FF4D6D', w: 54, h: 46 }
  ] as const;

  // Spawn initial track of items
  const initTrack = useCallback((groundY: number) => {
    const items: SliceableItem[] = [];
    let currentX = 280;

    for (let i = 0; i < 24; i++) {
      const def = itemDefinitions[i % itemDefinitions.length];
      items.push({
        id: nextItemIdRef.current++,
        x: currentX,
        y: groundY - def.h,
        width: def.w,
        height: def.h,
        type: def.type,
        primaryColor: def.primaryColor,
        innerColor: def.innerColor,
        detailColor: def.detailColor,
        isSliced: false,
        leftHalf: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vRot: 0, alpha: 1 },
        rightHalf: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vRot: 0, alpha: 1 }
      });
      currentX += 130 + Math.random() * 60;
    }

    itemsRef.current = items;
    particlesRef.current = [];
    cameraXRef.current = 0;

    knifeRef.current.x = 90;
    knifeRef.current.y = groundY - 14;
    knifeRef.current.stuckY = groundY - 14;
    knifeRef.current.rotation = -0.35;
    knifeRef.current.isStuck = true;
    knifeRef.current.isFlipping = false;
  }, []);

  // Jump and flip the knife forward
  const flipKnife = useCallback(() => {
    const k = knifeRef.current;
    k.isStuck = false;
    k.isFlipping = true;

    k.vy = isReducedMotion ? -6.8 : -9.5;
    k.vx = isReducedMotion ? 4.2 : 5.0;
    k.vRot = isReducedMotion ? 0.08 : 0.23;

    playSliceSound(0.95);
  }, [isReducedMotion, playSliceSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let displayWidth = container.clientWidth;
    let displayHeight = container.clientHeight;
    let groundY = displayHeight * 0.72;

    const handleResize = () => {
      if (!container || !canvas) return;
      displayWidth = container.clientWidth;
      displayHeight = container.clientHeight;
      groundY = displayHeight * 0.72;
      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
      ctx.scale(dpr, dpr);
      initTrack(groundY);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Spawn slice particles
    const spawnSliceParticles = (x: number, y: number, color: string) => {
      if (isReducedMotion) return;
      for (let i = 0; i < 14; i++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 7,
          vy: -(Math.random() * 5 + 2),
          color,
          size: Math.random() * 4 + 2.5,
          alpha: 1,
          life: 1
        });
      }
    };

    // Check collision between knife blade and items
    const checkSlicing = () => {
      const k = knifeRef.current;
      const bladeTipX = k.x + Math.cos(k.rotation) * (k.knifeLength * 0.75);
      const bladeTipY = k.y + Math.sin(k.rotation) * (k.knifeLength * 0.75);

      const items = itemsRef.current;

      items.forEach((item) => {
        if (item.isSliced) return;

        if (
          bladeTipX >= item.x - 12 &&
          bladeTipX <= item.x + item.width + 12 &&
          bladeTipY >= item.y - 12 &&
          bladeTipY <= item.y + item.height + 18
        ) {
          item.isSliced = true;
          item.leftHalf = {
            x: item.x,
            y: item.y,
            vx: -3.0 - Math.random() * 2,
            vy: -4.0 - Math.random() * 2,
            rot: 0,
            vRot: -0.1 - Math.random() * 0.08,
            alpha: 1
          };
          item.rightHalf = {
            x: item.x + item.width / 2,
            y: item.y,
            vx: 3.8 + Math.random() * 2,
            vy: -3.6 - Math.random() * 2,
            rot: 0,
            vRot: 0.1 + Math.random() * 0.08,
            alpha: 1
          };

          spawnSliceParticles(item.x + item.width / 2, item.y + item.height / 2, item.innerColor);
          playSliceSound(1.25);
        }
      });
    };

    // Input handlers
    const handleTap = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      flipKnife();
    };

    canvas.addEventListener('mousedown', handleTap);
    canvas.addEventListener('touchstart', handleTap, { passive: false });

    // Draw single sliceable item or its two halves
    const drawItem = (item: SliceableItem, offsetX: number) => {
      const drawX = item.x - offsetX;

      if (!item.isSliced) {
        ctx.save();
        ctx.translate(drawX, item.y);

        ctx.fillStyle = theme === 'dusk' ? 'rgba(0,0,0,0.35)' : 'rgba(44, 48, 46, 0.08)';
        ctx.beginPath();
        ctx.ellipse(item.width / 2, item.height + 4, item.width * 0.55, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = item.primaryColor;
        ctx.beginPath();
        ctx.roundRect(0, 0, item.width, item.height, 10);
        ctx.fill();

        ctx.fillStyle = item.innerColor;
        ctx.beginPath();
        ctx.roundRect(4, 4, item.width - 8, item.height - 8, 8);
        ctx.fill();

        if (item.type === 'watermelon' || item.type === 'kiwi') {
          ctx.fillStyle = item.detailColor;
          ctx.beginPath();
          ctx.arc(item.width * 0.35, item.height * 0.45, 2, 0, Math.PI * 2);
          ctx.arc(item.width * 0.65, item.height * 0.45, 2, 0, Math.PI * 2);
          ctx.arc(item.width * 0.5, item.height * 0.65, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'orange') {
          ctx.strokeStyle = item.primaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(item.width / 2, 8);
          ctx.lineTo(item.width / 2, item.height - 8);
          ctx.moveTo(8, item.height / 2);
          ctx.lineTo(item.width - 8, item.height / 2);
          ctx.stroke();
        }

        ctx.restore();
      } else {
        const l = item.leftHalf;
        if (l.alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = l.alpha;
          ctx.translate(l.x - offsetX + item.width / 4, l.y + item.height / 2);
          ctx.rotate(l.rot);

          ctx.fillStyle = item.primaryColor;
          ctx.beginPath();
          ctx.roundRect(-item.width / 4, -item.height / 2, item.width / 2, item.height, [8, 0, 0, 8]);
          ctx.fill();

          ctx.fillStyle = item.innerColor;
          ctx.beginPath();
          ctx.roundRect(-item.width / 4 + 3, -item.height / 2 + 3, item.width / 2 - 4, item.height - 6, [6, 0, 0, 6]);
          ctx.fill();
          ctx.restore();
        }

        const r = item.rightHalf;
        if (r.alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = r.alpha;
          ctx.translate(r.x - offsetX + item.width / 4, r.y + item.height / 2);
          ctx.rotate(r.rot);

          ctx.fillStyle = item.primaryColor;
          ctx.beginPath();
          ctx.roundRect(-item.width / 4, -item.height / 2, item.width / 2, item.height, [0, 8, 8, 0]);
          ctx.fill();

          ctx.fillStyle = item.innerColor;
          ctx.beginPath();
          ctx.roundRect(-item.width / 4 + 1, -item.height / 2 + 3, item.width / 2 - 4, item.height - 6, [0, 6, 6, 0]);
          ctx.fill();
          ctx.restore();
        }
      }
    };

    // Draw knife
    const drawKnife = (x: number, y: number, rotation: number, offsetX: number) => {
      const drawX = x - offsetX;

      ctx.save();
      ctx.translate(drawX, y);
      ctx.rotate(rotation);

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(15, 12, 35, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const bladeGrad = ctx.createLinearGradient(0, -12, 60, 12);
      bladeGrad.addColorStop(0, '#FFFFFF');
      bladeGrad.addColorStop(0.3, '#E8ECEF');
      bladeGrad.addColorStop(0.7, '#C5CCD1');
      bladeGrad.addColorStop(1, '#9AA2A8');

      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(55, -8, 65, 0);
      ctx.lineTo(48, 12);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(55, -8, 65, 0);
      ctx.stroke();

      const handleGrad = ctx.createLinearGradient(-35, -8, 0, 8);
      handleGrad.addColorStop(0, '#8A4515');
      handleGrad.addColorStop(0.5, '#C67A32');
      handleGrad.addColorStop(1, '#6E340E');

      ctx.fillStyle = handleGrad;
      ctx.beginPath();
      ctx.roundRect(-38, -8, 38, 16, [6, 2, 2, 6]);
      ctx.fill();

      ctx.fillStyle = '#F4D06F';
      ctx.beginPath();
      ctx.arc(-14, 0, 2.2, 0, Math.PI * 2);
      ctx.arc(-26, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      ctx.fillStyle = theme === 'dusk' ? '#171A19' : '#FAF8F5';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      const k = knifeRef.current;
      const items = itemsRef.current;
      const particles = particlesRef.current;

      if (k.isFlipping) {
        k.x += k.vx;
        k.y += k.vy;
        k.vy += 0.44;
        k.rotation += k.vRot;

        checkSlicing();

        if (k.y >= k.stuckY) {
          k.y = k.stuckY;
          k.vy = 0;
          k.vx = 0;
          k.vRot = 0;
          k.isFlipping = false;
          k.isStuck = true;
          k.rotation = -0.35;
        }
      }

      const targetCamX = Math.max(0, k.x - 120);
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;
      const camX = cameraXRef.current;

      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.x - camX < displayWidth + 300) {
        const def = itemDefinitions[nextItemIdRef.current % itemDefinitions.length];
        items.push({
          id: nextItemIdRef.current++,
          x: lastItem.x + 130 + Math.random() * 50,
          y: groundY - def.h,
          width: def.w,
          height: def.h,
          type: def.type,
          primaryColor: def.primaryColor,
          innerColor: def.innerColor,
          detailColor: def.detailColor,
          isSliced: false,
          leftHalf: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vRot: 0, alpha: 1 },
          rightHalf: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vRot: 0, alpha: 1 }
        });
      }

      ctx.fillStyle = theme === 'dusk' ? '#212724' : '#EFEAE1';
      ctx.fillRect(0, groundY, displayWidth, displayHeight - groundY);

      ctx.strokeStyle = theme === 'dusk' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(displayWidth, groundY);
      ctx.stroke();

      items.forEach((item) => {
        if (item.isSliced) {
          const l = item.leftHalf;
          const r = item.rightHalf;

          l.x += l.vx;
          l.y += l.vy;
          l.vy += 0.35;
          l.rot += l.vRot;
          l.alpha = Math.max(0, l.alpha - 0.015);

          r.x += r.vx;
          r.y += r.vy;
          r.vy += 0.35;
          r.rot += r.vRot;
          r.alpha = Math.max(0, r.alpha - 0.015);
        }

        if (item.x - camX > -100 && item.x - camX < displayWidth + 100) {
          drawItem(item, camX);
        }
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.life -= 0.03;

        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      drawKnife(k.x, k.y, k.rotation, camX);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleTap);
      canvas.removeEventListener('touchstart', handleTap);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isReducedMotion, initTrack, flipKnife, playSliceSound]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
        touchAction: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Tactile slicing interaction canvas"
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
          color: 'var(--text-tertiary)',
          fontSize: '0.85rem',
          padding: '0 20px',
          letterSpacing: '0.01em'
        }}
      >
        Tap or click anywhere to flip and slice
      </div>
    </div>
  );
};
