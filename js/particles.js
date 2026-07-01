/* ===================================================
   HoloGraphic — GPU Particle Systems
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    /* -------------------------------------------------------
       ParticleSystem — dynamic effects (trails, explosions)
       ------------------------------------------------------- */
    class ParticleSystem {
        constructor(scene, maxParticles) {
            this.scene = scene;
            this.max   = maxParticles || 6000;
            this.pool  = [];           // live particle objects

            // Typed arrays
            this.pos    = new Float32Array(this.max * 3);
            this.col    = new Float32Array(this.max * 4);
            this.sizes  = new Float32Array(this.max);

            // Geometry
            this.geo = new THREE.BufferGeometry();
            this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
            this.geo.setAttribute('color',    new THREE.BufferAttribute(this.col, 4));
            this.geo.setAttribute('size',     new THREE.BufferAttribute(this.sizes, 1));

            // Shader
            const vs = `
                attribute float size;
                attribute vec4  color;
                varying   vec4  vColor;
                void main(){
                    vColor = color;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (280.0 / -mv.z);
                    gl_Position  = projectionMatrix * mv;
                }`;
            const fs = `
                varying vec4 vColor;
                void main(){
                    float d = length(gl_PointCoord - vec2(0.5));
                    if(d > 0.5) discard;
                    float a = 1.0 - smoothstep(0.15, 0.5, d);
                    gl_FragColor = vec4(vColor.rgb, vColor.a * a);
                }`;

            this.mat = new THREE.ShaderMaterial({
                vertexShader:   vs,
                fragmentShader: fs,
                transparent:  true,
                blending:     THREE.AdditiveBlending,
                depthWrite:   false
            });

            this.points = new THREE.Points(this.geo, this.mat);
            scene.add(this.points);
            this.active = 0;
        }

        /* — Emit N particles with options — */
        emit(o) {
            const {
                x = 0, y = 0, z = 0,
                count = 10,
                color = { r: 0, g: 0.94, b: 1 },
                speed = 0.02, spread = 1,
                life  = 1.5,  size   = 0.15,
                gravity = 0
            } = o;

            for (let i = 0; i < count; i++) {
                if (this.pool.length >= this.max) this.pool.shift();

                const a1  = Math.random() * Math.PI * 2;
                const a2  = Math.random() * Math.PI - Math.PI / 2;
                const spd = speed * (0.4 + Math.random() * 0.6);

                this.pool.push({
                    x: x + (Math.random() - 0.5) * 0.08,
                    y: y + (Math.random() - 0.5) * 0.08,
                    z: z + (Math.random() - 0.5) * 0.08,
                    vx: Math.cos(a1) * Math.cos(a2) * spd * spread,
                    vy: Math.sin(a2) * spd * spread,
                    vz: Math.sin(a1) * Math.cos(a2) * spd * spread,
                    life:    life * (0.6 + Math.random() * 0.4),
                    maxLife: life,
                    r: color.r, g: color.g, b: color.b,
                    size: size * (0.5 + Math.random() * 0.5),
                    gravity
                });
            }
        }

        /* — Convenience emitters — */
        emitTrail(x, y, z, c) {
            this.emit({ x, y, z, count: 3, color: c, speed: 0.004, spread: 0.4, life: 1.2, size: 0.10 });
        }
        emitExplosion(x, y, z, c) {
            this.emit({ x, y, z, count: 100, color: c, speed: 0.07, spread: 2.0, life: 1.6, size: 0.22, gravity: -0.0004 });
        }
        emitSpawn(x, y, z, c) {
            this.emit({ x, y, z, count: 40, color: c, speed: 0.035, spread: 1.5, life: 0.9, size: 0.14 });
        }
        emitModeSwitch(x, y, z, c) {
            this.emit({ x, y, z, count: 60, color: c, speed: 0.05, spread: 2.5, life: 1.0, size: 0.16 });
        }

        /* — Per-frame update — */
        update(dt) {
            for (let i = this.pool.length - 1; i >= 0; i--) {
                const p = this.pool[i];
                p.life -= dt;
                if (p.life <= 0) { this.pool.splice(i, 1); continue; }
                p.x  += p.vx;
                p.y  += p.vy;
                p.z  += p.vz;
                p.vy += p.gravity;
                p.vx *= 0.985;
                p.vy *= 0.985;
                p.vz *= 0.985;
            }

            this.active = Math.min(this.pool.length, this.max);

            for (let i = 0; i < this.active; i++) {
                const p  = this.pool[i];
                const lr = p.life / p.maxLife;
                const i3 = i * 3, i4 = i * 4;

                this.pos[i3]     = p.x;
                this.pos[i3 + 1] = p.y;
                this.pos[i3 + 2] = p.z;

                this.col[i4]     = p.r;
                this.col[i4 + 1] = p.g;
                this.col[i4 + 2] = p.b;
                this.col[i4 + 3] = lr;

                this.sizes[i] = p.size * lr;
            }

            // Hide unused
            for (let i = this.active; i < this.max; i++) this.sizes[i] = 0;

            this.geo.attributes.position.needsUpdate = true;
            this.geo.attributes.color.needsUpdate    = true;
            this.geo.attributes.size.needsUpdate     = true;
            this.geo.setDrawRange(0, this.active);
        }

        clear() { this.pool = []; this.active = 0; }
    }

    /* -------------------------------------------------------
       AmbientParticles — always-on floating holographic dust
       ------------------------------------------------------- */
    class AmbientParticles {
        constructor(scene, count) {
            count = count || 180;
            const pos = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);

            this._vel   = [];
            this._count = count;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                pos[i3]     = (Math.random() - 0.5) * 22;
                pos[i3 + 1] = (Math.random() - 0.5) * 16;
                pos[i3 + 2] = (Math.random() - 0.5) * 8 - 3;

                const b = 0.3 + Math.random() * 0.35;
                col[i3]     = b * 0.4;
                col[i3 + 1] = b * 0.85;
                col[i3 + 2] = b;

                this._vel.push({
                    x: (Math.random() - 0.5) * 0.0018,
                    y: (Math.random() - 0.5) * 0.0008 + 0.0004,
                    z: (Math.random() - 0.5) * 0.0008
                });
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

            const mat = new THREE.PointsMaterial({
                vertexColors:    true,
                transparent:     true,
                opacity:         0.35,
                blending:        THREE.AdditiveBlending,
                depthWrite:      false,
                size:            0.045,
                sizeAttenuation: true
            });

            this.points = new THREE.Points(geo, mat);
            scene.add(this.points);
            this._pos = pos;
            this._geo = geo;
        }

        update() {
            for (let i = 0; i < this._count; i++) {
                const i3 = i * 3;
                this._pos[i3]     += this._vel[i].x;
                this._pos[i3 + 1] += this._vel[i].y;
                this._pos[i3 + 2] += this._vel[i].z;

                if (this._pos[i3 + 1] > 9) this._pos[i3 + 1] = -9;
                if (Math.abs(this._pos[i3]) > 13) this._pos[i3] *= -0.95;
            }
            this._geo.attributes.position.needsUpdate = true;
        }
    }

    /* ---- Exports ---- */
    HOLO.ParticleSystem   = ParticleSystem;
    HOLO.AmbientParticles = AmbientParticles;
})();
