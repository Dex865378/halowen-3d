import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class HalloweenScene {
    constructor() {
        this.canvas = document.querySelector('#three-canvas');
        this.scene = new THREE.Scene();
        this.loadingManager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.loadingManager);

        this.items = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;

        this.init();
    }

    init() {
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.maxDistance = 25;
        this.controls.minDistance = 5;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;

        // Fog & Scene Background
        this.scene.fog = new THREE.FogExp2('#0a0a14', 0.05);

        this.setupLights();
        this.createEnvironment();
        this.loadModels();
        this.setupEventListeners();
        this.animate();

        // Loading Progress
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            document.getElementById('progress-bar').style.width = `${progress}%`;
            document.getElementById('loader-text').innerText = `Invocando espíritus 3D... ${Math.round(progress)}%`;
        };

        this.loadingManager.onLoad = () => {
            document.getElementById('progress-bar').style.width = '100%';
            document.getElementById('loader-text').innerText = 'Ritual completado. Entrando en el abismo...';

            setTimeout(() => {
                const loader = document.getElementById('loader');
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, 800);
        };
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight('#1a0b2e', 0.3); // Deep purple ambient
        this.scene.add(ambientLight);

        // Moon light (Blue-ish)
        const moonLight = new THREE.DirectionalLight('#4b5563', 0.5);
        moonLight.position.set(5, 10, 5);
        this.scene.add(moonLight);

        // The "Pumpkin Flame" - Flickering Point Light
        this.pumpkinLight = new THREE.PointLight('#ff4d00', 10, 15);
        this.pumpkinLight.position.set(-4, 1.5, 1);
        this.scene.add(this.pumpkinLight);

        // Subtle mouse light (Flashlight effect)
        this.mouseLight = new THREE.PointLight('#ffffff', 0, 10);
        this.scene.add(this.mouseLight);
    }

    createEnvironment() {
        // Advanced "Spooky" Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);

        // Add random height to the ground for a rough terrain look
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 0.2;
        }

        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#020205',
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Fog Particles (Heavier at floor level)
        this.fogParticles = new THREE.Group();
        const fogGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const fogMat = new THREE.MeshBasicMaterial({
            color: '#4a3075',
            transparent: true,
            opacity: 0.1
        });

        for (let i = 0; i < 200; i++) {
            const particle = new THREE.Mesh(fogGeo, fogMat);
            particle.position.set(
                (Math.random() - 0.5) * 40,
                Math.random() * 2,
                (Math.random() - 0.5) * 40
            );
            particle.scale.setScalar(Math.random() * 2 + 1);
            this.fogParticles.add(particle);
        }
        this.scene.add(this.fogParticles);

        // Fireflies / Floating Embers
        const embersGeo = new THREE.BufferGeometry();
        const embersCount = 300;
        const embersPos = new Float32Array(embersCount * 3);
        for (let i = 0; i < embersCount * 3; i++) {
            embersPos[i] = (Math.random() - 0.5) * 50;
        }
        embersGeo.setAttribute('position', new THREE.BufferAttribute(embersPos, 3));
        const embersMat = new THREE.PointsMaterial({
            size: 0.08,
            color: '#ff6600',
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.embers = new THREE.Points(embersGeo, embersMat);
        this.scene.add(this.embers);
    }

    loadModels() {
        // Pumpkin
        this.loadObject(
            'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/pumpkin/model.gltf', // Better source
            { x: -4, y: 0, z: 1 }, 1.5,
            'Calabaza de Fuego',
            'Una calabaza tallada que brilla con una luz espectral en su interior. Dicen que guía a las almas perdidas.'
        );

        // Ghost
        this.loadObject(
            'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb', // Fallback for ghost if one is missing
            { x: 4, y: 0, z: -2 }, 1,
            'Centinela Espectral',
            'Un guardián de metal que ha sido poseído por una inteligencia del más allá. Vigila el perímetro sin descanso.'
        );

        // Cauldron / Pot
        this.loadObject(
            'https://raw.githubusercontent.com/pmndrs/market-assets/master/objects/cauldron/model.gltf',
            { x: 0, y: 0, z: -5 }, 2,
            'Caldero de Almas',
            'Un recipiente donde se cocinan pociones prohibidas. El humo que desprende puede alterar la realidad misma.'
        );
    }

    loadObject(url, pos, scale, name, description) {
        this.loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.position.set(pos.x, pos.y, pos.z);
            model.scale.set(scale, scale, scale);

            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Tag the child so we know what it belongs to
                    child.userData = { name, description, isHalloweenItem: true };
                }
            });

            this.scene.add(model);
            this.items.push(model);
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Check for intersections
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const halloweenIntersects = intersects.filter(i => i.object.userData.isHalloweenItem);

        if (halloweenIntersects.length > 0) {
            const topObject = halloweenIntersects[0].object;
            if (this.hoveredObject !== topObject) {
                this.hoveredObject = topObject;
                this.showObjectInfo(topObject.userData);
            }
        } else {
            if (this.hoveredObject) {
                this.hoveredObject = null;
                this.hideObjectInfo();
            }
        }
    }

    showObjectInfo(data) {
        const info = document.getElementById('object-info');
        document.getElementById('object-name').innerText = data.name;
        document.getElementById('object-desc').innerText = data.description;
        info.classList.remove('hidden');
    }

    hideObjectInfo() {
        document.getElementById('object-info').classList.add('hidden');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        const time = Date.now() * 0.001;

        // Flickering Pumpkin Light
        if (this.pumpkinLight) {
            this.pumpkinLight.intensity = 8 + Math.sin(time * 10) * 2 + Math.random() * 2;
        }

        // Mouse "Flashlight" follow
        if (this.mouseLight) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            this.mouseLight.position.copy(this.camera.position);
            this.mouseLight.position.add(this.raycaster.ray.direction.multiplyScalar(2));
            this.mouseLight.intensity = 0.5;
        }

        // Animate Fog
        if (this.fogParticles) {
            this.fogParticles.children.forEach((p, i) => {
                p.position.y += Math.sin(time + i) * 0.002;
                p.rotation.y += 0.01;
            });
        }

        // Animate Embers
        if (this.embers) {
            this.embers.rotation.y += 0.001;
            this.embers.position.y = Math.sin(time * 0.5) * 0.5;
        }

        // Subtle floating animation for items
        this.items.forEach((item, index) => {
            item.position.y += Math.sin(time + index) * 0.003;
            item.rotation.y += 0.002;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

new HalloweenScene();
