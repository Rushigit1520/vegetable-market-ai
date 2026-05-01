/* ===================================================
   Vegetable Market AI — 3D Background Scene (God Mode)
   Cinematic particles + bloom-like glow + parallax camera
   =================================================== */

let scene, camera, renderer;
let particles = [];
let mouseX = 0, mouseY = 0;

function initThreeScene() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f16, 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;
  camera.position.y = 5;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Lighting — multi-color for cinematic feel
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const greenLight = new THREE.PointLight(0x00ff88, 3, 60);
  greenLight.position.set(-10, 10, 15);
  scene.add(greenLight);

  const purpleLight = new THREE.PointLight(0xbf00ff, 2, 50);
  purpleLight.position.set(15, -5, 10);
  scene.add(purpleLight);

  const blueLight = new THREE.PointLight(0x3b82f6, 1.5, 40);
  blueLight.position.set(0, 15, -10);
  scene.add(blueLight);

  // Create particles
  createGlowParticles();
  createFloatingOrbs();

  // Events
  window.addEventListener('resize', onResize);
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  animate();
}

function createGlowParticles() {
  // Luminous dust particles
  const count = 150;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    sizes[i] = Math.random() * 3 + 0.5;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0x00ff88,
    size: 0.3,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  particles.push({ mesh: points, type: 'dust' });

  // Second layer — purple dust
  const mat2 = new THREE.PointsMaterial({
    color: 0xbf00ff,
    size: 0.2,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const positions2 = new Float32Array(80 * 3);
  for (let i = 0; i < 80; i++) {
    positions2[i * 3] = (Math.random() - 0.5) * 70;
    positions2[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions2[i * 3 + 2] = (Math.random() - 0.5) * 35;
  }
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
  const points2 = new THREE.Points(geo2, mat2);
  scene.add(points2);
  particles.push({ mesh: points2, type: 'dust' });
}

function createFloatingOrbs() {
  // Glowing translucent orbs
  const orbColors = [0x00ff88, 0xbf00ff, 0x3b82f6, 0xffd700, 0x00ff88];

  for (let i = 0; i < 12; i++) {
    const radius = 0.3 + Math.random() * 0.8;
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: orbColors[i % orbColors.length],
      transparent: true,
      opacity: 0.15 + Math.random() * 0.1,
      emissive: orbColors[i % orbColors.length],
      emissiveIntensity: 0.3,
      shininess: 100,
    });

    const orb = new THREE.Mesh(geo, mat);
    orb.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20
    );

    orb.userData = {
      baseY: orb.position.y,
      baseX: orb.position.x,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    };

    scene.add(orb);
    particles.push({ mesh: orb, type: 'orb' });
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Animate particles
  particles.forEach((p) => {
    if (p.type === 'dust') {
      p.mesh.rotation.y = t * 0.02;
      p.mesh.rotation.x = t * 0.01;
    } else if (p.type === 'orb') {
      const d = p.mesh.userData;
      p.mesh.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * 2;
      p.mesh.position.x = d.baseX + Math.cos(t * d.speed * 0.7 + d.phase) * 1.5;
      p.mesh.rotation.y = t * 0.5;
    }
  });

  // Parallax camera
  camera.position.x += (mouseX * 8 - camera.position.x) * 0.02;
  camera.position.y += (-mouseY * 6 + 5 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

// Init on load
window.addEventListener('DOMContentLoaded', initThreeScene);
