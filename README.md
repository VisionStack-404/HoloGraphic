<div align="center">
  
# 🔮 HoloGraphic
**A Next-Gen Augmented Reality Interface in Your Browser**

[![Live Demo](https://img.shields.io/badge/Play_Now-Live_Demo-00f0ff?style=for-the-badge&logo=googlechrome&logoColor=black)](https://visionstack-404.github.io/HoloGraphic/)
[![Built With Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![Powered by MediaPipe](https://img.shields.io/badge/MediaPipe-AI_Vision-ea4335?style=for-the-badge)](https://mediapipe.dev/)

*Interact with 3D holograms using just your webcam and bare hands. No controllers required.*

</div>

---

## ⚡ What is HoloGraphic?

HoloGraphic is an immersive, browser-based augmented reality experiment that transforms your screen into a Tony Stark-style holographic laboratory. By combining **Machine Learning computer vision** with **WebGL 3D rendering**, the application tracks your hand movements in real-time and maps them into 3D space, allowing you to seamlessly manipulate neon geometries.

### ✨ Core Features
- **Zero Setup Tracking**: Uses Google's MediaPipe AI to detect 21 3D landmarks on your hands natively in the browser.
- **Physical Scaling**: Dynamically calculate the Euclidean distance between your thumb and index finger to scale objects on screen.
- **Collision Detection**: Spatial mapping allows the system to know exactly when your virtual fingertip touches the surface of the 3D geometry.
- **Glassmorphism HUD**: A sleek, futuristic UI overlay that lets you swap between different geometrical constructs instantly.

---

## 🎮 How to Play

Click the **[Live Demo](https://visionstack-404.github.io/HoloGraphic/)** link above, grant camera permissions, and wait a few seconds for the AI model to initialize.

### The Gestures
| Gesture | Action | Mechanics |
| :--- | :--- | :--- |
| **🤏 Right Hand Pinch** | **Scale Geometry** | Hold your right hand up. Pinch your thumb and index finger close together to shrink the shape, or pull them apart to enlarge it. |
| **👆 Left Hand Touch** | **Change Color** | Hold your left hand up. Move your index fingertip so that it physically intersects the 3D shape on your screen. It will instantly burst into a new neon color. |
| **🖱️ UI Click** | **Change Shape** | Use your mouse to click the `[Sphere]`, `[Cube]`, or `[Torus]` buttons in the top right corner to instantly swap the holographic geometry. |

---

## 🏗️ Architecture & Technical Details

HoloGraphic is built using a highly optimized, vanilla web stack to ensure maximum framerates for AI tracking.

### 1. The Rendering Pipeline (Three.js)
The 3D environment is rendered over a transparent WebGL canvas overlaid exactly on top of your mirrored webcam feed. 
- The geometry consists of a `THREE.Group` containing a solid mesh with additive blending (`opacity: 0.5`) and a glowing wireframe mesh. 
- The scene is continuously rotated inside the `requestAnimationFrame` loop, and the opacity pulses dynamically using a Sine wave function based on `Date.now()`.

### 2. The AI Vision Engine (MediaPipe Hands)
MediaPipe runs a lightweight neural network directly in your browser. 
- It captures video frames and returns an array of 21 (x, y, z) coordinates for each detected hand.
- We differentiate between `Left` and `Right` hands to assign different interactive tools (Scaling vs. Painting/Coloring).

### 3. Spatial Coordinate Mapping
To make your physical hand interact with virtual objects, we map the normalized `[0.0 to 1.0]` coordinates from MediaPipe into the Three.js world space:
```javascript
const worldX = (indexTip.x - 0.5) * 16;
const worldY = (0.5 - indexTip.y) * 12;
```
By calculating the 3D distance between your fingertip and the sphere's bounding box, we achieve seamless collision detection.

---

## 💻 Running it Locally

If you want to modify the code or run it locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VisionStack-404/HoloGraphic.git
   cd HoloGraphic
   ```

2. **Serve the files:**
   Webcam access strictly requires a secure context (`https://`) or `localhost`. You cannot simply open the `index.html` file in your browser. Use a local server:
   
   *Using Node.js:*
   ```bash
   npx serve .
   ```
   *Using Python:*
   ```bash
   python -m http.server 3000
   ```

3. **Open your browser** and navigate to `http://localhost:3000`.

---
<div align="center">
  <i>Built with passion for the future of spatial computing.</i>
</div>
