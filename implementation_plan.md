# HoloGraphic — Interactive Hand-Tracking Holographic Game

An immersive, browser-based holographic game where players use hand gestures to spawn, sculpt, smash, and paint 3D holographic shapes floating in augmented reality over their webcam feed.

## User Review Required

> [!IMPORTANT]
> **Game Concept:** The game has 3 modes players can switch between using a fist gesture:
> 1. **Sculpt Mode** — Pinch to spawn holographic shapes, drag to move them, pinch+rotate to resize
> 2. **Paint Mode** — Index finger becomes a holographic paint brush leaving particle trails in 3D space
> 3. **Destroy Mode** — Punch/swipe through shapes to shatter them into particles with satisfying explosions
>
> Does this concept appeal to you, or do you want a different game direction?

> [!WARNING]
> **Webcam Required:** This app requires webcam access. It will run as a static HTML/CSS/JS app served via a local dev server (VS Code Live Server or `npx serve`).

## Open Questions

1. **Single page or multi-page?** I'm planning a single `index.html` with all game states (splash → playing → score) handled in JS. Let me know if you'd prefer a framework like Vite.
2. **Sound effects?** Should I add Web Audio API synth sounds for interactions (spawn, destroy, paint), or keep it visual-only?
3. **Mobile support?** Hand tracking works on mobile but performance may vary. Should I focus on desktop-first?

---

## Proposed Changes

### Project Structure

```
d:\HoloGraphic\
├── index.html          # Main entry point
├── css/
│   └── style.css       # Complete design system + holographic UI
├── js/
│   ├── app.js          # Main application bootstrap & game loop
│   ├── handTracking.js # MediaPipe hand tracking wrapper
│   ├── gestures.js     # Gesture recognition engine (pinch, fist, swipe, point)
│   ├── holoScene.js    # Three.js scene, camera, renderer, post-processing
│   ├── holoShapes.js   # Holographic shape creation with custom shaders
│   ├── particles.js    # GPU particle system for trails, explosions, ambient
│   ├── gameState.js    # Game state machine (splash, sculpt, paint, destroy)
│   ├── scoring.js      # Score tracking, combos, achievements
│   └── ui.js           # HUD overlay, mode indicators, score display
└── assets/
    └── (generated at build time)
```

---

### 1. Core HTML Entry Point

#### [NEW] [index.html](file:///d:/HoloGraphic/index.html)
- Loads all CDN dependencies (Three.js r128, MediaPipe Hands, Camera Utils)
- Contains layered DOM: webcam video → 2D canvas overlay → Three.js WebGL canvas → UI HUD
- Meta tags for SEO, viewport, and Open Graph
- Google Fonts: **Orbitron** (headings) + **Rajdhani** (body) for sci-fi aesthetic

---

### 2. Design System & Styling

