/* ===================================================
   Scoring Systems
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    const POINTS = Object.freeze({
        SPAWN:        20,
        DESTROY:      30,
        PAINT_STROKE:  8
    });

    const COMBO_THRESHOLDS = [
        { count:  3, multiplier:  2, label: '2× COMBO!' },
        { count:  5, multiplier:  3, label: '3× COMBO!' },
        { count:  8, multiplier:  5, label: '5× COMBO!' },
        { count: 12, multiplier: 10, label: '10× MEGA!'  }
    ];

    class Scoring {
        constructor() {
            this.score       = 0;
            this.combo       = 0;
            this.lastActionTime = 0;
            this.comboTimeout   = 2000; // ms before combo resets
            this.highScore   = this._load();
            this._listeners  = {};
        }

        /* — Events — */
        on(event, cb)  { (this._listeners[event] = this._listeners[event] || []).push(cb); return this; }
        emit(event, d) { (this._listeners[event] || []).forEach(cb => cb(d)); }

        /* — Core — */
        addPoints(type, position) {
            const now    = Date.now();
            const base   = POINTS[type] || 0;
            if (base === 0) return 0;

            // Combo tracking
            this.combo = (now - this.lastActionTime < this.comboTimeout) ? this.combo + 1 : 1;
            this.lastActionTime = now;

            // Resolve multiplier
            let multiplier = 1;
            let comboLabel = null;
            for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
                if (this.combo >= COMBO_THRESHOLDS[i].count) {
                    multiplier = COMBO_THRESHOLDS[i].multiplier;
                    comboLabel = COMBO_THRESHOLDS[i].label;
                    break;
                }
            }

            const pts = base * multiplier;
            this.score += pts;

            if (this.score > this.highScore) {
                this.highScore = this.score;
                this._save();
            }

            this.emit('scoreUpdate', { score: this.score, points: pts, multiplier, highScore: this.highScore });
            if (comboLabel) this.emit('combo', { label: comboLabel, multiplier, combo: this.combo });
            if (position)   this.emit('floatingScore', { points: pts, position });

            return pts;
        }

        reset() {
            this.score = 0;
            this.combo = 0;
            this.emit('scoreUpdate', { score: 0, points: 0, multiplier: 1, highScore: this.highScore });
        }

        /* — Persistence — */
        _load() { try { return parseInt(localStorage.getItem('holo_highscore') || '0', 10); } catch (_) { return 0; } }
        _save() { try { localStorage.setItem('holo_highscore', String(this.highScore)); } catch (_) { /* noop */ } }
    }

    HOLO.Scoring = Scoring;
    HOLO.POINTS  = POINTS;
})();
