export type SoundKind = 'select' | 'swap' | 'match' | 'win' | 'invalid';
type SafariWindow = Window & { webkitAudioContext?: typeof AudioContext };
let audioContext: AudioContext | null = null;
const melodies: Record<SoundKind, ReadonlyArray<readonly [number, number, number]>> = {
  select: [[620, 0, 0.06]], swap: [[480, 0, 0.07], [720, 0.04, 0.08]],
  match: [[660, 0, 0.11], [880, 0.06, 0.11], [1100, 0.12, 0.15]],
  win: [[523.25, 0, 0.15], [659.25, 0.12, 0.15], [783.99, 0.24, 0.15], [1046.5, 0.38, 0.32]],
  invalid: [[220, 0, 0.09], [174.61, 0.07, 0.14]],
};
export function playSound(kind: SoundKind, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioConstructor = window.AudioContext ?? (window as SafariWindow).webkitAudioContext;
    if (!AudioConstructor) return;
    if (!audioContext || audioContext.state === 'closed') audioContext = new AudioConstructor();
    const context = audioContext;
    const notes = melodies[kind];
    const schedule = () => {
      const now = context.currentTime;
      for (const [frequency, offset, duration] of notes) {
        const oscillator = context.createOscillator(), volume = context.createGain();
        oscillator.type = kind === 'invalid' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        volume.gain.setValueAtTime(0, now + offset);
        volume.gain.linearRampToValueAtTime(0.065, now + offset + 0.008);
        volume.gain.exponentialRampToValueAtTime(0.001, now + offset + duration);
        oscillator.connect(volume); volume.connect(context.destination);
        oscillator.start(now + offset); oscillator.stop(now + offset + duration + 0.02);
        oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
      }
    };
    if (context.state === 'suspended') void context.resume().then(schedule).catch(() => undefined);
    else schedule();
  } catch { /* Sound is decorative and must never interrupt play. */ }
}
