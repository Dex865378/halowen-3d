import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

class HalloweenScene {
    constructor() {
        this.canvas = document.querySelector('#three-canvas');
        this.scene = new THREE.Scene();
        this.loadingManager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.loadingManager);

        this.items = [];
        this.mixers = [];
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.shakeTime = 0;

        this.init();
    }

    init() {
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.maxDistance = 25;
        this.controls.minDistance = 5;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;

        // Fog
        this.scene.fog = new THREE.FogExp2('#0a0a14', 0.05);

        this.setupLights();
        this.createEnvironment();
        this.createMoon();
        this.createTrees();
        this.createBats();
        this.createRain();
        this.createLeaves();
        this.loadModels();
        this.setupEventListeners();
        this.setupAudio();
        this.setupPostProcessing();
        this.animate();

        // Progress
        this.loadingManager.onProgress = (url, loaded, total) => {
            const p = (loaded / total) * 100;
            document.getElementById('progress-bar').style.width = `${p}%`;
            document.getElementById('loader-text').innerText = `Invocando espíritus 3D... ${Math.round(p)}%`;
        };

        this.loadingManager.onLoad = () => {
            const text = document.getElementById('loader-text');
            text.innerText = 'Ritual completado. Entrando en el abismo...';
            text.style.color = '#ff4d00';
            setTimeout(() => {
                const loader = document.getElementById('loader');
                loader.classList.add('open');
                setTimeout(() => loader.style.display = 'none', 2000);
            }, 1000);
        };
    }

    setupLights() {
        this.lightningLight = new THREE.DirectionalLight('#ffffff', 0);
        this.scene.add(this.lightningLight);

        const ambient = new THREE.AmbientLight('#1a0b2e', 0.4);
        this.scene.add(ambient);

        this.pumpkinLight = new THREE.PointLight('#ff4d00', 10, 15);
        this.pumpkinLight.position.set(-4, 1.5, 1);
        this.scene.add(this.pumpkinLight);

        this.mouseLight = new THREE.PointLight('#ffffff', 0, 10);
        this.scene.add(this.mouseLight);
    }

    createEnvironment() {
        const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
        const verts = groundGeo.attributes.position.array;
        for (let i = 0; i < verts.length; i += 3) verts[i + 2] = Math.random() * 0.2;

        const groundMat = new THREE.MeshStandardMaterial({ color: '#020205', roughness: 0.9, flatShading: true });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // Fog Particles
        this.fogParticles = new THREE.Group();
        const fGeo = new THREE.SphereGeometry(1, 6, 6);
        const fMat = new THREE.MeshBasicMaterial({ color: '#3a2065', transparent: true, opacity: 0.08 });
        for (let i = 0; i < 60; i++) {
            const p = new THREE.Mesh(fGeo, fMat);
            p.position.set((Math.random() - 0.5) * 40, Math.random() * 2, (Math.random() - 0.5) * 40);
            p.scale.setScalar(Math.random() * 4 + 2);
            this.fogParticles.add(p);
        }
        this.scene.add(this.fogParticles);

        // Embers
        const eGeo = new THREE.BufferGeometry();
        const ePos = new Float32Array(100 * 3);
        for (let i = 0; i < 300; i++) ePos[i] = (Math.random() - 0.5) * 40;
        eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
        const eMat = new THREE.PointsMaterial({ size: 0.1, color: '#ff6600', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        this.embers = new THREE.Points(eGeo, eMat);
        this.scene.add(this.embers);
    }

    createMoon() {
        const mGeo = new THREE.SphereGeometry(2, 32, 32);
        this.moonMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
        this.moon = new THREE.Mesh(mGeo, this.moonMat);
        this.moon.position.set(15, 15, -20);
        this.scene.add(this.moon);
        const gGeo = new THREE.SphereGeometry(2.5, 32, 32);
        const gMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1 });
        this.moon.add(new THREE.Mesh(gGeo, gMat));
    }

    createTrees() {
        const tGroup = new THREE.Group();
        const tMat = new THREE.MeshBasicMaterial({ color: '#000000' });
        for (let i = 0; i < 15; i++) {
            const h = Math.random() * 5 + 5;
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, h, 6), tMat);
            const a = Math.random() * Math.PI * 2;
            const d = 15 + Math.random() * 10;
            t.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d);
            tGroup.add(t);
        }
        this.scene.add(tGroup);
    }

    createBats() {
        this.bats = new THREE.Group();
        const bGeo = new THREE.PlaneGeometry(0.5, 0.2);
        const bMat = new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.DoubleSide });
        for (let i = 0; i < 20; i++) {
            const b = new THREE.Mesh(bGeo, bMat);
            b.position.set((Math.random() - 0.5) * 40, 10 + Math.random() * 10, (Math.random() - 0.5) * 40);
            b.userData = { speed: Math.random() * 0.1 + 0.05, angle: Math.random() * Math.PI * 2 };
            this.bats.add(b);
        }
        this.scene.add(this.bats);
    }

    createRain() {
        const rGeo = new THREE.BufferGeometry();
        const rPos = new Float32Array(1000 * 3);
        for (let i = 0; i < 3000; i++) rPos[i] = (Math.random() - 0.5) * 40;
        rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
        this.rain = new THREE.Points(rGeo, new THREE.PointsMaterial({ color: '#aaaaff', size: 0.05, transparent: true, opacity: 0.05 }));
        this.scene.add(this.rain);
    }

    createLeaves() {
        const lGeo = new THREE.PlaneGeometry(0.2, 0.2);
        const lMat = new THREE.MeshStandardMaterial({ color: '#4a2c10', side: THREE.DoubleSide, roughness: 1 });
        this.leaves = new THREE.Group();
        for (let i = 0; i < 40; i++) {
            const l = new THREE.Mesh(lGeo, lMat);
            l.position.set((Math.random() - 0.5) * 40, 5 + Math.random() * 10, (Math.random() - 0.5) * 40);
            l.userData = { sy: Math.random() * 0.02 + 0.01, sr: Math.random() * 0.02 };
            this.leaves.add(l);
        }
        this.scene.add(this.leaves);
    }

    setupPostProcessing() {
        const rPass = new RenderPass(this.scene, this.camera);
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.3, 0.9);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(rPass);
        this.composer.addPass(this.bloomPass);
    }

    setupAudio() {
        this.audioCtx = THREE.AudioContext.getContext();
        document.body.addEventListener('click', () => { if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); }, { once: true });
    }

    triggerLightning() {
        if (!this.lightningLight) return;
        this.lightningLight.intensity = 15;
        this.shakeTime = 0.5;
        if (this.rain) this.rain.material.opacity = 0.4;

        const buf = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 2, this.audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 5000);
        const s = this.audioCtx.createBufferSource();
        s.buffer = buf;
        const g = this.audioCtx.createGain();
        g.gain.value = 0.1;
        s.connect(g);
        g.connect(this.audioCtx.destination);
        s.start();

        setTimeout(() => { this.lightningLight.intensity = 0; if (this.rain) this.rain.material.opacity = 0.05; }, 100);
        setTimeout(() => { this.lightningLight.intensity = 10; }, 150);
        setTimeout(() => { this.lightningLight.intensity = 0; }, 250);
    }

    loadModels() {
        const assets = [
            { url: 'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/pumpkin/model.gltf', pos: { x: -4, y: 0, z: 1 }, s: 1.5, n: 'Calabaza de Fuego', d: 'Una calabaza que guía a las almas.' },
            { url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb', pos: { x: 4, y: 0, z: -2 }, s: 1, n: 'Centinela Espectral', d: 'Un guardián poseído que vigila el perímetro.' },
            { url: 'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/cauldron/model.gltf', pos: { x: 0, y: 0, z: -5 }, s: 2, n: 'Caldero de Almas', d: 'Donde se cocinan pociones prohibidas.' },
            { url: 'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/ghost/model.gltf', pos: { x: 6, y: 1.5, z: 2 }, s: 1.5, n: 'Espíritu Errante', d: 'Un fantasma que busca algo que perdió hace siglos.' },
            { url: 'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/tombstone/model.gltf', pos: { x: -6, y: 0, z: -3 }, s: 1.8, n: 'Lápida del Olvido', d: 'Aquí yace alguien cuyo nombre ha sido borrado por el tiempo.' },
            { url: 'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/skull/model.gltf', pos: { x: -2, y: 0.2, z: 4 }, s: 1.2, n: 'Calavera Susurrante', d: 'Si te acercas lo suficiente, podrás oír sus secretos antiguos.' }
        ];
        assets.forEach(a => {
            this.loader.load(a.url, (gltf) => {
                const m = gltf.scene;
                m.position.set(a.pos.x, a.pos.y, a.pos.z);
                m.scale.set(a.s, a.s, a.s);
                m.traverse(c => { if (c.isMesh) c.userData = { name: a.n, description: a.d, isHalloweenItem: true }; });
                if (gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(m);
                    mixer.clipAction(gltf.animations[0]).play();
                    this.mixers.push(mixer);
                }
                this.scene.add(m);
                this.items.push(m);
            });
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
        });
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const interacts = this.raycaster.intersectObjects(this.scene.children, true).filter(i => i.object.userData.isHalloweenItem);
            if (interacts.length > 0) {
                const obj = interacts[0].object;
                if (this.hoveredObject !== obj) {
                    this.hoveredObject = obj;
                    const info = document.getElementById('object-info');
                    document.getElementById('object-name').innerText = obj.userData.name;
                    document.getElementById('object-desc').innerText = obj.userData.description;
                    info.style.animation = 'none';
                    info.offsetHeight;
                    info.style.animation = 'glitch 0.5s ease-out';
                    info.classList.remove('hidden');
                }
            } else if (this.hoveredObject) {
                this.hoveredObject = null;
                document.getElementById('object-info').classList.add('hidden');
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        const time = Date.now() * 0.001;
        const delta = this.clock.getDelta();
        this.mixers.forEach(m => m.update(delta));

        if (this.shakeTime > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeTime;
            this.camera.position.z += (Math.random() - 0.5) * this.shakeTime;
            this.shakeTime -= 0.02;
        } else {
            this.camera.position.y += Math.sin(time * 0.5) * 0.005;
        }

        if (Math.random() > 0.997) this.triggerLightning();
        if (this.moonMat) {
            const s = (Math.sin(time * 0.1) + 1) / 2;
            this.moonMat.color.setHSL(0, s, 0.5 + s * 0.5);
            this.scene.fog.color.setHSL(0.7, 0.3, 0.02 + s * 0.01);
        }
        if (this.pumpkinLight) this.pumpkinLight.intensity = 8 + Math.sin(time * 10) * 2 + Math.random() * 2;
        if (this.mouseLight) {
            this.mouseLight.position.copy(this.camera.position);
            this.mouseLight.position.add(this.raycaster.ray.direction.multiplyScalar(2));
            this.mouseLight.intensity = 0.5 * (Math.random() > 0.98 ? 0.2 : 1);
        }
        if (this.fogParticles) this.fogParticles.children.forEach((p, i) => { p.position.y += Math.sin(time + i) * 0.002; p.material.opacity = 0.05 + Math.sin(time * 0.5 + i) * 0.05; });
        if (this.leaves) this.leaves.children.forEach(l => { l.position.y -= l.userData.sy; l.rotation.x += l.userData.sr; if (l.position.y < 0) l.position.y = 15; });
        if (this.bats) this.bats.children.forEach(b => { b.userData.angle += 0.02; b.position.x += Math.cos(b.userData.angle) * b.userData.speed; b.position.z += Math.sin(b.userData.angle) * b.userData.speed; b.scale.x = Math.sin(time * 20) > 0 ? 1 : 0.5; });
        if (this.rain) {
            const p = this.rain.geometry.attributes.position.array;
            for (let i = 1; i < p.length; i += 3) { p[i] -= 0.5; if (p[i] < 0) p[i] = 20; }
            this.rain.geometry.attributes.position.needsUpdate = true;
        }
        this.items.forEach((item, i) => { item.position.y += Math.sin(time + i) * 0.003; });

        if (this.composer) this.composer.render();
        else this.renderer.render(this.scene, this.camera);
    }
}

new HalloweenScene();
