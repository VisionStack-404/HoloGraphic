# HoloGraphic 🔮

An immersive, browser-based augmented reality experience built with **Three.js** and **MediaPipe Hand Tracking**. HoloGraphic allows you to use your webcam and bare hands to interact with 3D neon shapes in real-time.

## 🚀 Features

- **No controllers needed**: Uses standard webcams and AI hand-tracking to detect your movements.
- **Multiple Shapes**: Seamlessly swap between a Sphere, Cube, and Torus knot.
- **Dynamic Scaling**: Pinch your right thumb and index finger to scale the 3D geometry dynamically.
- **Interactive Colors**: Touch the shape with your left index finger to trigger neon color bursts.
- **Glassmorphism UI**: Clean, futuristic overlay for selecting geometries.

## 🕹️ How to Play

### 1. Start the Experience
1. Open the website or run the project locally.
2. Ensure you are in a well-lit environment.
3. **Allow webcam access** when prompted by your browser.
4. Wait a few seconds for the AI models (MediaPipe) to load.

### 2. The Controls
- **Change Shape**: Use the UI buttons in the top right corner (`Sphere`, `Cube`, `Torus`) to select which shape is active.
- **Right Hand (Scale)**: Hold up your right hand. Pinch your thumb and index finger together to shrink the shape. Open your fingers wide to enlarge the shape.
- **Left Hand (Color)**: Hold up your left hand. Move your index fingertip so that it touches the 3D shape on your screen. The shape will instantly change to a random neon color.

## 💻 Local Setup

If you want to run the project on your own machine:

1. Clone this repository:
   ```bash
   git clone https://github.com/VisionStack-404/HoloGraphic.git
   ```
2. Navigate to the project folder:
   ```bash
   cd HoloGraphic
   ```
3. Because this project requires access to your webcam, it **must** be run through a local web server (opening the HTML file directly in Chrome blocks webcam access for security reasons). You can use any local server, such as:

   Using Node.js/npx:
   ```bash
   npx serve .
   ```
   Or using Python:
   ```bash
   python -m http.server
   ```
4. Open your browser and navigate to `http://localhost:3000` (or whichever port your local server specifies).

## 🛠️ Technology Stack
- [Three.js](https://threejs.org/) - 3D WebGL rendering
- [MediaPipe Hands](https://mediapipe.dev/) - Machine Learning hand landmark detection
- Vanilla HTML/CSS/JS

## 🤝 Credits
Inspired by holographic interfaces and built for the web.
