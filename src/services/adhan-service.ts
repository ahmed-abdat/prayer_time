type AdhanSettings = {
  volume: number;
  muezzin: string;
};

let audio: HTMLAudioElement | null = null;
let isPlaying = false;

// List of available Adhans
export const AVAILABLE_ADHANS = {
  makkah: "Makkah Adhan",
  madinah: "Madinah Adhan",
  alaqsa: "Al-Aqsa Adhan",
  default: "Default Adhan"
} as const;

export const adhanService = {
  init(settings: AdhanSettings) {
    if (!audio) {
      audio = new Audio(`/adhan/${settings.muezzin}.mp3`);
      audio.volume = settings.volume / 100;
    }
  },

  async play() {
    if (isPlaying || !audio) return;

    try {
      isPlaying = true;
      audio.currentTime = 0;
      await audio.play();
      
      audio.onended = () => {
        isPlaying = false;
      };
    } catch (error) {
      console.error('Failed to play Adhan:', error);
      isPlaying = false;
    }
  },

  stop() {
    if (audio && isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
    }
  },

  setVolume(volume: number) {
    if (audio) {
      audio.volume = volume / 100;
    }
  },

  setMuezzin(muezzin: string) {
    this.stop();
    audio = new Audio(`/adhan/${muezzin}.mp3`);
  }
}; 