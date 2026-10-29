import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceFrameCapture } from '../src/voice/voiceFrameCapture.js';

function createMockAudioContext() {
  return class MockAudioContext {
    constructor(options = {}) {
      this.sampleRate = options.sampleRate || 16000;
      this.state = 'running';
      this.destination = {};
    }
    createMediaStreamSource() {
      return {
        connect() {},
        disconnect() {},
      };
    }
    createScriptProcessor() {
      return {
        connect() {},
        disconnect() {},
        onaudioprocess: null,
      };
    }
    async close() {
      this.state = 'closed';
    }
  };
}

function createMockStream() {
  let active = true;
  return {
    getTracks() {
      return [
        {
          stop() {
            active = false;
          },
          get readyState() {
            return active ? 'live' : 'ended';
          },
        },
      ];
    },
    get active() {
      return active;
    },
  };
}

test('PRIM-001 Acceptance Test 1: 1 second of capture produces exactly 10 frames', async () => {
  const stream = createMockStream();
  const capture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
  });

  await capture.start();

  const frames = [];
  capture.on('voice:frame', (f) => frames.push(f));

  // 1 second at 16kHz = 16000 samples
  // Feed in chunks of 1600 samples 10 times
  for (let i = 0; i < 10; i++) {
    const chunk = new Float32Array(1600);
    chunk.fill(0.1); // non-silent
    capture.processAudioChunk(chunk, 16000);
  }

  assert.equal(frames.length, 10, 'must emit exactly 10 frames for 1 second');
  assert.equal(frames[0].samples.length, 1600, 'each frame must have 1600 samples');
  assert.ok(frames[0].rms > 0, 'rms must be computed');
  await capture.stop();
});

test('PRIM-001 Acceptance Test 2: Silence produces voice:silence after 200ms (2 frames)', async () => {
  const stream = createMockStream();
  const capture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
    silenceThreshold: 0.01,
  });

  await capture.start();

  const silences = [];
  capture.on('voice:silence', (s) => silences.push(s));

  // Frame 1: silent (100ms)
  const silentChunk = new Float32Array(1600);
  silentChunk.fill(0.0001);
  capture.processAudioChunk(silentChunk, 16000);
  assert.equal(silences.length, 0, 'no voice:silence after 1 frame (100ms)');

  // Frame 2: silent (200ms) -> should emit
  capture.processAudioChunk(silentChunk, 16000);
  assert.equal(silences.length, 1, 'voice:silence must emit after 2 consecutive frames (200ms)');

  await capture.stop();
});

test('PRIM-001 Acceptance Test 3: stop() releases microphone (no active stream)', async () => {
  const stream = createMockStream();
  const capture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
  });

  await capture.start();
  assert.equal(stream.active, true);

  await capture.stop();
  assert.equal(stream.active, false, 'audio track must be stopped');
  assert.equal(capture.running, false);
});

test('PRIM-001 Acceptance Test 4: start() twice throws AlreadyRunning', async () => {
  const stream = createMockStream();
  const capture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
  });

  await capture.start();
  await assert.rejects(
    async () => {
      await capture.start();
    },
    (err) => err.name === 'AlreadyRunning'
  );

  await capture.stop();
});

test('PRIM-001 Acceptance Test 5: No memory leak after 60 seconds of capture', async () => {
  const stream = createMockStream();
  const capture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
  });

  await capture.start();
  let frameCount = 0;
  capture.on('voice:frame', () => frameCount++);

  // 60 seconds = 600 frames = 600 * 1600 samples
  const chunk = new Float32Array(1600);
  for (let i = 0; i < 600; i++) {
    capture.processAudioChunk(chunk, 16000);
  }

  assert.equal(frameCount, 600);
  assert.equal(capture.sampleBuffer.length, 0, 'sample buffer must not accumulate or leak');
  await capture.stop();
});

test('PRIM-001 Edge Cases: Permission denied, No device, and Resampling', async () => {
  // Edge case 1: Permission denied
  let permissionDeniedEmitted = false;
  const deniedCapture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        const err = new Error('Permission denied');
        err.name = 'NotAllowedError';
        throw err;
      },
    },
  });
  deniedCapture.on('voice:permission-denied', () => {
    permissionDeniedEmitted = true;
  });
  await deniedCapture.start();
  assert.equal(permissionDeniedEmitted, true, 'must emit voice:permission-denied');

  // Edge case 2: No device
  let noDeviceEmitted = false;
  const noDeviceCapture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        const err = new Error('Device not found');
        err.name = 'NotFoundError';
        throw err;
      },
    },
  });
  noDeviceCapture.on('voice:no-device', () => {
    noDeviceEmitted = true;
  });
  await noDeviceCapture.start();
  assert.equal(noDeviceEmitted, true, 'must emit voice:no-device');

  // Edge case 3: Resample from 48kHz to 16kHz
  const stream = createMockStream();
  const resampleCapture = new VoiceFrameCapture({
    audioContextFactory: createMockAudioContext(),
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
  });
  await resampleCapture.start();
  const resampledFrames = [];
  resampleCapture.on('voice:frame', (f) => resampledFrames.push(f));

  // 4800 samples at 48kHz = 100ms
  const chunk48k = new Float32Array(4800);
  chunk48k.fill(0.5);
  resampleCapture.processAudioChunk(chunk48k, 48000);

  assert.equal(resampledFrames.length, 1, 'should produce 1 frame from 100ms input');
  assert.equal(resampledFrames[0].samples.length, 1600, 'resampled frame must be 1600 samples (16kHz)');
  await resampleCapture.stop();
});
