// public/js/three-scene.js
let scene, camera, renderer, raycaster, mouse;
let vegetables = [];
let hoveredObj = null;

function initThreeScene() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f16, 0.02);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;
  camera.position.y = 2;

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);
  
  const pointLight = new THREE.PointLight(0x4ade80, 2, 50);
  pointLight.position.set(0, 5, 10);
  scene.add(pointLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  createVegetables();

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onMouseClick);

  animate();
}

function createVegetables() {
  const loader = new THREE.TextureLoader();
  const textures = {
    tomato: loader.load('/assets/tomato.png'),
    onion: loader.load('/assets/onion.png'),
    potato: loader.load('/assets/potato.png'),
    pepper: loader.load('/assets/pepper.png'),
    carrot: loader.load('/assets/carrot.png')
  };

  const vegTypes = [
    { type: 'tomato', name: 'Organic Tomato' },
    { type: 'onion', name: 'Spanish Onion' },
    { type: 'potato', name: 'Russet Potato' },
    { type: 'pepper', name: 'Purple Pepper' },
    { type: 'carrot', name: 'Farm Carrot' }
  ];

  // Create 30 floating vegetables
  for (let i = 0; i < 30; i++) {
    const config = vegTypes[i % vegTypes.length];
    const material = new THREE.SpriteMaterial({ 
      map: textures[config.type],
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.9
    });

    const sprite = new THREE.Sprite(material);
    
    // Random position
    const radius = 10 + Math.random() * 15;
    const angle = Math.random() * Math.PI * 2;
    sprite.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 15
    );

    // Random size
    const scale = 2 + Math.random() * 3;
    sprite.scale.set(scale, scale, 1);

    sprite.userData = {
      id: `v-${i}`,
      name: config.name,
      baseScale: scale,
      baseY: sprite.position.y,
      floatSpeed: 0.5 + Math.random(),
      rotSpeed: (Math.random() - 0.5) * 0.02
    };

    scene.add(sprite);
    vegetables.push(sprite);
  }

  // Background particles
  for (let i = 0; i < 60; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.4 })
    );
    p.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 30);
    p.userData = { isParticle: true, speed: 0.01 + Math.random() * 0.03 };
    scene.add(p);
    vegetables.push(p);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick() {
  if (hoveredObj && typeof window.openProductModal === 'function') {
    window.openProductModal(hoveredObj.userData);
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  let found = null;
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while(obj.parent && obj.parent.type !== 'Scene') {
      if (obj.parent.userData && obj.parent.userData.id) {
        found = obj.parent;
        break;
      }
      obj = obj.parent;
    }
  }

  if (found) {
    if (hoveredObj !== found) {
      hoveredObj = found;
      document.body.style.cursor = 'pointer';
    }
    const s = 1.2 * (found.userData.baseScale || 1);
    hoveredObj.scale.lerp(new THREE.Vector3(s, s, 1), 0.1);
  } else {
    if (hoveredObj) {
      const s = hoveredObj.userData.baseScale || 1;
      hoveredObj.scale.lerp(new THREE.Vector3(s, s, 1), 0.1);
      if (hoveredObj.scale.x < s + 0.01) {
        hoveredObj = null;
        document.body.style.cursor = 'default';
      }
    }
  }

  vegetables.forEach((v) => {
    if (v.userData.isParticle) {
      v.position.y += v.userData.speed;
      if (v.position.y > 20) v.position.y = -20;
    } else if (v.userData.id) {
      v.position.y = v.userData.baseY + Math.sin(time * v.userData.floatSpeed) * 0.5;
      v.material.rotation += v.userData.rotSpeed;
    }
  });

  // Parallax camera
  camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
  camera.position.y += (-mouse.y * 5 + 2 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', initThreeScene);
