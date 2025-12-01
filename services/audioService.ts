class AudioService {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private initialized: boolean = false;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialization
  }

  private init() {
    if (this.initialized && this.ctx) return;
    
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.error("Audio API not supported");
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error(e));
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopEngine();
    } else if (this.engineOsc) {
      // If engine was supposed to be running, we might need logic to restart it, 
      // but simpler to just mute outputs. 
      // For now, simple logic: Muted stops SFX.
    }
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // High-tech blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.start();
    osc.stop(t + 0.1);
  }

  public playStart() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.5);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);
    
    osc.start();
    osc.stop(t + 0.5);
  }

  public playMove() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Sci-fi swish
    osc.type = 'sawtooth'; 
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    
    // Filter to make it "whoosh"
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.linearRampToValueAtTime(2000, t + 0.1);
    
    osc.disconnect();
    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    
    osc.start();
    osc.stop(t + 0.2);
  }

  public playCrash() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.8);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
  }

  public startEngine() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx || this.engineOsc) return;
    
    // Engine drone
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineFilter = this.ctx.createBiquadFilter();
    
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 80;
    
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 300;
    
    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    
    // Fade in
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.engineGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.0);
    
    this.engineOsc.start();
  }

  public updateEngine(speed: number) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter || this.isMuted) return;
    
    // Map speed (approx 5-15) to frequency
    const targetFreq = 70 + (speed * 8);
    // Filter opens up as speed increases
    const targetFilter = 200 + (speed * 40);
    
    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.1);
  }

  public stopEngine() {
    if (this.ctx && this.engineGain) {
      const t = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(0, t, 0.1);
      
      const osc = this.engineOsc;
      const gain = this.engineGain;
      const filter = this.engineFilter;

      this.engineOsc = null;
      this.engineGain = null;
      this.engineFilter = null;

      setTimeout(() => {
        if (osc) osc.stop();
        if (osc) osc.disconnect();
        if (filter) filter.disconnect();
        if (gain) gain.disconnect();
      }, 200);
    }
  }
}

export const audioManager = new AudioService();