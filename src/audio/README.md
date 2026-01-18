# Audio System Documentation

## Overview

The Meditation Bell audio system is built using the Web Audio API to provide high-precision, synthesized meditation bell sounds with sub-10ms timing accuracy. The system is modular, extensible, and handles browser autoplay restrictions gracefully.

## Architecture

### Core Components

1. **AudioContextManager** - Singleton managing the Web Audio API context
2. **BellSynthesizer** - Synthesizes realistic meditation bell sounds
3. **AudioPlayer** - Playback controls and progress tracking
4. **AudioScheduler** - Precise scheduling with sub-millisecond accuracy
5. **VolumeController** - Volume management with smooth transitions
6. **AudioPreloader** - Pre-generates and caches bell sounds
7. **AudioSystem** - Unified interface integrating all components

### Component Relationships

```
AudioSystem (Facade)
├── AudioContextManager (Singleton)
│   └── AudioContext + MasterGain
├── AudioPreloader
│   └── BellSynthesizer → AudioBuffers
├── AudioPlayer
│   └── BellSynthesizer → Real-time playback
├── AudioScheduler
│   └── BellSynthesizer → Scheduled playback
└── VolumeController
    └── AudioContextManager → Volume management
```

## Bell Sound Synthesis

### Big Bell (~47 seconds)
- **Frequency**: 220 Hz (A3)
- **Character**: Deep, resonant, gong-like
- **Harmonics**: [1, 2.76, 4.83, 6.59] - Complex bell-like ratios
- **Use Case**: Main meditation bells, hourly chimes

### Small Bell (~32 seconds)
- **Frequency**: 880 Hz (A5)
- **Character**: Light, bright, crystal bowl quality
- **Harmonics**: [1, 2.76, 4.83, 6.59] - Same ratios, different timbre
- **Use Case**: Periodic reminders, interval markers

### Synthesis Features
- **ADSR Envelope**: Attack, Decay, Sustain, Release for natural sound
- **Multiple Harmonics**: Complex overtone structure
- **Reverb**: Delay-network based reverb for spatial depth
- **Frequency Vibrato**: Subtle LFO for organic quality
- **Low-pass Filtering**: Warmth and natural tone shaping

## Usage Examples

### Basic Initialization

```javascript
import { audioSystem } from './audio/AudioSystem.js';

// Initialize with preloading (recommended)
await audioSystem.initialize({ preload: true });

// Enable audio after user interaction (required by browsers)
button.addEventListener('click', async () => {
  await audioSystem.enableAudio();
});
```

### Playing Bells

```javascript
// Play a bell immediately
await audioSystem.playBell('big');
await audioSystem.playBell('small');

// Play with custom volume
await audioSystem.playBell('big', { volume: 0.5 });
```

### Scheduling Bells

```javascript
// Schedule a bell 5 seconds from now
const scheduleId = audioSystem.scheduleBell('big', 5000);

// Schedule multiple bells
const bigBellId = audioSystem.scheduleBell('big', 10000);
const smallBellId = audioSystem.scheduleBell('small', 15000);

// Cancel a scheduled bell
audioSystem.cancelScheduledBell(scheduleId);

// Cancel all scheduled bells
audioSystem.cancelAllScheduledBells();
```

### Volume Control

```javascript
// Set master volume
audioSystem.setMasterVolume(0.8);

// Set volume for specific bell type
audioSystem.setBellVolume('big', 0.9);
audioSystem.setBellVolume('small', 0.7);

// Mute/unmute with fade
audioSystem.mute(0.2); // 0.2 second fade
audioSystem.unmute(0.2);
audioSystem.toggleMute();
```

### Direct Component Access

```javascript
import { 
  audioContextManager,
  audioPreloader,
  AudioPlayer,
  AudioScheduler,
  VolumeController
} from './audio/index.js';

// Get audio context info
const info = audioContextManager.getDebugInfo();

// Check preloader status
const isReady = audioPreloader.isReady();
const progress = audioPreloader.getProgress();

// Create custom player
const player = new AudioPlayer(audioContextManager.getContext());
await player.play('big', 1.0);
```

## Event Bus Integration

The audio system emits events via the global EventBus:

### Audio Events

```javascript
import { eventBus } from './core/EventBus.js';
import { EVENTS } from './config/constants.js';

// Audio system ready
eventBus.on(EVENTS.AUDIO_LOADED, (data) => {
  console.log('Audio system loaded:', data);
});

// Audio context state changes
eventBus.on(EVENTS.AUDIO_CONTEXT_READY, (data) => {
  console.log('Audio context ready:', data);
});

// Playback events
eventBus.on(EVENTS.AUDIO_STARTED, ({ bellType, duration }) => {
  console.log(`${bellType} bell started, duration: ${duration}s`);
});

eventBus.on(EVENTS.AUDIO_PROGRESS, ({ bellType, currentTime, percentage }) => {
  console.log(`${bellType} bell: ${percentage}%`);
});

eventBus.on(EVENTS.AUDIO_ENDED, ({ bellType }) => {
  console.log(`${bellType} bell ended`);
});

// Bell ring event (from scheduler)
eventBus.on(EVENTS.BELL_RING, ({ bellType, id, metadata }) => {
  console.log('Scheduled bell rang:', bellType);
});

// Volume changes
eventBus.on(EVENTS.VOLUME_CHANGE, (data) => {
  console.log('Volume changed:', data);
});

// Errors
eventBus.on(EVENTS.AUDIO_ERROR, ({ message, error }) => {
  console.error('Audio error:', message, error);
});
```

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 35+ (including Chrome for Android)
- ✅ Firefox 25+
- ✅ Safari 14.1+ (including iOS Safari)
- ✅ Edge 79+
- ✅ Opera 22+

