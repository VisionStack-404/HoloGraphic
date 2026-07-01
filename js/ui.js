/* ===================================================
   HoloGraphic — Iron Man HUD
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    class UI {
        constructor() {
            this.hud = document.getElementById('hud');
            this.panels = {};
            this.statusDot = null;
            this.statusLabel = null;
            this.reticle = document.getElementById('reticle');
            this.interactGlow = document.getElementById('interact-glow');
            this.shapeName = null;
            this.shapeHint = null;

            this._createElements();
        }

        _createElements() {
            // Status bar
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            statusBar.innerHTML = `
                <div class="status-dot off" id="status-dot"></div>
                <div class="status-label" id="status-label">NO TARGET</div>
            `;
            this.hud.appendChild(statusBar);
            this.statusDot = document.getElementById('status-dot');
            this.statusLabel = document.getElementById('status-label');

            // Shape title bar
            const titleBar = document.createElement('div');
            titleBar.className = 'shape-title-bar';
            titleBar.innerHTML = `
                <div class="shape-name" id="shape-name">INITIALIZING...</div>
                <div class="shape-hint" id="shape-hint">Awaiting telemetry</div>
            `;
            this.hud.appendChild(titleBar);
            this.shapeName = document.getElementById('shape-name');
            this.shapeHint = document.getElementById('shape-hint');

            // Data panels
            this.panels.tl = this._createDataPanel('panel-tl', 'ROTATION VECTOR', [
                { k: 'PITCH', id: 'val-pitch' },
                { k: 'YAW',   id: 'val-yaw' },
                { k: 'ROLL',  id: 'val-roll' }
            ]);
            this.panels.bl = this._createDataPanel('panel-bl', 'DIMENSIONAL', [
                { k: 'SCALE', id: 'val-scale' },
                { k: 'RADIUS', id: 'val-radius' }
            ]);
            this.panels.tr = this._createDataPanel('panel-tr right-align', 'ENVIRONMENT', [
                { k: 'AMBIENT', id: 'val-ambient' },
                { k: 'LUM',     id: 'val-lum' }
            ]);
            this.panels.br = this._createDataPanel('panel-br right-align', 'GEOMETRY', [
                { k: 'VERTICES', id: 'val-verts' },
                { k: 'FACES',    id: 'val-faces' }
            ]);
        }

        _createDataPanel(posClass, label, rows) {
            const p = document.createElement('div');
            p.className = 'data-panel ' + posClass;
            
            let html = `<div class="data-panel-label">${label}</div>`;
            rows.forEach(r => {
                html += `
                    <div class="data-panel-row">
                        <span class="data-key">${r.k}</span>
                        <span class="data-value" id="${r.id}">0.00</span>
                    </div>
                `;
            });
            p.innerHTML = html;
            this.hud.appendChild(p);
            return p;
        }

        setVisible(v) {
            this.hud.style.opacity = v ? '1' : '0';
            if (v) {
                setTimeout(() => {
                    Object.values(this.panels).forEach(p => p.classList.add('visible'));
                }, 800);
            }
        }

        updateStatus(handsCount) {
            if (handsCount > 0) {
                this.statusDot.classList.remove('off');
                this.statusLabel.textContent = 'LINK ESTABLISHED';
                this.reticle.classList.add('active');
            } else {
                this.statusDot.classList.add('off');
                this.statusLabel.textContent = 'NO TARGET';
                this.reticle.classList.remove('active');
                this.interactGlow.classList.remove('active');
            }
        }

        updateShapeInfo(type, scale, rotX, rotY, rotZ, verts, faces) {
            this.shapeName.textContent = type;
            
            document.getElementById('val-pitch').textContent = rotX.toFixed(2);
            document.getElementById('val-yaw').textContent   = rotY.toFixed(2);
            document.getElementById('val-roll').textContent  = rotZ.toFixed(2);
            
            document.getElementById('val-scale').textContent = scale.toFixed(2) + 'x';
            document.getElementById('val-radius').textContent = (scale * 0.8).toFixed(2) + 'm';

            document.getElementById('val-verts').textContent = verts;
            document.getElementById('val-faces').textContent = faces;

            // Fake some environment data
            document.getElementById('val-ambient').textContent = (Math.random() * 0.1 + 0.9).toFixed(2) + ' atm';
            document.getElementById('val-lum').textContent = (Math.random() * 20 + 200).toFixed(0) + ' lx';
        }

        setInteracting(isInteracting) {
            if (isInteracting) {
                this.interactGlow.classList.add('active');
            } else {
                this.interactGlow.classList.remove('active');
            }
        }

        setHint(text) {
            this.shapeHint.textContent = text;
        }
    }

    HOLO.UI = UI;
})();
