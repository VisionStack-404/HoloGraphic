/* ===================================================
   HoloGraphic — Three.js Scene Manager
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    class HoloScene {
        constructor(container) {
            this.container = container;

            /* --- Core --- */
            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.1,
                100
            );
            this.camera.position.z = 8;

            this.renderers = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderers.setSize(window.innerWidth, window.innerHeight);
            this.renderers.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderers.setClearColor(0x000000, 0);
            container.appendChild(this.renderer.domElement);

            /* --- Collections --- */
            this.shapes    = [];
            this.fragments = [];

            /* --- Particles --- */
            this.particles        = new HOLO.ParticleSystem(this.scene, 6000);
            this.ambientParticles = new HOLO.AmbientParticles(this.scene, 160);

            /* --- Holographic grid floor --- */
            this._createGrid();

            /* --- Subtle lighting --- */
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

            /* --- Clock --- */
            this.clock = new THREE.Clock();

            /* --- Resize --- */
            window.addEventListener('resize', () => this._onResize());
        }

        /* ---- Grid ---- */
        _createGrid() {
            const grid = new THREE.GridHelper(32, 48, 0x00f0ff, 0x00f0ff);
            grid.position.y = -5.5;
            grid.material.opacity     = 0.05;
            grid.material.transparent = true;
            this.scene.add(grid);
        }

        /* ============================================================
           Coordinate mapping — hand landmarks → Three.js world space
           ============================================================ */
        handWorld(lm) {
            // Mirror x (webcam is CSS-mirrored; Three.js is not)
            const x = (0.5 - lm.x) * 14;
            const y = (0.5 - lm.y) * 10;
            const z = -(lm.z || 0) * 5;
            return new THREE.Vector3(x, y, z);
        }

        /* ============================================================
           Shape management
           ============================================================ */
        spawnShape(x, y, z, opts) {
            const shape = new HOLO.HoloShape(this.scene, { x, y, z, ...(opts || {}) });
            this.shapes.push(shape);

            const c = shape.color;
            this.particles.emitSpawn(x, y, z, { r: c.r, g: c.g, b: c.b });

            return shape;
        }

        findNearestShape(worldPos, maxDist) {
            maxDist = maxDist || 1.5;
            let best = null, bestD = maxDist;

            for (const s of this.shapes) {
                if (s.isDead || s.state === 'shattering') continue;
                const d = s.getWorldPosition().distanceTo(worldPos) - s.getBoundingSphere();
                if (d < bestD) { best = s; bestD = d; }
            }
            return best;
        }

        shatterShape(shape) {
            const pos = shape.getPosition();
            const c   = shape.color;

            // Create triangle fragments
            const frags = shape.shatter();
            frags.forEach(f => { this.scene.add(f.mesh); this.fragments.push(f); });

            // Explosion particles
            this.particles.emitExplosion(pos.x, pos.y, pos.z, { r: c.r, g: c.g, b: c.b });

            // Remove from list
            this.shapes = this.shapes.filter(s => s !== shape);
            return pos;
        }

        /* ============================================================
           Paint trail
           ============================================================ */
        emitPaintTrail(worldPos, color) {
            this.particles.emitTrail(worldPos.x, worldPos.y, worldPos.z, color);
        }

        /* ============================================================
           Per-frame update & render
           ============================================================ */
        update() {
            const dt      = this.clock.getDelta();
            const elapsed = this.clock.getElapsedTime();

            /* Shapes */
            for (let i = this.shapes.length - 1; i >= 0; i--) {
                this.shapes[i].update(elapsed, dt);
                if (this.shapes[i].isDead) this.shapes.splice(i, 1);
            }

            /* Fragments */
            for (let i = this.fragments.length - 1; i >= 0; i--) {
                const f = this.fragments[i];
                f.life -= dt;
                if (f.life <= 0) {
                    this.scene.remove(f.mesh);
                    f.mesh.geometry.dispose();
                    f.mesh.material.dispose();
                    this.fragments.splice(i, 1);
                    continue;
                }
                f.mesh.position.add(f.velocity);
                f.mesh.rotation.x += f.rotVel.x;
                f.mesh.rotation.y += f.rotVel.y;
                f.mesh.rotation.z += f.rotVel.z;
                f.velocity.y -= 0.0012;
                f.mesh.material.opacity = Math.max(0, f.life / 1.8);
            }

            /* Particles */
            this.particles.update(dt);
            this.ambientParticles.update();

            /* Render */
            this.renderer.render(this.scene, this.camera);
        }

        /* ---- Resize ---- */
        _onResize() {
            const w = window.innerWidth, h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        }

        /* ---- Cleanup ---- */
        clearAll() {
            this.shapes.forEach(s => s.destroy());
            this.shapes = [];
            this.fragments.forEach(f => {
                this.scene.remove(f.mesh);
                f.mesh.geometry.dispose();
                f.mesh.material.dispose();
            });
            this.fragments = [];
            this.particles.clear();
        }
    }

    HOLO.HoloScene = HoloScene;
})();
