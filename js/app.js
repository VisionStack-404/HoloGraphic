/* ===================================================
   HoloGraphic — Tony Stark App Controller
   =================================================== */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {

        const gameState = new HOLO.GameState();
        const gestures  = new HOLO.GestureDetector();

        const videoE      = document.getElementById('webcam');
        const canvas     = document.getElementById('canvas');
        const threeBox     = document.getElementById('three-canvas');
        const splashScreen = document.getElementById('splash-screen');
        const splashStatus = document.getElementById('splash-status');

        const tracker = new HOLO.HandTracker(videoE, canvas);
        tracker.updateCanvasSize();

        const scene = new HOLO.HoloScene(threeBox);
        const ui = new HOLO.UI();

        // Single central hologram
        let currentShapeIdx = 0;
        let activeHologram = null;
        let baseScale = 1.0;

        function spawnCentralHologram() {
            if (activeHologram) {
                activeHologram.destroy();
            }
            const type = HOLO.SHAPE_TYPES[currentShapeIdx];
            const color = HOLO.NEON_COLORS[currentShapeIdx % HOLO.NEON_COLORS.length];
            activeHologram = scene.spawnShape(0, 0, 0, { type, color, size: 1.0 });
            baseScale = 1.0;
        }

        gameState.on('stateChange', ({ state }) => {
            if (state === HOLO.STATES.ACTIVE) {
                splashScreen.classList.add('hidden');
                ui.setVisible(true);
                spawnCentralHologram();
            }
        });

        tracker.on('frame', ({ hands, count }) => {
            ui.updateStatus(count);

            if (count > 0 && gameState.isSplash) {
                gameState.activate();
            }
            if (!gameState.isActive || !activeHologram) return;

            // Gather gestures for both hands
            for (const { landmarks, handedness } of hands) {
                gestures.detect(landmarks, handedness);
            }

            const L = gestures.getGesture('left');
            const R = gestures.getGesture('right');

            let interacting = false;

            // Rotation (Open Palm) - use the primary hand's delta
            // If both are open, average them or just use one. Let's use right hand preference.
            const rotHand = (R && R.openPalm) ? R : ((L && L.openPalm) ? L : null);
            if (rotHand) {
                activeHologram.group.rotation.y += rotHand.palmDelta.x * 3.0;
                activeHologram.group.rotation.x += rotHand.palmDelta.y * 3.0;
                interacting = true;
                ui.setHint('Rotating Geometry');
            }

            // Scaling (Two hands pinching/fist or distance)
            const twoHandDist = gestures.getTwoHandDistance();
            if (twoHandDist && ((L && L.pinch) || (R && R.pinch))) {
                // Map distance to scale
                const targetScale = Math.max(0.2, Math.min(3.0, twoHandDist * 3));
                baseScale += (targetScale - baseScale) * 0.1; // Smooth lerp
                interacting = true;
                ui.setHint('Scaling Geometry');
            }
            
            activeHologram.group.scale.setScalar(baseScale);

            // Swipe to change shape
            const swipeHand = (R && R.swipe) ? R : ((L && L.swipe) ? L : null);
            if (swipeHand) {
                if (swipeHand.swipe === 'right') {
                    currentShapeIdx = (currentShapeIdx + 1) % HOLO.SHAPE_TYPES.length;
                } else {
                    currentShapeIdx = (currentShapeIdx - 1 + HOLO.SHAPE_TYPES.length) % HOLO.SHAPE_TYPES.length;
                }
                scene.particles.emitModeSwitch(0, 0, 0, activeHologram.color);
                spawnCentralHologram();
                interacting = true;
                ui.setHint('Geometry Changed');
            }

            if (!interacting) {
                ui.setHint('Awaiting Input');
            }
            
            ui.setInteracting(interacting);

            if (activeHologram) {
                const geo = activeHologram.solidMesh.geometry;
                const verts = geo.attributes.position.count;
                const faces = geo.index ? geo.index.count / 3 : verts / 3;
                
                ui.updateShapeInfo(
                    activeHologram.type,
                    baseScale,
                    activeHologram.group.rotation.x,
                    activeHologram.group.rotation.y,
                    activeHologram.group.rotation.z,
                    verts,
                    faces
                );
            }
        });

        window.addEventListener('resize', () => tracker.updateCanvasSize());

        function loop() {
            requestAnimationFrame(loop);
            scene.update();
        }

        try {
            splashStatus.textContent = 'INITIALIZING SENSORS...';
            await tracker.init();
            splashStatus.textContent = 'SENSORS ONLINE. SHOW HANDS TO INITIATE.';
            loop();
        } catch (err) {
            console.error('Init failed:', err);
            splashStatus.textContent = 'SYSTEM FAILURE: ' + err.message;
        }
    });
})();
