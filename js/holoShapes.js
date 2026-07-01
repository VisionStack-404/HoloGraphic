/* ===================================================
   HoloGraphic — Holographic Shape System
   Custom GLSL shaders for the signature hologram look
   =================================================== */
(function () {
    'use strict';
    window.HOLO = window.HOLO || {};

    /* ---- GLSL Shaders ---- */

    const HOLO_VS = `
        uniform float uTime;
        uniform float uGlitchIntensity;

        varying vec3  vNormal;
        varying vec3  vViewPos;
        varying vec2  vUv;
        varying float vFresnel;

        void main(){
            vUv     = uv;
            vNormal = normalize(normalMatrix * normal);

            vec3 pos = position;

            // Glitch scan-line displacement
            float glitchLine = step(0.96, sin(uTime * 14.0 + pos.y * 28.0));
            pos.x += glitchLine * uGlitchIntensity * 0.09 * sin(uTime * 45.0);

            // Gentle vertex wobble
            pos += normal * sin(uTime * 2.0 + pos.y * 5.0) * 0.012;

            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            vViewPos = -mv.xyz;

            vec3 viewDir = normalize(vViewPos);
            vFresnel = 1.0 - abs(dot(viewDir, vNormal));

            gl_Position = projectionMatrix * mv;
        }
    `;

    const HOLO_FS = `
        uniform float uTime;
        uniform vec3  uColor;
        uniform float uOpacity;
        uniform float uScanlineIntensity;
        uniform float uInteracting;

        varying vec3  vNormal;
        varying vec3  vViewPos;
        varying vec2  vUv;
        varying float vFresnel;

        void main(){
            // Fresnel rim
            float fPow = pow(vFresnel, 2.5);
            vec3  rim  = uColor * 2.5;

            // Scanlines
            float scan = sin(vUv.y * 140.0 + uTime * 3.0) * 0.5 + 0.5;
            scan = pow(scan, 6.0) * uScanlineIntensity;

            // Interference band
            float intf = sin(vUv.y * 450.0 + uTime * 8.0) * 0.018;

            // Interaction highlight
            vec3 base = uColor;
            base = mix(base, base * 1.6, uInteracting * (sin(uTime * 5.0) * 0.5 + 0.5));

            // Combine
            vec3 col = mix(base * 0.55, rim, fPow);
            col += scan * base * 0.35;
            col += intf;

            // Flicker
            float flick = 0.94 + 0.06 * sin(uTime * 22.0 + 2.7);

            float alpha = clamp((0.22 + fPow * 0.78) * uOpacity * flick, 0.0, 1.0);

            gl_FragColor = vec4(col, alpha);
        }
    `;

    const WIRE_VS = `
        void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `;
    const WIRE_FS = `
        uniform float uTime;
        uniform vec3  uColor;
        uniform float uOpacity;
        void main(){
            float a = uOpacity * (0.25 + 0.08 * sin(uTime * 2.0));
            gl_FragColor = vec4(uColor, a);
        }
    `;

    /* ---- Shape catalogue ---- */
    const SHAPE_TYPES = ['icosahedron', 'torus', 'torusKnot', 'octahedron', 'dodecahedron'];
    const NEON_COLORS = [
        new THREE.Color(0x00f0ff),
        new THREE.Color(0xff00ff),
        new THREE.Color(0x39ff14),
        new THREE.Color(0xff0099),
        new THREE.Color(0xffaa00),
        new THREE.Color(0x4d4dff),
        new THREE.Color(0xff3300)
    ];

    function _makeGeo(type, sz) {
        sz = sz || 0.8;
        switch (type) {
            case 'torus':        return new THREE.TorusGeometry(sz * 0.75, sz * 0.28, 16, 32);
            case 'torusKnot':    return new THREE.TorusKnotGeometry(sz * 0.55, sz * 0.18, 64, 16);
            case 'octahedron':   return new THREE.OctahedronGeometry(sz, 1);
            case 'dodecahedron': return new THREE.DodecahedronGeometry(sz, 0);
            case 'icosahedron':
            default:             return new THREE.IcosahedronGeometry(sz, 1);
        }
    }

    /* ============================================================
       HoloShape — a single holographic object in the scene
       ============================================================ */
    class HoloShape {
        constructor(scene, opts) {
            opts = opts || {};
            this.scene = scene;
            this.id    = Math.random().toString(36).slice(2, 11);

            const type = opts.type || SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
            const col  = opts.color || NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
            const sz   = opts.size  || 0.55 + Math.random() * 0.4;

            this.color = col;
            this.size  = sz;
            this.type  = type;

            /* Group */
            this.group = new THREE.Group();
            this.group.position.set(opts.x || 0, opts.y || 0, opts.z || 0);

            /* Holographic solid material */
            this.solidMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:              { value: 0 },
                    uColor:             { value: col.clone() },
                    uOpacity:           { value: 1.0 },
                    uScanlineIntensity: { value: 0.8 },
                    uGlitchIntensity:   { value: 0.3 },
                    uInteracting:       { value: 0.0 }
                },
                vertexShader:   HOLO_VS,
                fragmentShader: HOLO_FS,
                transparent: true,
                blending:    THREE.AdditiveBlending,
                side:        THREE.DoubleSide,
                depthWrite:  false
            });

            const geo = _makeGeo(type, sz);
            this.solidMesh = new THREE.Mesh(geo, this.solidMat);
            this.group.add(this.solidMesh);

            /* Wireframe overlay */
            this.wireMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:    { value: 0 },
                    uColor:   { value: new THREE.Color(0xffffff) },
                    uOpacity: { value: 0.18 }
                },
                vertexShader:   WIRE_VS,
                fragmentShader: WIRE_FS,
                transparent: true,
                wireframe:   true,
                blending:    THREE.AdditiveBlending,
                depthWrite:  false
            });
            this.wireMesh = new THREE.Mesh(geo.clone(), this.wireMat);
            this.group.add(this.wireMesh);

            /* State */
            this.state         = 'spawning';
            this.spawnStart    = performance.now();
            this.spawnDuration = 600;
            this.age           = 0;
            this.grabbed       = false;
            this.floatOff      = Math.random() * Math.PI * 2;
            this.rotSpeed      = {
                x: (Math.random() - 0.5) * 0.018,
                y: (Math.random() - 0.5) * 0.018 + 0.01,
                z: (Math.random() - 0.5) * 0.005
            };

            /* Start tiny for spawn animation */
            this.group.scale.set(0.01, 0.01, 0.01);
            scene.add(this.group);
        }

        /* — Per-frame — */
        update(time, dt) {
            this.age += dt;
            this.solidMat.uniforms.uTime.value = time;
            this.wireMat.uniforms.uTime.value  = time;

            /* Spawn elastic scale-up */
            if (this.state === 'spawning') {
                const p = Math.min((performance.now() - this.spawnStart) / this.spawnDuration, 1);
                const t = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) * Math.cos((p * 10 - 0.75) * (2 * Math.PI / 3));
                this.group.scale.setScalar(t);
                if (p >= 1) this.state = 'idle';
            }

            /* Idle float + rotate */
            if (this.state === 'idle') {
                this.group.rotation.x += this.rotSpeed.x;
                this.group.rotation.y += this.rotSpeed.y;
                this.group.rotation.z += this.rotSpeed.z;
                this.group.position.y += Math.sin(time * 1.4 + this.floatOff) * 0.0018;
            }

            /* Interaction highlight */
            if (this.state === 'grabbed') {
                this.group.rotation.y += 0.03;
                this.solidMat.uniforms.uInteracting.value   = 1.0;
                this.solidMat.uniforms.uGlitchIntensity.value = 0.55;
            } else {
                this.solidMat.uniforms.uInteracting.value     = 0.0;
                this.solidMat.uniforms.uGlitchIntensity.value = 0.3;
            }
        }

        /* — Interaction helpers — */
        moveTo(x, y, z) {
            this.group.position.lerp(new THREE.Vector3(x, y, z), 0.28);
        }
        grab()    { this.state = 'grabbed'; this.grabbed = true; }
        release() { this.state = 'idle';    this.grabbed = false; }

        getPosition()      { return this.group.position.clone(); }
        getWorldPosition() { const v = new THREE.Vector3(); this.group.getWorldPosition(v); return v; }
        getBoundingSphere() { return this.size * this.group.scale.x; }
        isNear(wp, thr)    { return this.getWorldPosition().distanceTo(wp) < (this.getBoundingSphere() + (thr || 0.5)); }

        /* — Shatter into triangle fragments — */
        shatter() {
            if (this.state === 'shattering' || this.state === 'dead') return [];
            this.state = 'shattering';

            const frags = [];
            const geo     = this.solidMesh.geometry;
            const posAttr = geo.getAttribute('position');
            const indices = geo.index ? geo.index.array : null;
            const triCnt  = indices ? indices.length / 3 : posAttr.count / 3;
            const maxF    = Math.min(triCnt, 35);
            const step    = Math.max(1, Math.floor(triCnt / maxF));

            for (let t = 0; t < triCnt; t += step) {
                const verts = new Float32Array(9);
                for (let v = 0; v < 3; v++) {
                    const idx = indices ? indices[t * 3 + v] : t * 3 + v;
                    verts[v * 3]     = posAttr.getX(idx);
                    verts[v * 3 + 1] = posAttr.getY(idx);
                    verts[v * 3 + 2] = posAttr.getZ(idx);
                }

                const fg = new THREE.BufferGeometry();
                fg.setAttribute('position', new THREE.BufferAttribute(verts, 3));
                fg.computeVertexNormals();

                const fm = new THREE.MeshBasicMaterial({
                    color: this.color,
                    transparent: true, opacity: 0.8,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const mesh = new THREE.Mesh(fg, fm);
                mesh.position.copy(this.group.position);
                mesh.rotation.copy(this.group.rotation);
                mesh.scale.copy(this.group.scale);

                const cx = (verts[0] + verts[3] + verts[6]) / 3;
                const cy = (verts[1] + verts[4] + verts[7]) / 3;
                const cz = (verts[2] + verts[5] + verts[8]) / 3;

                frags.push({
                    mesh,
                    velocity: new THREE.Vector3(
                        cx * 0.055 + (Math.random() - 0.5) * 0.03,
                        cy * 0.055 + (Math.random() - 0.5) * 0.03 + 0.02,
                        cz * 0.055 + (Math.random() - 0.5) * 0.03
                    ),
                    rotVel: new THREE.Vector3(
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    ),
                    life: 1.4 + Math.random() * 0.5
                });
            }

            this.destroy();
            return frags;
        }

        /* — Cleanup — */
        destroy() {
            this.state = 'dead';
            this.scene.remove(this.group);
            this.solidMesh.geometry.dispose();
            this.solidMat.dispose();
            this.wireMesh.geometry.dispose();
            this.wireMat.dispose();
        }

        get isDead() { return this.state === 'dead'; }
    }

    /* ---- Exports ---- */
    HOLO.HoloShape   = HoloShape;
    HOLO.SHAPE_TYPES = SHAPE_TYPES;
    HOLO.NEON_COLORS = NEON_COLORS;
})();
