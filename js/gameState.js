/* ===================================================
   HoloGraphic — Simplified State (Tony Stark Edition)
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    const STATES = Object.freeze({ SPLASH: 'SPLASH', ACTIVE: 'ACTIVE' });

    class Game {
        constructor() {
            this.state = STATES.SPLASH;
            this._listeners = {};
        }
        on(ev, cb)  { (this._listeners[ev] = this._listeners[ev] || []).push(cb); return this; }
        emit(ev, d) { (this._listeners[ev] || []).forEach(cb => cb(d)); }

        activate() {
            if (this.state !== STATES.SPLASH) return;
            this.state = STATES.ACTIVE;
            this.emit('stateChange', { state: this.state });
        }

        get isSplash() { return this.state === STATES.SPLASH; }
        get isActive() { return this.state === STATES.ACTIVE; }
    }

    HOLO.GameState = Game;
    HOLO.STATES    = STATES;
})();
