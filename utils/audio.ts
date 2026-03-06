// Audio handling for Gemini 2.5 Flash Native Audio Dialog

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (base64: string) => void, private onDebugLog?: (msg: string) => void) { }

  async start() {
    // 1. Initialize AudioContext synchronously to satisfy mobile browser policies
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error("Mic access denied:", e);
      throw e;
    }

    // iOS Safari requires resume after async operations
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Create AudioWorklet inline via Blob to avoid Vite static asset issues
    const workletCode = `
      class AudioRecorderWorklet extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            // Post a copy of the channel data to prevent DataCloneError on mobile Safari
            this.port.postMessage(new Float32Array(channelData));
          }
          return true; // Keep processor alive
        }
      }
      registerProcessor('audio-recorder-worklet', AudioRecorderWorklet);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } catch (e) {
      console.error("AudioWorklet addModule failed", e);
      throw e;
    }

    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-recorder-worklet');

    this.workletNode.port.onmessage = (e) => {
      const inputData = e.data as Float32Array;

      // Convert Float32 to Int16 PCM
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        let s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const buffer = new ArrayBuffer(pcm16.buffer.byteLength);
      new Int16Array(buffer).set(pcm16);

      // Convert to base64
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      this.onAudioData(base64);

      // Log occasionally to ensure it's still running
      if (Math.random() < 0.05 && this.onDebugLog) {
        this.onDebugLog(`Audio chunk sent (len: ${base64.length})`);
      }
    };

    this.source.connect(this.workletNode);
    // Connect worklet to destination so it doesn't get garbage collected
    this.workletNode.connect(this.audioContext.destination);
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  getContextState(): string {
    return this.audioContext ? this.audioContext.state : 'uninitialized';
  }
}

export class AudioPlayer {
  private audioContext: AudioContext;
  private nextTime: number = 0;

  constructor() {
    // Gemini Live API returns 24000Hz PCM
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 24000 });
  }

  async playPCM16(base64: string) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const audioBuffer = this.audioContext.createBuffer(1, pcm16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 32768.0;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    // Ensure seamless playback
    if (this.nextTime < this.audioContext.currentTime) {
      this.nextTime = this.audioContext.currentTime;
    }
    source.start(this.nextTime);
    this.nextTime += audioBuffer.duration;
  }

  stop() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
