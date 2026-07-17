/* ===================================================
   HoloGraphic — Hand Tracking Wrapper
   Wraps MediaPipe Hands with smoothing & event system
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    class HandTracker {
        constructor(videoElements, canvasElements) {
            this.video  = videoElements;
            this.canvas = canvasElements;
            this.ctx    = canvasElements.getContext('2d');
            this.hands  = null;
            this.cam    = null;
            this.isReady = false;

            this._listeners   = {};
            this._smoothed    = {};
            this._smoothAlpha = 0.57; // 0 = raw, 1 = frozen
        }

        /* — Events — */
        on(ev, cb)  { (this._listeners[ev] = this._listeners[ev] || []).push(cb); return this; }
        emit(ev, d) { (this._listeners[ev] || []).forEach(cb => cb(d)); }

        /* — Bootstrap — */
        async init() {
            /* Webcam */
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            });
            this.video.srcObject = stream;
            await new Promise(r => { this.video.onloadedmetadata = r; });

            /* MediaPipe Hands */
            this.hands = new Hands({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
            });
            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6
            });
            await this.hands.initialize();
            this.hands.onResults(r => this._onResults(r));

            /* Camera loop */
            this.cam = new Camera(this.video, {
                onFrame: async () => { await this.hands.send({ image: this.video }); },
                width: 1280,
                height: 720
            });
            this.cam.start();
            this.isReady = true;
            this.emit('ready');
        }

        /* — Frame handler — */
        _onResults(results) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const handsData = [];

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                    const rawLm = results.multiHandLandmarks[i];
                    const label = results.multiHandedness[i].label;   // 'Left' | 'Right'
                    const smoothed = this._smooth(rawLm, label);
                    this._drawHand(smoothed, label === 'Left');
                    handsData.push({ landmarks: smoothed, handedness: label });
                }
            }

            this.emit('frame', { hands: handsData, count: handsData.length });
        }

        /* — Smoothing (exponential moving average) — */
        _smooth(lm, key) {
            if (!this._smoothed[key]) {
                this._smoothed[key] = lm.map(l => ({ x: l.x, y: l.y, z: l.z }));
                return this._smoothed[key];
            }
            const s = this._smoothed[key];
            const a = 1 - this._smoothAlpha;
            for (let i = 0; i < lm.length; i++) {
                s[i].x += (lm[i].x - s[i].x) * a;
                s[i].y += (lm[i].y - s[i].y) * a;
                s[i].z += (lm[i].z - s[i].z) * a;
            }
            return s;
        }

        /* — 2-D hand skeleton drawing — */
        _drawHand(lm, isLeft) {
            const w = this.canvas.width;
            const h = this.canvas.height;
            const scale = Math.min(w, h);
            const lw = Math.max(1.5, scale / 450);
            const pr = Math.max(2, scale / 350);

            const CONNS = [
                [0,1],[1,2],[2,3],[3,4],
                [0,5],[5,6],[6,7],[7,8],
                [0,9],[9,10],[10,11],[11,12],
                [0,13],[13,14],[14,15],[15,16],
                [0,17],[17,18],[18,19],[19,20],
                [5,9],[9,13],[13,17]
            ];

            const baseColor = isLeft
                ? 'rgba(0,240,255,0.55)'   // cyan
                : 'rgba(255,0,255,0.55)';  // magenta
            const tipColor  = '#ffffff';

            // Connections
            this.ctx.lineWidth   = lw;
            this.ctx.strokeStyle = baseColor;
            for (const [a, b] of CONNS) {
                this.ctx.beginPath();
                this.ctx.moveTo(lm[a].x * w, lm[a].y * h);
                this.ctx.lineTo(lm[b].x * w, lm[b].y * h);
                this.ctx.stroke();
            }

            // Points
            const TIPS = new Set([4, 8, 12, 16, 20]);
            for (let i = 0; i < lm.length; i++) {
                const isTip = TIPS.has(i);
                this.ctx.fillStyle = isTip ? tipColor : baseColor;
                this.ctx.beginPath();
                this.ctx.arc(lm[i].x * w, lm[i].y * h, isTip ? pr * 1.4 : pr, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        /* — Resize helper — */
        updateCanvasSize() {
            this.canvas.width  = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    HOLO.HandTracker = HandTracker;
})();
