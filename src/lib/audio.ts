'use client';

export interface MicMonitor {
  level(): number;
  analyser: AnalyserNode;
  getFrequencyData(): Uint8Array;
  cleanup(): void;
}

export async function startMicMonitor(): Promise<MicMonitor> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const context = new AudioCtx();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.6;
  source.connect(analyser);

  const timeData = new Uint8Array(analyser.fftSize);

  const level = () => {
    analyser.getByteTimeDomainData(timeData);
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / timeData.length);
  };

  const getFrequencyData = () => {
    const freq = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freq);
    return freq;
  };

  const cleanup = () => {
    try {
      source.disconnect();
      analyser.disconnect();
    } catch {}
    stream.getTracks().forEach(t => t.stop());
    context.close().catch(() => {});
  };

  return { level, analyser, getFrequencyData, cleanup };
}

export function isEnergyAbove(monitor: MicMonitor | null, threshold: number): boolean {
  if (!monitor) return false;
  return monitor.level() > threshold;
}