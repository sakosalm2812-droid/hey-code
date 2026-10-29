import { EventEmitter } from 'node:events';

export class VoiceFrameCapture extends EventEmitter {
  constructor(options = {}) {
    super();
    this.targetSampleRate = options.sampleRate || 16000;
    this.frameDurationMs = options.frameDurationMs || 100;
    // 100ms at 16kHz = 1600 samples
    this.frameSize = options.frameSize || Math.floor((this.targetSampleRate * this.frameDurationMs) / 1000);
    this.silenceThreshold = options.silenceThreshold ?? 0.01;
    this.audioContextFactory = options.audioContextFactory || null;
    this.mediaDevices = options.mediaDevices || (typeof navigator !== 'undefined' ? navigator.mediaDevices : null);

    this.audioContext = null;
    this.stream = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.running = false;
    this.consecutiveSilenceFrames = 0;
    this.sampleBuffer = new Float32Array(0);
  }

  computeRms(samples) {
    if (!samples || samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  resample(inputSamples, inputRate, outputRate) {
    if (inputRate === outputRate) return inputSamples;
    const ratio = inputRate / outputRate;
    const outputLength = Math.floor(inputSamples.length / ratio);
    const output = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const indexFloor = Math.floor(sourceIndex);
      const indexCeil = Math.min(inputSamples.length - 1, indexFloor + 1);
      const frac = sourceIndex - indexFloor;
      output[i] = (1 - frac) * inputSamples[indexFloor] + frac * inputSamples[indexCeil];
    }
    return output;
  }

  async start() {
    if (this.running) {
      const err = new Error('Capture is already running');
      err.name = 'AlreadyRunning';
      throw err;
    }

    if (!this.mediaDevices && !this.audioContextFactory) {
      this.emit('voice:no-device', { error: 'No audio device available' });
      return;
    }

    try {
      if (this.mediaDevices) {
        try {
          this.stream = await this.mediaDevices.getUserMedia({ audio: true });
        } catch (mediaErr) {
          if (
            mediaErr.name === 'NotAllowedError' ||
            mediaErr.name === 'PermissionDeniedError' ||
            mediaErr.message?.includes('denied')
          ) {
            this.emit('voice:permission-denied', { error: mediaErr });
            return;
          }
          if (
            mediaErr.name === 'NotFoundError' ||
            mediaErr.name === 'DevicesNotFoundError' ||
            mediaErr.message?.includes('no device')
          ) {
            this.emit('voice:no-device', { error: mediaErr });
            return;
          }
          throw mediaErr;
        }
      }

      const AudioCtx =
        this.audioContextFactory ||
        (typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null);

      if (!AudioCtx) {
        this.emit('voice:no-device', { error: 'Web Audio API not supported' });
        return;
      }

      this.audioContext = new AudioCtx({ sampleRate: this.targetSampleRate });
      this.running = true;
      this.consecutiveSilenceFrames = 0;
      this.sampleBuffer = new Float32Array(0);

      if (this.stream) {
        this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
        // ScriptProcessorNode or AudioWorklet fallback
        const bufferSize = 2048;
        this.processorNode = this.audioContext.createScriptProcessor
          ? this.audioContext.createScriptProcessor(bufferSize, 1, 1)
          : null;

        if (this.processorNode) {
          this.processorNode.onaudioprocess = (e) => {
            if (!this.running) return;
            const inputData = e.inputBuffer.getChannelData(0);
            this.processAudioChunk(inputData, this.audioContext.sampleRate);
          };
          this.sourceNode.connect(this.processorNode);
          this.processorNode.connect(this.audioContext.destination);
        }
      }
    } catch (err) {
      this.running = false;
      throw err;
    }
  }

  processAudioChunk(chunk, sourceRate = 16000) {
    if (!this.running) return;
    const resampled = this.resample(chunk, sourceRate, this.targetSampleRate);

    // Append to sample buffer
    const merged = new Float32Array(this.sampleBuffer.length + resampled.length);
    merged.set(this.sampleBuffer, 0);
    merged.set(resampled, this.sampleBuffer.length);
    this.sampleBuffer = merged;

    // Slice frames of exactly frameSize
    while (this.sampleBuffer.length >= this.frameSize) {
      const frame = this.sampleBuffer.slice(0, this.frameSize);
      this.sampleBuffer = this.sampleBuffer.slice(this.frameSize);

      const rms = this.computeRms(frame);
      const timestamp = Date.now();

      this.emit('voice:frame', {
        samples: frame,
        rms,
        timestamp,
      });

      if (rms < this.silenceThreshold) {
        this.consecutiveSilenceFrames++;
        if (this.consecutiveSilenceFrames >= 2) {
          this.emit('voice:silence', {
            rms,
            timestamp,
            consecutiveFrames: this.consecutiveSilenceFrames,
          });
        }
      } else {
        this.consecutiveSilenceFrames = 0;
      }
    }
  }

  async stop() {
    this.running = false;
    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.stream) {
      try {
        const tracks = this.stream.getTracks ? this.stream.getTracks() : [];
        for (const track of tracks) {
          if (track.stop) track.stop();
        }
      } catch {}
      this.stream = null;
    }

    if (this.audioContext) {
      try {
        if (this.audioContext.close) {
          await this.audioContext.close();
        }
      } catch {}
      this.audioContext = null;
    }

    this.sampleBuffer = new Float32Array(0);
    this.consecutiveSilenceFrames = 0;
  }
}

export default VoiceFrameCapture;
