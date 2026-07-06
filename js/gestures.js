/* ===================================================
   HoloGraphic — Gesture Engine (Tony Stark Edition)
   Enhanced with palm-delta tracking for rotation and
   two-hand distance tracking for scaling.
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    class GestureDetector {
        constructor(opts) {
            opts = opts || {};
            this.pinchThreshold      = opts.pinchThreshold      || 0.065;
            this.fistThreshold       = opts.fistThreshold       || 0.095;
            this.swipeSpeedThreshold = opts.swipeSpeedThreshold || 1.4;

            this.gestures        = {};
            this._prevWrist      = {};
            this._prevPalm       = {};
            this._prevTime       = {};
            this._swipeCooldown  = {};
        }

        /**
         * Process one hand's landmarks.
         * Returns gesture state including palmDelta for rotation control.
         */
        detect(lm, hand) {
            const key = hand === 'Left' ? 'left' : 'right';
            const now = performance.now();

            if (!this.gestures[key]) this.gestures[key] = this._empty();
            const g = this.gestures[key];

            /* Key landmarks */
            const wrist    = lm[0];
            const thumbTips = lm[4];
            const idxTip   = lm[8];
            const midTip   = lm[12];
            const ringTip  = lm[16];
            const pinkyTip = lm[20];
            const idxMcp   = lm[5];
            const midMcp   = lm[9];
            const ringMcp  = lm[13];
            const pinkyMcp = lm[17];

            const palm = {
                x: (idxMcp.x + midMcp.x + ringMcp.x + pinkyMcp.x) / 4,
                y: (idxMcp.y + midMcp.y + ringMcp.y + pinkyMcp.y) / 4,
                z: (idxMcp.z + midMcp.z + ringMcp.z + pinkyMcp.z) / 4
            };

            g.thumbTip   = thumbTips;
            g.indexTip   = idxTip;
            g.palmCenter = palm;
            g.wrist      = wrist;

            /* ---- PINCH ---- */
            g.pinchDistance = this._dist(thumbTips, idxTip);
            const wasPinch  = g.pinch;
            g.pinch      = g.pinchDistance < this.pinchThreshold;
            g.pinchStart = !wasPinch && g.pinch;
            g.pinchEnd   =  wasPinch && !g.pinch;

            /* ---- FIST ---- */
            const tips     = [thumbTips, idxTip, midTip, ringTip, pinkyTip];
            const tipDists = tips.map(t => this._dist(t, palm));
            const avgDist  = tipDists.reduce((a, b) => a + b, 0) / 5;
            const wasFist  = g.fist;
            g.fist      = avgDist < this.fistThreshold;
            g.fistStart = !wasFist && g.fist;

            /* ---- OPEN PALM ---- */
            g.openPalm = tipDists.every(d => d > 0.10);

            /* ---- POINT ---- */
            const idxExt = this._dist(idxTip, wrist) > this._dist(idxMcp, wrist) * 1.15;
            const othersCurled = [midTip, ringTip, pinkyTip].every(t => this._dist(t, palm) < 0.12);
            g.point = idxExt && othersCurled && !g.pinch;

            /* ---- PALM DELTA (for rotation) ---- */
            if (this._prevPalm[key]) {
                g.palmDelta = {
                    x: palm.x - this._prevPalm[key].x,
                    y: palm.y - this._prevPalm[key].y
                };
            } else {
                g.palmDelta = { x: 0, y: 0 };
            }
            this._prevPalm[key] = { x: palm.x, y: palm.y };

            /* ---- SWIPE ---- */
            g.swipe         = null;
            g.swipeVelocity = null;

            if (this._prevWrist[key] && this._prevTime[key]) {
                const dt = (now - this._prevTime[key]) / 1000;
                if (dt > 0 && dt < 0.15) {
                    const pw = this._prevWrist[key];
                    const vx = (wrist.x - pw.x) / dt;
                    const vy = (wrist.y - pw.y) / dt;
                    const speed = Math.sqrt(vx * vx + vy * vy);
                    if (speed > this.swipeSpeedThreshold) {
                        const cd = this._swipeCooldown[key] || 0;
                        if (now - cd > 700) {
                            g.swipe = vx > 0 ? 'right' : 'left';
                            g.swipeVelocity = { x: vx, y: vy, speed };
                            this._swipeCooldown[key] = now;
                        }
                    }
                }
            }
            this._prevWrist[key] = { x: wrist.x, y: wrist.y, z: wrist.z };
            this._prevTime[key]  = now;

            return g;
        }

        /**
         * Get distance between two hands' palm centres (for scaling).
         * Returns null if not enough data.
         */
        getTwoHandDistance() {
            const L = this.gestures.left;
            const R = this.gestures.right;
            if (!L || !R || !L.palmCenter || !R.palmCenter) return null;
            return this._dist(L.palmCenter, R.palmCenter);
        }

        getGesture(h) { return this.gestures[h] || null; }

        reset(h) {
            if (h) { delete this.gestures[h]; delete this._prevPalm[h]; delete this._prevWrist[h]; delete this._prevTime[h]; }
            else   { this.gestures = {}; this._prevPalm = {}; this._prevWrist = {}; this._prevTime = {}; }
        }

        _dist(a, b) {
            const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z||0) - (b.z||0);
            return Math.sqrt(dx*dx + dy*dy + dz*dz);
        }

        _empty() {
            return {
                pinch: false, pinchDistance: 0, pinchStart: false, pinchEnd: false,
                fist: false, fistStart: false, point: false, openPalm: false,
                swipe: null, swipeVelocity: null,
                palmDelta: { x: 0, y: 0 },
                thumbTip: null, indexTip: null, palmCenter: null, wrist: null
            };
        }
    }

    HOLO.GestureDetector = GestureDetector;
})();
