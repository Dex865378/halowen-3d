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
        const ambientLight = new THREE.AmbientLight('#2b1055', 0.5); // Purple ambient
        this.scene.add(ambientLight);

        const moonLight = new THREE.DirectionalLight('#4b5563', 0.8);
        moonLight.position.set(5, 10, 5);
        moonLight.castShadow = true;
        this.scene.add(moonLight);

        // Orange "Hell" light from bottom
        const bottomLight = new THREE.PointLight('#ff4d00', 5, 20);
        bottomLight.position.set(0, -2, 0);
        this.scene.add(bottomLight);
    }

    createEnvironment() {
        // Dark Ground
        const groundGeometry = new THREE.CircleGeometry(20, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#050505',
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add some random "Spooky" particles
        const particlesGeometry = new THREE.BufferGeometry();
        const count = 500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 40;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: '#8b5cf6',
            transparent: true,
            opacity: 0.6
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(particles);
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

        // Subtle floating animation for items
        const time = Date.now() * 0.001;
        this.items.forEach((item, index) => {
            item.position.y += Math.sin(time + index) * 0.005;
            item.rotation.y += 0.002;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

new HalloweenScene();
