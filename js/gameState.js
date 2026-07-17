/* ===================================================
   HoloGraphic — Simplified State (Tony Stark Edition)
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    const STATE = Object.freeze({ SPLASH: 'SPLASH', ACTIVE: 'ACTIVE' });

    class Gamer {
        constructor() {
            this.state = STATE.SPLASH;
            this._listeners = {};
        }
        on(ev, cb)  { (this._listeners[ev] = this._listeners[ev] || []).push(cb); return this; }
        emit(ev, d) { (this._listeners[ev] || []).forEach(cb => cb(d)); }

        activate() {
            if (this.state !== STATE.SPLASH) return;
            this.state = STATE.ACTIVE;
            this.emit('stateChange', { state: this.state });
        }

        get isSplash() { return this.state === STATES.SPLASH; }
        get isActive() { return this.state === STATES.ACTIVE; }
    }

    HOLO.GameState = Gamer;
    HOLO.STATES    = STATES;
})();