#### [NEW] [style.css](file:///d:/HoloGraphic/css/style.css)
- **Color palette:** Deep space blacks (#0a0a0f), electric cyan (#00f0ff), neon magenta (#ff00ff), holographic green (#39ff14), warm amber (#ffaa00)
- **Glassmorphism** panels for UI elements (backdrop-filter: blur + semi-transparent borders)
- **Scanline overlay** via CSS animation for authentic holographic feel
- **Animated gradients** on mode indicators
- **Keyframe animations:** pulse-glow, flicker, slide-in, shake, score-pop
- **Typography:** Orbitron for futuristic headings, Rajdhani for readability
- **Responsive grid** for HUD elements

---

### 3. Hand Tracking Module

#### [NEW] [handTracking.js](file:///d:/HoloGraphic/js/handTracking.js)
- Wraps MediaPipe Hands initialization with configurable options
- Normalizes landmark data and handles mirroring
- Provides smooth landmark interpolation (exponential moving average)
- Fires custom events: `hand-detected`, `hand-lost`, `landmarks-updated`
- Supports 1-2 hands with handedness detection

---

### 4. Gesture Recognition Engine

#### [NEW] [gestures.js](file:///d:/HoloGraphic/js/gestures.js)
- **Pinch detection:** Thumb tip (4) ↔ Index tip (8) distance < threshold → `pinch-start`, `pinch-hold`, `pinch-end`
- **Fist detection:** All finger tips close to palm center → `fist` (mode switch)
- **Point detection:** Only index finger extended → `point` (used in paint mode)
- **Open palm:** All fingers extended → `open-palm` (used for grab/move)
- **Swipe detection:** Velocity of wrist landmark > threshold → `swipe-left`, `swipe-right` (destroy mode)
- Each gesture has debounce/cooldown to prevent flickering
- Configurable sensitivity thresholds

---

### 5. Three.js Holographic Scene

#### [NEW] [holoScene.js](file:///d:/HoloGraphic/js/holoScene.js)
- **Scene setup:** Transparent WebGL renderer overlaying webcam feed
- **Camera:** Perspective camera matched to hand tracking coordinate space
- **Post-processing:** Bloom pass (UnrealBloomPass) for neon glow, Film grain for atmosphere
- **Ambient particles:** Floating holographic dust particles filling the scene
- **Grid floor:** Faint holographic grid plane for depth perception
- **Lighting:** Ambient + point lights that react to hand positions

---

### 6. Holographic Shape System

#### [NEW] [holoShapes.js](file:///d:/HoloGraphic/js/holoShapes.js)
- **Custom holographic ShaderMaterial:**
  - Fresnel rim glow (edge detection based on view angle)
  - Animated scanlines scrolling vertically
  - Glitch vertex displacement (random offset pulses)
  - Color-shifting iridescence based on view angle
  - Transparency with additive blending
- **Shape types:** Icosahedron, Torus, TorusKnot, Octahedron, Dodecahedron
- **Spawn animation:** Scale from 0 → full with elastic easing + particle burst
- **Interaction states:** Idle (gentle float + rotate), Grabbed (follows hand), Resizing (scale with pinch distance)
- **Shatter animation:** Geometry breaks into triangular fragments that fly outward with physics

---

### 7. GPU Particle System

#### [NEW] [particles.js](file:///d:/HoloGraphic/js/particles.js)
- **Points-based system** using `THREE.Points` with custom shader
- **Paint trails:** Particles emitted from index fingertip position in paint mode, fade over time
- **Explosion particles:** Burst of 200+ particles on shape destruction with velocity + gravity
- **Ambient dust:** Subtle floating particles across the scene for atmosphere
- **Additive blending** for bright, glowing particle effects
- **Color follows** the current mode's palette (cyan for sculpt, magenta for paint, amber for destroy)

---

### 8. Game State Machine

#### [NEW] [gameState.js](file:///d:/HoloGraphic/js/gameState.js)
- **States:** `SPLASH` → `PLAYING` → `PAUSED`
- **Sub-modes within PLAYING:** `SCULPT`, `PAINT`, `DESTROY`
- **Fist gesture** cycles through modes with a visual transition
- **Splash screen:** Animated logo + "Show your hands to begin" prompt
- **Auto-start** when first hand is detected
- **Mode transitions:** Smooth color shift + particle burst + HUD update

---

### 9. Scoring & Feedback

#### [NEW] [scoring.js](file:///d:/HoloGraphic/js/scoring.js)
- **Points for:** Spawning shapes (+10), Destroying shapes (+25 × combo), Paint strokes (+5)
- **Combo system:** Rapid successive destroys multiply score (2×, 3×, 5×, 10×)
- **Visual feedback:** Score numbers float upward from action point, combo text pulses
- **Persistent high score** via localStorage

---

### 10. HUD & UI Overlay

#### [NEW] [ui.js](file:///d:/HoloGraphic/js/ui.js)
- **Score display:** Top-right with animated counter
- **Mode indicator:** Bottom-center showing current mode with icon + color
- **Hand status:** Subtle indicator showing detected hands
- **Combo display:** Center-screen with dramatic scaling animation
- **Instructions:** Contextual tips based on current mode (fade in/out)
- All elements use glassmorphism styling from CSS design system

---

## Visual Effects Summary

| Effect | Technique | Purpose |
|--------|-----------|---------|
| Holographic rim glow | GLSL Fresnel shader | Shapes look like holograms |
| Animated scanlines | Fragment shader | Authentic hologram texture |
| Glitch displacement | Vertex shader noise | Shapes feel "projected" |
| Neon bloom | Three.js EffectComposer + Bloom | Everything glows |
| Particle trails | Points + custom shader | Paint mode visuals |
| Shape explosions | Fragment physics simulation | Destroy mode satisfaction |
| Ambient dust | Floating Points system | Atmosphere + depth |
| CSS scanline overlay | CSS animation | Full-screen holographic feel |
| Glassmorphism UI | backdrop-filter + border | Premium sci-fi HUD |
| Score pop animation | CSS keyframes | Satisfying feedback |

---

## Verification Plan

### Manual Verification
1. Open in browser with webcam access
2. Verify splash screen appears with holographic animations
3. Show hands → game auto-starts in Sculpt mode
4. Test pinch gesture spawns holographic shapes
5. Test drag gesture moves shapes
6. Make fist → verify mode switches to Paint
7. Test paint trails follow index finger
8. Make fist again → verify mode switches to Destroy
9. Test swipe through shapes → verify shatter + particle explosion
10. Verify score updates and combo system works
11. Test with 1 hand and 2 hands
12. Verify responsive layout on window resize

### Automated Tests
- `npx serve d:\HoloGraphic` to serve the app locally and test in browser
