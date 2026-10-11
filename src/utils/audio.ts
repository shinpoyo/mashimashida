/**
 * マシマシ打 サウンドエンジン（Web Audio API による合成。音声ファイル不要）
 *
 * 信号の流れ:
 *   各音 ─┬─> dry ──────────────┐
 *         └─> reverb(店内の響き) ─┴─> master ─> compressor ─> 出力
 *
 * 音はすべて「ノイズ」と「オシレーター」を重ねて作る。
 * 打鍵音のように連打される音は短く・小さく、イベント音は厚く・響きを多めにする。
 */

type Wave = OscillatorType;

interface ToneOpts {
  type?: Wave;
  vol?: number;
  attack?: number;
  /** 終了時の周波数（グライド） */
  glideTo?: number;
  detune?: number;
  /** ローパスのカットオフ（金管っぽさなど） */
  lowpass?: number;
  lowpassTo?: number;
  /** 残響に送る量 0〜1 */
  wet?: number;
}

interface NoiseOpts {
  vol?: number;
  attack?: number;
  filter?: BiquadFilterType;
  freq?: number;
  freqTo?: number;
  q?: number;
  wet?: number;
  /** 音量を細かく揺らす（啜り音のブツブツ感） */
  tremolo?: number;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private isMuted = false;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('jiro_sound_muted') === 'true';
    } catch {
      // ストレージが使えない環境（プライベートモード等）では既定値
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('jiro_sound_muted', this.isMuted.toString());
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  // ---------------------------------------------------------------------------
  // 初期化と部品
  // ---------------------------------------------------------------------------

  /** 再生可能なら現在時刻を返す（ミュート時・非対応時は null） */
  private ready(): number | null {
    if (this.isMuted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      this.ctx = ctx;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      comp.connect(ctx.destination);

      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(comp);

      // 店内の響き：減衰するノイズでインパルス応答を作る（約1.3秒）
      const len = Math.floor(ctx.sampleRate * 1.3);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = ir;
      const rvGain = ctx.createGain();
      rvGain.gain.value = 0.55;
      this.reverb.connect(rvGain);
      rvGain.connect(this.master);

      // 使い回すホワイトノイズ（2秒）
      const nlen = ctx.sampleRate * 2;
      this.noiseBuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
      const nd = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx.currentTime;
  }

  /** 出力先（dry と reverb への送り）を作る */
  private out(node: AudioNode, wet = 0) {
    node.connect(this.master!);
    if (wet > 0 && this.reverb) {
      const send = this.ctx!.createGain();
      send.gain.value = wet;
      node.connect(send);
      send.connect(this.reverb);
    }
  }

  private tone(freq: number, start: number, dur: number, o: ToneOpts = {}) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, start + dur);
    if (o.detune) osc.detune.value = o.detune;

    const g = ctx.createGain();
    const vol = o.vol ?? 0.2;
    const atk = o.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    let last: AudioNode = osc;
    if (o.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.lowpass, start);
      if (o.lowpassTo) f.frequency.exponentialRampToValueAtTime(o.lowpassTo, start + dur);
      f.Q.value = 2;
      last.connect(f);
      last = f;
    }
    last.connect(g);
    this.out(g, o.wet);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noise(start: number, dur: number, o: NoiseOpts = {}) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    // 毎回違う位置から再生して単調さを避ける
    const offset = Math.random() * 1.5;

    const f = ctx.createBiquadFilter();
    f.type = o.filter ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq ?? 1000, start);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, start + dur);
    f.Q.value = o.q ?? 1;

    const g = ctx.createGain();
    const vol = o.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + (o.attack ?? 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(f);
    f.connect(g);

    if (o.tremolo) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      const trem = ctx.createGain();
      lfo.frequency.value = o.tremolo;
      depth.gain.value = 0.5;
      trem.gain.value = 0.5;
      lfo.connect(depth);
      depth.connect(trem.gain);
      g.connect(trem);
      this.out(trem, o.wet);
      lfo.start(start);
      lfo.stop(start + dur + 0.02);
    } else {
      this.out(g, o.wet);
    }
    src.start(start, offset, dur + 0.05);
  }

  /** 太鼓・丼を置く「ドン」 */
  private thump(start: number, vol = 0.8, from = 140, to = 48, dur = 0.32) {
    this.tone(from, start, dur, { vol, glideTo: to, attack: 0.002 });
    this.noise(start, 0.06, { vol: vol * 0.35, filter: 'lowpass', freq: 600 });
  }

  /** 金属的なベル（FM 合成） */
  private bell(freq: number, start: number, dur = 1.2, vol = 0.18, wet = 0.5) {
    const ctx = this.ctx!;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    car.frequency.value = freq;
    mod.frequency.value = freq * 3.5;
    modGain.gain.setValueAtTime(freq * 2.2, start);
    modGain.gain.exponentialRampToValueAtTime(1, start + dur);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    car.connect(g);
    this.out(g, wet);
    car.start(start);
    mod.start(start);
    car.stop(start + dur + 0.02);
    mod.stop(start + dur + 0.02);
  }

  /** 金管風の和音（ノコギリ波＋フィルタの開閉） */
  private brass(freqs: number[], start: number, dur: number, vol = 0.09, wet = 0.35) {
    freqs.forEach((f) => {
      this.tone(f, start, dur, { type: 'sawtooth', vol, attack: 0.03, lowpass: 900, lowpassTo: 2600, wet });
      this.tone(f, start, dur, { type: 'sawtooth', vol: vol * 0.6, attack: 0.03, detune: 9, lowpass: 900, lowpassTo: 2600, wet });
    });
  }

  // ---------------------------------------------------------------------------
  // 効果音
  // ---------------------------------------------------------------------------

  /** 打鍵：メカニカルキーボードの「カチッ＋コトッ」。連打で疲れないよう短く */
  public keyStroke() {
    const t = this.ready();
    if (t === null) return;
    const v = 0.85 + Math.random() * 0.3;
    this.noise(t, 0.018, { vol: 0.6 * v, filter: 'highpass', freq: 3200 + Math.random() * 800 });
    this.noise(t, 0.035, { vol: 0.45 * v, filter: 'bandpass', freq: 1400 + Math.random() * 300, q: 3 });
    this.tone(210 + Math.random() * 40, t, 0.045, { vol: 0.35 * v, glideTo: 90 });
  }

  /** ミスタイプ：濁った「ブッ」 */
  public mistake() {
    const t = this.ready();
    if (t === null) return;
    this.tone(118, t, 0.16, { type: 'square', vol: 0.45, lowpass: 1100 });
    this.tone(124, t, 0.16, { type: 'square', vol: 0.45, lowpass: 1100 });
    this.noise(t, 0.05, { vol: 0.6, filter: 'lowpass', freq: 500 });
  }

  /** 食券ボタン：券売機の「ピッ」 */
  public ticketSelect() {
    const t = this.ready();
    if (t === null) return;
    this.tone(1960, t, 0.07, { type: 'square', vol: 0.22, lowpass: 3500 });
    this.noise(t, 0.02, { vol: 0.25, filter: 'highpass', freq: 2500 });
  }

  /** UI の軽いクリック */
  public uiClick() {
    const t = this.ready();
    if (t === null) return;
    this.noise(t, 0.02, { vol: 0.8, filter: 'bandpass', freq: 2200, q: 2 });
    this.tone(880, t, 0.04, { type: 'triangle', vol: 0.3 });
  }

  /** 食券発券：「ジーッ」と印字して「ガシャン」と落ちる */
  public ticketIssue() {
    const t = this.ready();
    if (t === null) return;
    this.noise(t, 0.28, { vol: 0.09, filter: 'bandpass', freq: 3200, q: 4, tremolo: 60 });
    this.tone(150, t, 0.28, { type: 'square', vol: 0.03, lowpass: 600 });
    const d = t + 0.3;
    this.noise(d, 0.18, { vol: 0.35, filter: 'lowpass', freq: 3000, freqTo: 600, wet: 0.2 });
    this.tone(330, d, 0.25, { type: 'triangle', vol: 0.1, wet: 0.3 });
    this.tone(495, d + 0.01, 0.22, { type: 'triangle', vol: 0.07, wet: 0.3 });
    this.thump(d, 0.35, 160, 70, 0.2);
  }

  /** カウントダウン 3・2・1 */
  public countdown() {
    const t = this.ready();
    if (t === null) return;
    this.bell(784, t, 0.5, 0.25, 0.3);
    this.thump(t, 0.6, 120, 60, 0.18);
  }

  /** 開始の合図：太鼓＋鐘「カーン」 */
  public go() {
    const t = this.ready();
    if (t === null) return;
    this.thump(t, 0.9);
    this.bell(1175, t, 1.4, 0.2, 0.6);
    this.bell(1568, t + 0.01, 1.2, 0.1, 0.6);
  }

  /** 1杯提供：丼を置く「ドン」＋麺を啜る「ズズッ」＋チャイム */
  public serve(fast = false) {
    const t = this.ready();
    if (t === null) return;
    // 丼をカウンターに置く
    this.thump(t, 0.8, 190, 75, 0.2);
    this.noise(t, 0.05, { vol: 0.4, filter: 'bandpass', freq: 1800, q: 3 });
    // 啜り音（帯域を上げながらブツブツ揺らす）
    this.noise(t + 0.08, 0.32, { vol: 0.6, filter: 'bandpass', freq: 700, freqTo: 3000, q: 2.5, attack: 0.03, tremolo: 28 });
    this.noise(t + 0.4, 0.12, { vol: 0.3, filter: 'bandpass', freq: 2400, freqTo: 1200, q: 3 });
    // 正解チャイム
    this.tone(1318.5, t + 0.05, 0.35, { type: 'triangle', vol: 0.22, wet: 0.4 });
    this.tone(1975.5, t + 0.13, 0.5, { type: 'triangle', vol: 0.18, wet: 0.5 });
    if (fast) {
      // 早打ちボーナス：きらめくアルペジオ
      [2637, 3136, 3951, 5274].forEach((f, i) => this.tone(f, t + 0.2 + i * 0.045, 0.3, { vol: 0.05, wet: 0.6 }));
    }
  }

  /** ロット乱し：不協和の「ジャーン↓」＋低い太鼓 */
  public lotBreak() {
    const t = this.ready();
    if (t === null) return;
    [220, 233, 311].forEach((f) => this.tone(f, t, 0.7, { type: 'sawtooth', vol: 0.12, glideTo: f * 0.7, lowpass: 2400, lowpassTo: 300, wet: 0.4 }));
    this.thump(t, 1, 110, 40, 0.5);
    this.noise(t, 0.4, { vol: 0.2, filter: 'lowpass', freq: 1800, freqTo: 200, wet: 0.3 });
  }

  /** 残り時間わずか：拍子木のような「カッ」 */
  public tick() {
    const t = this.ready();
    if (t === null) return;
    this.tone(1650, t, 0.05, { type: 'sine', vol: 0.35 });
    this.noise(t, 0.03, { vol: 0.3, filter: 'bandpass', freq: 2600, q: 6 });
  }

  /** 完飲完食：太鼓2発＋金管ファンファーレ＋鐘 */
  public victory() {
    const t = this.ready();
    if (t === null) return;
    this.thump(t, 0.9);
    this.thump(t + 0.16, 0.9);
    const C = [523.25, 659.25, 783.99];
    this.brass([392], t + 0.3, 0.16);
    this.brass([523.25], t + 0.48, 0.16);
    this.brass([659.25], t + 0.66, 0.16);
    this.brass([C[0], C[1], C[2], 1046.5], t + 0.84, 1.3, 0.07);
    this.thump(t + 0.84, 1, 130, 45, 0.6);
    this.bell(2093, t + 0.84, 1.8, 0.1, 0.7);
    [3136, 3951, 4699, 5274].forEach((f, i) => this.tone(f, t + 1.0 + i * 0.06, 0.4, { vol: 0.04, wet: 0.7 }));
  }

  /** 強制退店・ギブアップ：「ぶっぶー」＋下がるトロンボーン＋銅鑼 */
  public expelled() {
    const t = this.ready();
    if (t === null) return;
    this.tone(196, t, 0.14, { type: 'square', vol: 0.1, lowpass: 1400 });
    this.tone(196, t + 0.2, 0.4, { type: 'square', vol: 0.1, lowpass: 1400 });
    this.brass([311], t + 0.7, 0.25, 0.08);
    this.brass([293.7], t + 0.97, 0.25, 0.08);
    this.brass([277.2], t + 1.24, 0.25, 0.08);
    [261.6].forEach((f) => this.tone(f, t + 1.5, 1.1, { type: 'sawtooth', vol: 0.09, glideTo: 180, lowpass: 1600, lowpassTo: 300, wet: 0.5 }));
    // 銅鑼
    this.tone(68, t + 1.5, 2.2, { vol: 0.35, glideTo: 60, wet: 0.6 });
    this.noise(t + 1.5, 1.6, { vol: 0.1, filter: 'bandpass', freq: 500, freqTo: 180, q: 1, wet: 0.7 });
  }

  /** 一時休戦 */
  public pause() {
    const t = this.ready();
    if (t === null) return;
    this.tone(660, t, 0.12, { type: 'triangle', vol: 0.2 });
    this.tone(440, t + 0.1, 0.18, { type: 'triangle', vol: 0.2 });
  }

  // ---------------------------------------------------------------------------
  // 旧 API 名（コール道場などの既存コンポーネント向け）
  // ---------------------------------------------------------------------------
  public playKeyStroke() {
    this.keyStroke();
  }
  public playMistake() {
    this.mistake();
  }
  public playCriticalHit() {
    this.go();
  }
  public playSlurp() {
    this.serve();
  }
  public playVictory() {
    this.victory();
  }
  public playWarning() {
    this.tick();
  }
}

export const soundManager = new SoundManager();
