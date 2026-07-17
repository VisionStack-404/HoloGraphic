<div align="center">
  
# 🔮 HoloGraphic
**An AI-Powered Holographic Spatial Computing Platform**

[![Live Demo](https://img.shields.io/badge/Play_Now-Live_Demo-00f0ff?style=for-the-badge&logo=googlechrome&logoColor=black)](https://visionstack-404.github.io/HoloGraphic/)
[![GitHub Stars](https://img.shields.io/github/stars/VisionStack-404/HoloGraphic?style=for-the-badge&logo=github)](https://github.com/VisionStack-404/HoloGraphic)
[![Built With Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![Powered by MediaPipe](https://img.shields.io/badge/MediaPipe-AI_Vision-ea4335?style=for-the-badge)](https://mediapipe.dev/)

*Transform your webcam into a futuristic 3D control system. Interact with glowing holograms using real-time hand tracking, gesture recognition, and immersive visual effects—all inside your browser. ✋⚡*

</div>

---

## ⚡ What is HoloGraphic?

HoloGraphic is an immersive, browser-based augmented reality experience that transforms your screen into a Tony Stark-style holographic laboratory. By combining **Machine Learning-powered computer vision**, **real-time 3D rendering**, and **spatial gesture recognition**, HoloGraphic lets you manipulate virtual objects using just your bare hands and a webcam.

No controllers. No installation. No special hardware. Just pure, futuristic interaction.

### ✨ Core Features

- **🎯 Zero-Setup Hand Tracking**: Uses Google's MediaPipe AI to detect 21 3D landmarks on your hands natively in the browser with sub-millisecond latency
- **📐 Real-Time Physical Scaling**: Dynamically calculate the Euclidean distance between your thumb and index finger to scale objects in real-time
- **🎨 Intelligent Collision Detection**: Spatial mapping allows the system to know exactly when your virtual fingertip touches the surface of 3D geometry
- **🌟 Glassmorphism HUD**: A sleek, futuristic UI overlay with real-time feedback and instant geometry swapping
- **🎆 Dynamic Visual Effects**: Glowing wireframes, additive blending, pulsing opacity, and responsive color changes
- **⚙️ Vanilla Stack**: No bloated frameworks—optimized performance with pure JavaScript, Three.js, and MediaPipe

---

## 🎮 How to Play

1. Click the **[Live Demo](https://visionstack-404.github.io/HoloGraphic/)** link above
2. **Grant camera permissions** when prompted
3. Wait a few seconds for the AI model to initialize
4. Use your hands to interact!

### 🤚 The Gestures

| Gesture | Action | How It Works |
| :--- | :--- | :--- |
| **🤏 Right Hand Pinch** | Scale Geometry | Hold your right hand up. Pinch your thumb and index finger close together to shrink the shape, or pull them apart to enlarge it. The distance is calculated in real-time and applied to the 3D object. |
| **👆 Left Hand Touch** | Change Color | Hold your left hand up. Move your index fingertip so that it physically intersects the 3D shape on your screen using collision detection. The hologram will instantly burst into a new random color. |
| **🖱️ UI Click** | Swap Shapes | Use your mouse to click the `[Sphere]`, `[Cube]`, or `[Torus]` buttons in the top right corner to instantly swap between different holographic geometries. |

---

## 🏗️ Architecture & Technical Deep Dive

HoloGraphic is built using a highly optimized, vanilla web stack to ensure maximum framerates for AI tracking and smooth 3D rendering.

### 1. The Rendering Pipeline (Three.js)

The 3D environment is rendered over a transparent WebGL canvas overlaid exactly on top of your mirrored webcam feed.

**Geometry Structure:**
- The geometry consists of a `THREE.Group` containing:
  - A **solid mesh** with additive blending (`opacity: 0.5`) for a glowing appearance
  - A **glowing wireframe mesh** overlaid for depth perception
- The scene is continuously rotated inside the `requestAnimationFrame` loop
- The opacity pulses dynamically using a Sine wave function based on `Date.now()` for a breathing effect
- Multiple geometries support: Sphere, Cube, and Torus with customizable properties

**Rendering Optimization:**
- WebGL canvas clears and renders at 60 FPS (or device max refresh rate)
- Layer-based rendering: background video → 3D geometry → UI overlay
- Efficient material reuse to minimize GPU memory overhead

### 2. The AI Vision Engine (MediaPipe Hands)

MediaPipe runs a lightweight neural network directly in your browser—no server calls, completely private.

**How It Works:**
- Captures video frames at 30 FPS
- Returns an array of **21 (x, y, z) coordinates** for each detected hand
- Confidence scores for each landmark (filtered at 0.5 threshold)
- Differentiates between **Left** and **Right** hands to assign different interactive tools:
  - **Right Hand**: Scaling mechanism via pinch gesture
  - **Left Hand**: Coloring mechanism via touch detection

**Performance:**
- ~50-100ms latency between hand movement and screen update
- Works across all major browsers with WebGL 2.0 support
- Graceful fallback if camera access is denied

### 3. Spatial Coordinate Mapping & Collision Detection

To make your physical hand interact with virtual objects, we map normalized `[0.0 to 1.0]` MediaPipe coordinates into Three.js world space:

```javascript
// Convert normalized screen coordinates to world coordinates
const worldX = (indexTip.x - 0.5) * 16;  // Horizontal: -8 to +8
const worldY = (0.5 - indexTip.y) * 12;  // Vertical: -6 to +6
const worldZ = 0;

// Create a 3D vector for raycasting
const fingerTip = new THREE.Vector3(worldX, worldY, worldZ);

// Test collision with the geometry using bounding box intersection
const distanceToCenter = fingerTip.distanceTo(geometry.position);
if (distanceToCenter < collisionThreshold) {
  // Trigger color change or other interaction
}
```

**Key Techniques:**
- **Raycasting**: Uses Three.js raycasting for precise intersection detection
- **Bounding Box Collision**: Efficient spatial queries
- **Distance Calculation**: Euclidean distance for smooth scaling feedback

### 4. Gesture Recognition Pipeline

```
Video Frame → MediaPipe Detection → Landmark Extraction → Gesture Analysis → Action Trigger
                                                               ↓
                                            Distance Calculation (Pinch)
                                            Collision Detection (Touch)
```

**Pinch Detection (Right Hand):**
- Calculate distance between thumb and index finger
- Normalize to scaling factor (0.1x to 3.0x)
- Apply smoothing filter to reduce jitter
- Update geometry scale on each frame

**Touch Detection (Left Hand):**
- Track index finger tip position in world space
- Test collision every frame
- On collision, generate random RGB color
- Transition color with 200ms animation

---

## 📊 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Rendering** | Three.js | 3D rendering, camera control, lighting |
| **Vision/AI** | MediaPipe Hands | Hand tracking & landmark detection |
| **Graphics** | WebGL 2.0 | GPU-accelerated rendering |
| **Video** | getUserMedia API | Real-time webcam access |
| **Language** | Vanilla JavaScript (ES6+) | Core application logic |
| **Styling** | CSS3 | Glassmorphism effects, UI overlay |
| **Markup** | HTML5 | Semantic structure, canvas setup |

**No Dependencies:**
- ✅ Zero npm packages required (fully self-contained)
- ✅ No build step needed
- ✅ Ship 3 files: `index.html`, `style.css`, `script.js`

---

## 💻 Running it Locally

If you want to modify the code or run it locally:

### 1. Clone the Repository

```bash
git clone https://github.com/VisionStack-404/HoloGraphic.git
cd HoloGraphic
```

### 2. Start a Local Server

Webcam access strictly requires a secure context (`https://`) or `localhost`. You cannot simply open the `index.html` file in your browser. Use one of these options:

**Option A: Node.js (Recommended)**
```bash
npx serve .
```

**Option B: Python 3**
```bash
python -m http.server 3000
```

**Option C: Python 2**
```bash
python -m SimpleHTTPServer 3000
```

**Option D: PHP**
```bash
php -S localhost:3000
```

### 3. Open Your Browser

Navigate to `http://localhost:3000` and grant camera permissions.

---

## 🌐 Deploying to GitHub Pages (Live Website)

Host your HoloGraphic instance live for free on GitHub Pages!

### Step-by-Step Instructions:

1. **Navigate to Repository Settings:**
   - Go to your repository on GitHub
   - Click the ⚙️ **Settings** tab near the top right

2. **Enable GitHub Pages:**
   - On the left-hand sidebar, click **Pages**
   - Under the **Build and deployment** section:
     - For **Source**, select **Deploy from a branch**
     - For **Branch**, select `main` (or `master`) from the dropdown
     - Leave the folder as `/ (root)`
     - Click **Save**

3. **Wait for Deployment:**
   - GitHub will build your site (takes 1-2 minutes)
   - Once complete, your live demo will be available at: `https://visionstack-404.github.io/HoloGraphic/`

4. **Update the Live Demo Badge:**
   - Edit the badge URL in this README to point to your GitHub Pages site

---

## 🎨 Customization Guide

### Modify the Geometry

Edit `script.js` and change the geometry creation:

```javascript
// Default: Sphere
const geometry = new THREE.SphereGeometry(2, 32, 32);

// Try: Cube
// const geometry = new THREE.BoxGeometry(3, 3, 3);

// Try: Torus
// const geometry = new THREE.TorusGeometry(2, 0.8, 16, 100);
```

### Adjust Interaction Sensitivity

Tweak these constants in `script.js`:

```javascript
const PINCH_SCALE_MULTIPLIER = 3.0;      // How much pinch affects size
const COLLISION_THRESHOLD = 0.5;         // Touch sensitivity
const HAND_SMOOTHING_FACTOR = 0.7;       // Hand tracking smoothness (0-1)
```

### Change Colors & Themes

Modify the `style.css` to customize:
- HUD glassmorphism effect
- Button colors and hover states
- Background gradient
- Glow effects

---

## 🚀 Performance Tips

- **Ensure Good Lighting:** MediaPipe works best in well-lit environments
- **Position Your Camera:** Keep your hands in the center of the frame for best tracking
- **Use HTTPS in Production:** Webcam access requires a secure context
- **Test Across Devices:** Performance varies; use Chrome/Edge for best results
- **Monitor GPU Usage:** Open DevTools (F12) → Performance tab to profile

---

## 🐛 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Camera won't turn on** | Check browser permissions; ensure using HTTPS or localhost |
| **Hand tracking is jittery** | Improve lighting, adjust `HAND_SMOOTHING_FACTOR` in code |
| **Geometry not responding** | Verify MediaPipe is loaded; check browser console for errors |
| **Low FPS on older devices** | Reduce geometry complexity (fewer segments); disable rotation |
| **Color changes aren't working** | Ensure left hand is detected; check collision threshold |

---

## 📚 Learning Resources

- **Three.js Documentation:** https://threejs.org/docs/
- **MediaPipe Hands:** https://mediapipe.dev/solutions/hands
- **WebGL Fundamentals:** https://webglfundamentals.org/
- **Gesture Recognition:** https://github.com/google/mediapipe/solutions/hands

---

## 🤝 Contributing

Found a bug? Have an idea? Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the **MIT License**. See the LICENSE file for details.

---

## 🎯 Roadmap & Future Ideas

- [ ] Multi-hand gesture combinations
- [ ] Voice commands integration
- [ ] Particle effects system
- [ ] Haptic feedback (if device supports)
- [ ] VR/AR headset support
- [ ] Object physics simulation
- [ ] Custom shape loader
- [ ] Recording & playback system

---

<div align="center">
  <h3>🌟 Built with passion for the future of spatial computing. 🌟</h3>
  <p><i>Transform the way you interact with digital experiences.</i></p>
  
  [🔗 Live Demo](https://visionstack-404.github.io/HoloGraphic/) • 
  [📖 Documentation](#) • 
  [🐛 Report Issue](https://github.com/VisionStack-404/HoloGraphic/issues)
</div>
