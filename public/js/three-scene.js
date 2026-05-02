/* ===================================================
   Vegetable Market AI — Enhanced 3D Background
   =================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  // Scene Setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f16, 0.0015);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- Particles Layer 1 (Stars/Dust) ---
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = window.innerWidth < 768 ? 1000 : 2500;
  const posArray = new Float32Array(particlesCount * 3);
  const colorsArray = new Float32Array(particlesCount * 3);

  const color1 = new THREE.Color(0x00ff88); // Green
  const color2 = new THREE.Color(0xbf00ff); // Purple
  const color3 = new THREE.Color(0x4ade80); // Light Green

  for (let i = 0; i < particlesCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 100;     // x
    posArray[i + 1] = (Math.random() - 0.5) * 100; // y
    posArray[i + 2] = (Math.random() - 0.5) * 80;  // z

    // Mixed colors
    const mixedColor = [color1, color2, color3][Math.floor(Math.random() * 3)];
    colorsArray[i] = mixedColor.r;
    colorsArray[i + 1] = mixedColor.g;
    colorsArray[i + 2] = mixedColor.b;
  }

  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

  // Custom circular particle material
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
  scene.add(particlesMesh);

  // --- Particles Layer 2 (Larger blurred orbs) ---
  const orbGeo = new THREE.BufferGeometry();
  const orbCount = 50;
  const orbPos = new Float32Array(orbCount * 3);
  for (let i = 0; i < orbCount * 3; i++) {
    orbPos[i] = (Math.random() - 0.5) * 60;
  }
  orbGeo.setAttribute("position", new THREE.BufferAttribute(orbPos, 3));
  
  const orbMat = new THREE.PointsMaterial({
    size: 1.5,
    color: 0x00ff88,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  });
  const orbMesh = new THREE.Points(orbGeo, orbMat);
  scene.add(orbMesh);

  // --- Mouse Interactivity ---
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
  });

  // --- Scroll Interactivity ---
  let scrollY = 0;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  });

  // --- Animation Loop ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Smooth mouse follow
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Rotate main particles
    particlesMesh.rotation.y += 0.0005;
    particlesMesh.rotation.x += 0.0002;

    // Rotate orbs in opposite direction
    orbMesh.rotation.y -= 0.0003;
    orbMesh.rotation.z = elapsedTime * 0.05;

    // Mouse parallax effect
    particlesMesh.position.x += (targetX * 5 - particlesMesh.position.x) * 0.05;
    particlesMesh.position.y += (-targetY * 5 - particlesMesh.position.y) * 0.05;
    
    // Scroll parallax effect
    particlesMesh.position.z = scrollY * 0.01;

    // Subtle pulsing of orbs
    orbMat.size = 1.5 + Math.sin(elapsedTime * 2) * 0.5;

    renderer.render(scene, camera);
  }

  animate();

  // --- Resize Handler ---
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
