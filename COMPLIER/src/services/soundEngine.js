// Web Audio API Synthesizer for WWE Sound Effects (zero external asset dependencies)

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundEngine = {
  enabled: true,
  voiceEnabled: true,

  toggleSound(enabled) {
    this.enabled = enabled;
  },

  toggleVoice(enabled) {
    this.voiceEnabled = enabled;
  },

  // Iconic Triple Ring Bell ("DING DING DING!")
  playRingBell() {
    if (!this.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const strikeTimes = [0, 0.22, 0.44];
      strikeTimes.forEach((timeOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, ctx.currentTime + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + timeOffset + 0.35);

        gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + timeOffset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.6);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  // Bodyslam / Finisher Impact Boom
  playImpactBoom() {
    if (!this.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  },

  // Error Buzzer / Referee Tap Out
  playErrorBuzzer() {
    if (!this.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.setValueAtTime(110, now + 0.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  },

  // Crowd Roar / Cheering synthesis
  playCrowdCheer() {
    if (!this.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * 1.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 750;
      filter.Q.value = 1.8;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 1.2);
    } catch (e) {}
  },

  // Commentary announcer speech
  announce(text, excitement = 'high') {
    if (!this.voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = excitement === 'high' ? 1.15 : 1.0;
    utterance.pitch = excitement === 'high' ? 1.2 : 0.95;
    utterance.volume = 0.9;

    // Pick a solid English voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google'))) || voices[0];
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }
};

export const WWE_QUOTES = {
  success: [
    "BAH GAWD! The code hit a devastating Stone Cold Stunner! Clean execution in the arena!",
    "CAN YOU SMELL WHAT THE CODE IS COOKING?! Pinned for the 1, 2, 3 victory!",
    "AND STILL THE UNDISPUTED HEAVYWEIGHT CODE CHAMPION OF THE WORLD!",
    "Tombstone Piledriver! The code executed with pure wrestling excellence!",
    "SWEET CHIN MUSIC! Right on target, zero compile errors!"
  ],
  error: [
    "BAH GAWD! THAT CODE HAS BEEN BROKEN IN HALF! Check the referee review!",
    "TAP OUT! TAP OUT! Syntax error caught in the Sharpshooter!",
    "DISQUALIFIED! The referee caught an illegal syntax operation in the ring!",
    "HE WAS HIT WITH A STEEL CHAIR! Runtime exception detected!"
  ]
};