### Autoplay Policy Handling

Modern browsers require user interaction before playing audio. The system handles this automatically:

```javascript
// Audio context starts suspended
// User must interact (click, tap, etc.) before audio plays
startButton.addEventListener('click', async () => {
  // This call resumes the audio context
  await audioSystem.enableAudio();
  
  // Now audio can play
  await audioSystem.playBell('big');
});
```

### Fallbacks
- Automatically uses `webkitAudioContext` for older Safari
- Graceful degradation if Web Audio API is unavailable
- Error events allow UI to display appropriate messages

## Performance Considerations

### Memory Usage
- **Preloaded Bells**: ~2-4 MB (stereo, 47s + 32s at 44.1kHz)
- **Real-time Synthesis**: Minimal memory, higher CPU
- **Recommendation**: Use preloading for better performance

### CPU Usage
- **Synthesized Sound**: ~5-10% CPU during generation
- **Cached Buffers**: <1% CPU during playback
- **Multiple Simultaneous Bells**: Supported with minimal overhead

### Timing Accuracy
- Uses `AudioContext.currentTime` for scheduling
- Accuracy: Sub-millisecond (typically <10ms)
- Not affected by JavaScript event loop timing

## Advanced Configuration

### Bell Parameters (constants.js)

```javascript
export const BELL_PARAMS = {
  BIG_BELL: {
    fundamentalFreq: 220,    // Base frequency in Hz
    duration: 47,             // Duration in seconds
    harmonics: [1, 2.76, 4.83, 6.59],  // Harmonic ratios
    gains: [1.0, 0.5, 0.25, 0.15],     // Harmonic volumes
    attack: 0.01,             // ADSR attack time
    decay: 0.5,               // ADSR decay time
    sustain: 0.3,             // ADSR sustain level
    release: 47,              // ADSR release time
    reverbMix: 0.3,           // Reverb wetness
    reverbTime: 0.03          // Reverb delay time
  }
};
```

### Volume Defaults (defaults.js)

```javascript
DEFAULT_PREFERENCES.audio = {
  bellType: 'big',
  volume: 0.8,
  bigBellVolume: 0.8,
  smallBellVolume: 0.8,
  muted: false,
  fadeIn: true,
  fadeOut: true,
  fadeDuration: 200,         // milliseconds
  preloadAudio: true,
  useSynthesis: true
};
```

## Debugging

Access the audio system via browser console:

```javascript
// Get audio system status
window.awakeningBell.audioSystem.getStatus();

// Get context info
window.awakeningBell.audioSystem.player?.context;

// Test bell sounds
await window.awakeningBell.audioSystem.playBell('big');
await window.awakeningBell.audioSystem.playBell('small');

// Check scheduled sounds
window.awakeningBell.audioSystem.scheduler?.getScheduled();

// Volume controls
window.awakeningBell.audioSystem.setMasterVolume(0.5);
window.awakeningBell.audioSystem.mute();
```

## Known Limitations

1. **iOS Safari Background Audio**: Audio may stop when app is backgrounded
2. **Pause/Resume**: True pause/resume of synthesized audio is complex; currently restarts from beginning
3. **Buffer Preloading**: Requires ~2-4MB of memory for cached sounds
4. **Autoplay**: Requires user interaction before first sound

## Future Enhancements (Phase 2+)

- [ ] Support for custom bell audio files (MP3/OGG/WAV)
- [ ] Additional soundscapes and ambient sounds
- [ ] Advanced reverb using ConvolverNode
- [ ] Spatial audio (panning, positioning)
- [ ] Audio visualization
- [ ] True pause/resume using AudioBuffers
- [ ] Service Worker for offline audio
- [ ] Custom bell synthesis parameters via UI

## Testing

### Manual Testing Checklist
- [ ] Big bell plays with correct duration (~47s)
- [ ] Small bell plays with correct duration (~32s)
- [ ] Volume controls work smoothly
- [ ] Mute/unmute transitions are smooth
- [ ] Scheduled bells fire at correct times
- [ ] Multiple overlapping bells work correctly
- [ ] Audio context resumes after user interaction
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on mobile devices (iOS/Android)
- [ ] No memory leaks during extended use

### Automated Testing
See `tests/audio/` for unit tests (using mocked AudioContext).

## References

- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
- [MDN Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Autoplay Policy Changes](https://developer.chrome.com/blog/autoplay/)
- [Bell Harmonic Ratios](https://en.wikipedia.org/wiki/Harmonic_series_(music))
