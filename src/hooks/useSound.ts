import { useState, useRef, useCallback, useEffect } from 'react';
import { NatureSound } from '../types';

export function useSound() {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<NatureSound>('breeze');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Active nature sound nodes
  const natureNodesRef = useRef<{
    sources: AudioBufferSourceNode[];
    gains: GainNode[];
    filters: BiquadFilterNode[];
    lfos?: OscillatorNode[];
  } | null>(null);

  const isPlayingRef = useRef<boolean>(false);

  // Initialize and unlock AudioContext with Master Compressor
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;

    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }

      const ctx = audioCtxRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        if (!masterGainRef.current || !compressorRef.current) {
          const compressor = ctx.createDynamicsCompressor();
          compressor.threshold.setValueAtTime(-28, ctx.currentTime);
          compressor.knee.setValueAtTime(32, ctx.currentTime);
          compressor.ratio.setValueAtTime(6, ctx.currentTime);
          compressor.attack.setValueAtTime(0.01, ctx.currentTime);
          compressor.release.setValueAtTime(0.35, ctx.currentTime);
          compressor.connect(ctx.destination);
          compressorRef.current = compressor;

          const master = ctx.createGain();
          master.gain.setValueAtTime(0.35, ctx.currentTime);
          master.connect(compressor);
          masterGainRef.current = master;
        }
      }

      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Stop nature ambient sound smoothly
  const stopAmbient = useCallback(() => {
    isPlayingRef.current = false;
    if (natureNodesRef.current) {
      const { sources, gains, lfos } = natureNodesRef.current;

      if (audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        gains.forEach((g) => {
          try {
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(g.gain.value, now);
            g.gain.linearRampToValueAtTime(0.0001, now + 0.8);
          } catch {
            // Handled
          }
        });
      }

      setTimeout(() => {
        sources.forEach((s) => {
          try {
            s.stop();
            s.disconnect();
          } catch {
            // Handled
          }
        });
        lfos?.forEach((l) => {
          try {
            l.stop();
            l.disconnect();
          } catch {
            // Handled
          }
        });
      }, 900);

      natureNodesRef.current = null;
    }
  }, []);

  // Start natural ambient sound generator
  const startAmbient = useCallback(
    (soundType: NatureSound = ambientSound) => {
      const ctx = getAudioContext();
      if (!ctx) return;

      const runNatureAudio = () => {
        stopAmbient();
        isPlayingRef.current = true;

        try {
          const sampleRate = ctx.sampleRate;
          const bufferSize = sampleRate * 6;
          const sources: AudioBufferSourceNode[] = [];
          const gains: GainNode[] = [];
          const filters: BiquadFilterNode[] = [];
          const lfos: OscillatorNode[] = [];

          const now = ctx.currentTime;

          if (soundType === 'breeze' || soundType === 'forest') {
            const windBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
            const windData = windBuffer.getChannelData(0);

            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              windData[i] = (lastOut + 0.015 * white) / 1.015;
              lastOut = windData[i];
              windData[i] *= 1.8;
            }

            const windSource = ctx.createBufferSource();
            windSource.buffer = windBuffer;
            windSource.loop = true;

            const windFilter = ctx.createBiquadFilter();
            windFilter.type = 'lowpass';
            windFilter.frequency.setValueAtTime(260, now);
            windFilter.Q.setValueAtTime(0.5, now);

            const windGain = ctx.createGain();
            windGain.gain.setValueAtTime(0.0001, now);
            windGain.gain.linearRampToValueAtTime(soundType === 'forest' ? 0.05 : 0.075, now + 2.0);

            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(0.06, now);
            lfoGain.gain.setValueAtTime(90, now);
            lfo.connect(windFilter.frequency);
            lfo.start();
            lfos.push(lfo);

            windSource.connect(windFilter);
            windFilter.connect(windGain);

            const leavesBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
            const leavesData = leavesBuffer.getChannelData(0);
            let b0 = 0, b1 = 0;
            for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              b0 = 0.99 * b0 + white * 0.04;
              b1 = 0.95 * b1 + white * 0.03;
              leavesData[i] = (b0 + b1) * 0.35;
            }

            const leavesSource = ctx.createBufferSource();
            leavesSource.buffer = leavesBuffer;
            leavesSource.loop = true;

            const leavesFilter = ctx.createBiquadFilter();
            leavesFilter.type = 'bandpass';
            leavesFilter.frequency.setValueAtTime(750, now);
            leavesFilter.Q.setValueAtTime(0.6, now);

            const leavesGain = ctx.createGain();
            leavesGain.gain.setValueAtTime(0.0001, now);
            leavesGain.gain.linearRampToValueAtTime(0.025, now + 2.2);

            leavesSource.connect(leavesFilter);
            leavesFilter.connect(leavesGain);

            if (masterGainRef.current) {
              windGain.connect(masterGainRef.current);
              leavesGain.connect(masterGainRef.current);
            } else {
              windGain.connect(ctx.destination);
              leavesGain.connect(ctx.destination);
            }

            windSource.start();
            leavesSource.start();
            sources.push(windSource, leavesSource);
            gains.push(windGain, leavesGain);
            filters.push(windFilter, leavesFilter);
          }

          if (soundType === 'rain' || soundType === 'forest') {
            const rainBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
            const rainData = rainBuffer.getChannelData(0);

            let r0 = 0, r1 = 0, r2 = 0;
            for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              r0 = 0.998 * r0 + white * 0.03;
              r1 = 0.97 * r1 + white * 0.04;
              r2 = 0.7 * r2 + white * 0.06;
              rainData[i] = (r0 + r1 + r2) * 0.07;
            }

            const rainSource = ctx.createBufferSource();
            rainSource.buffer = rainBuffer;
            rainSource.loop = true;

            const rainFilter = ctx.createBiquadFilter();
            rainFilter.type = 'bandpass';
            rainFilter.frequency.setValueAtTime(950, now);
            rainFilter.Q.setValueAtTime(0.55, now);

            const rainGain = ctx.createGain();
            rainGain.gain.setValueAtTime(0.0001, now);
            rainGain.gain.linearRampToValueAtTime(soundType === 'forest' ? 0.035 : 0.055, now + 2.0);

            rainSource.connect(rainFilter);
            rainFilter.connect(rainGain);

            if (masterGainRef.current) {
              rainGain.connect(masterGainRef.current);
            } else {
              rainGain.connect(ctx.destination);
            }

            rainSource.start();
            sources.push(rainSource);
            gains.push(rainGain);
            filters.push(rainFilter);
          }

          natureNodesRef.current = { sources, gains, filters, lfos };
        } catch {
          // Handled
        }
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(runNatureAudio).catch(runNatureAudio);
      } else {
        runNatureAudio();
      }
    },
    [ambientSound, getAudioContext, stopAmbient]
  );

  const toggleMute = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (nextMuted) {
        stopAmbient();
      } else {
        startAmbient(ambientSound);
      }
      return nextMuted;
    });
  }, [ambientSound, getAudioContext, startAmbient, stopAmbient]);

  const selectAmbientSound = useCallback(
    (sound: NatureSound) => {
      setAmbientSound(sound);
      if (!isMuted) {
        startAmbient(sound);
      }
    },
    [isMuted, startAmbient]
  );

  // Soft slice sound effect for Quiet Game cuts
  const playSliceSound = useCallback(
    (pitchMultiplier = 1) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;
        const sampleRate = ctx.sampleRate;
        const bufferSize = Math.floor(sampleRate * 0.05);
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          const decay = 1 - i / bufferSize;
          data[i] = (Math.random() * 2 - 1) * Math.pow(decay, 2.5);
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2400 * pitchMultiplier, now);
        bandpass.Q.setValueAtTime(2.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        noiseSource.connect(bandpass);
        bandpass.connect(noiseGain);

        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'sine';
        const baseFreq = (480 + Math.random() * 180) * pitchMultiplier;
        popOsc.frequency.setValueAtTime(baseFreq, now);
        popOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.07);

        popGain.gain.setValueAtTime(0.16, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        popOsc.connect(popGain);

        if (masterGainRef.current) {
          noiseGain.connect(masterGainRef.current);
          popGain.connect(masterGainRef.current);
        } else {
          noiseGain.connect(ctx.destination);
          popGain.connect(ctx.destination);
        }

        noiseSource.start(now);
        popOsc.start(now);
        popOsc.stop(now + 0.08);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );


  // REALISTIC ACOUSTIC TABLE TENNIS PADDLE HIT SOUND ("pock" / "thock")
  const playPaddleHit = useCallback(
    (pitchMultiplier = 1) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;

        // 1. Blade Wood Fundamental Resonant Body ("pock" transient ~520Hz dropping fast to ~180Hz)
        const woodOsc = ctx.createOscillator();
        const woodGain = ctx.createGain();
        woodOsc.type = 'sine';
        const f0 = 540 * pitchMultiplier;
        woodOsc.frequency.setValueAtTime(f0, now);
        woodOsc.frequency.exponentialRampToValueAtTime(160, now + 0.028);

        woodGain.gain.setValueAtTime(0.32, now);
        woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
        woodOsc.connect(woodGain);

        // 2. Rubber Sponge Compression Pop (~240Hz sub-pop)
        const thumpOsc = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        thumpOsc.type = 'triangle';
        thumpOsc.frequency.setValueAtTime(260 * pitchMultiplier, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(80, now + 0.022);

        thumpGain.gain.setValueAtTime(0.28, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        thumpOsc.connect(thumpGain);

        // 3. Crisp Celluloid Ping Contact Click (Bandpassed snappy impact ~2400Hz)
        const sampleRate = ctx.sampleRate;
        const bufferSize = Math.floor(sampleRate * 0.018);
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const decay = 1 - i / bufferSize;
          data[i] = (Math.random() * 2 - 1) * Math.pow(decay, 3.8);
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2400 * pitchMultiplier, now);
        noiseFilter.Q.setValueAtTime(2.8, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.24, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        // Master routing
        const out = masterGainRef.current || ctx.destination;
        woodGain.connect(out);
        thumpGain.connect(out);
        noiseGain.connect(out);

        woodOsc.start(now);
        woodOsc.stop(now + 0.04);
        thumpOsc.start(now);
        thumpOsc.stop(now + 0.03);
        noiseSource.start(now);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );

  // REALISTIC CRISP WOODEN TABLE BOUNCE SOUND ("tock")
  const playTableBounce = useCallback(
    (pitchMultiplier = 1) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;

        // 1. Table Board Click Transient (~780Hz -> 280Hz)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(760 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.022);

        oscGain.gain.setValueAtTime(0.26, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        osc.connect(oscGain);

        // 2. High Table Surface Click (Bandpass at ~3200Hz)
        const sampleRate = ctx.sampleRate;
        const bufferSize = Math.floor(sampleRate * 0.014);
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const decay = 1 - i / bufferSize;
          data[i] = (Math.random() * 2 - 1) * Math.pow(decay, 4);
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200 * pitchMultiplier, now);
        filter.Q.setValueAtTime(3.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.20, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

        noiseSource.connect(filter);
        filter.connect(noiseGain);

        const out = masterGainRef.current || ctx.destination;
        oscGain.connect(out);
        noiseGain.connect(out);

        osc.start(now);
        osc.stop(now + 0.03);
        noiseSource.start(now);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );

  // Soft Wooden Floor Bounce Sound (When ball falls off table to ground)
  const playFloorBounce = useCallback(
    (pitchMultiplier = 1) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

        oscGain.gain.setValueAtTime(0.18, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(oscGain);

        const out = masterGainRef.current || ctx.destination;
        oscGain.connect(out);
        osc.start(now);
        osc.stop(now + 0.045);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );

  // Uplifting Celebratory Win Fanfare (3-note ascending arpeggio chord)
  const playWinCheer = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major Triad arpeggio)
      const out = masterGainRef.current || ctx.destination;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, noteTime);

        noteGain.gain.setValueAtTime(0.0001, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.16, noteTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.55);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(out);

        osc.start(noteTime);
        osc.stop(noteTime + 0.6);
      });
    } catch {
      // Handled
    }
  }, [getAudioContext, isMuted]);

  // Gentle chime for subtle interactions
  const playChime = useCallback(
    (freq = 523.25) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.12, now + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(filter);
        filter.connect(noteGain);

        if (masterGainRef.current) {
          noteGain.connect(masterGainRef.current);
        } else {
          noteGain.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + 1.9);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );

  // Soft, crisp, tactile organic pop for Stroop answers (satisfying, zero lingering tone)
  const playStroopCorrect = useCallback(
    (streakCount = 0) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;
        // Subtle pitch variation with streak for tactile satisfaction (360Hz - 520Hz)
        const scale = [360, 400, 440, 480, 520];
        const freq = scale[streakCount % scale.length];

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.022);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        noteGain.gain.setValueAtTime(0.07, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(filter);
        filter.connect(noteGain);

        const out = masterGainRef.current || ctx.destination;
        noteGain.connect(out);

        osc.start(now);
        osc.stop(now + 0.03);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );

  // Soft, muted low tap for mistake feedback (completely non-jarring, 20ms)
  const playStroopMistake = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.025);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);

      noteGain.gain.setValueAtTime(0.06, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(filter);
      filter.connect(noteGain);

      const out = masterGainRef.current || ctx.destination;
      noteGain.connect(out);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Handled
    }
  }, [getAudioContext, isMuted]);


  // Pleasant calming harmonic note for finding the subtle difference in Notice
  const playNoticeFound = useCallback(
    (noteIdx = 0) => {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      try {
        const now = ctx.currentTime;
        const scale = [349.23, 440.0, 523.25, 587.33, 698.46, 783.99];
        const freq = scale[noteIdx % scale.length];

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(0.13, now + 0.03);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(filter);
        filter.connect(oscGain);

        if (masterGainRef.current) {
          oscGain.connect(masterGainRef.current);
        } else {
          oscGain.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + 1.5);
      } catch {
        // Handled
      }
    },
    [getAudioContext, isMuted]
  );

  // Pause when backgrounded, resume when foregrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPlayingRef.current) {
          stopAmbient();
          isPlayingRef.current = true;
        }
      } else {
        if (isPlayingRef.current && !isMuted) {
          startAmbient(ambientSound);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ambientSound, isMuted, startAmbient, stopAmbient]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      stopAmbient();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAmbient]);

  return {
    isMuted,
    ambientSound,
    selectAmbientSound,
    toggleMute,
    playChime,
    playWinCheer,
    playStroopCorrect,
    playStroopMistake,
    playSliceSound,
    playPaddleHit,
    playTableBounce,
    playFloorBounce,
    playNoticeFound,
    startAmbient,
    stopAmbient
  };
}
