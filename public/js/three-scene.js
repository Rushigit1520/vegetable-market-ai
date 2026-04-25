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
  const vegData = [
    { id: 'p021', name: 'Potato', color: 0xc4a484, type: 'potato' },
    { id: 'p022', name: 'Onion', color: 0xcd5c5c, type: 'onion' },
    { id: 'p008', name: 'Tomato', color: 0xff6347, type: 'tomato' },
    { id: 'p038', name: 'Brinjal (Eggplant)', color: 0x4b0082, type: 'brinjal' },
    { id: 'p023', name: 'Cauliflower', color: 0xffffff, type: 'cauliflower' },
    { id: 'p024', name: 'Cabbage', color: 0x90ee90, type: 'cabbage' },
    { id: 'p025', name: 'Spinach', color: 0x228b22, type: 'leafy' },
    { id: 'p026', name: 'Fenugreek (Methi)', color: 0x2e8b57, type: 'leafy' },
    { id: 'p027', name: 'Coriander', color: 0x32cd32, type: 'leafy' },
    { id: 'p028', name: 'Green Chili', color: 0x00ff00, type: 'chili' },
    { id: 'p007', name: 'Carrot', color: 0xffa500, type: 'carrot' },
    { id: 'p029', name: 'Peas', color: 0x3cb371, type: 'peas' },
    { id: 'p030', name: 'Capsicum', color: 0x008000, type: 'capsicum' },
    { id: 'p031', name: 'Bottle Gourd', color: 0x98fb98, type: 'gourd' },
    { id: 'p032', name: 'Ridge Gourd', color: 0x2e8b57, type: 'gourd' },
    { id: 'p033', name: 'Bitter Gourd', color: 0x556b2f, type: 'gourd' },
    { id: 'p034', name: 'Okra (Bhindi)', color: 0x228b22, type: 'okra' },
    { id: 'p035', name: 'Pumpkin', color: 0xff8c00, type: 'pumpkin' },
    { id: 'p036', name: 'Drumstick', color: 0x556b2f, type: 'drumstick' },
    { id: 'p037', name: 'Radish', color: 0xffffff, type: 'radish' }
  ];

  vegData.forEach((data, index) => {
    const group = new THREE.Group();
    let mesh;

    switch(data.type) {
      case 'potato':
        const potGeo = new THREE.SphereGeometry(1, 16, 16);
        potGeo.scale(1.2, 0.8, 1);
        mesh = new THREE.Mesh(potGeo, new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8 }));
        break;
      case 'onion':
        const onionGeo = new THREE.SphereGeometry(1, 16, 16);
        onionGeo.scale(1, 1.1, 1);
        mesh = new THREE.Mesh(onionGeo, new THREE.MeshStandardMaterial({ color: data.color }));
        const onionTop = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
        onionTop.position.y = 1;
        group.add(onionTop);
        break;
      case 'tomato':
        mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.3 }));
        const tomStem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x006400 }));
        tomStem.position.y = 1;
        group.add(tomStem);
        break;
      case 'brinjal':
        const brinGeo = new THREE.SphereGeometry(1, 32, 32);
        brinGeo.scale(0.8, 1.8, 0.8);
        mesh = new THREE.Mesh(brinGeo, new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.2 }));
        const brinStem = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x006400 }));
        brinStem.position.y = 1.8;
        group.add(brinStem);
        break;
      case 'cauliflower':
        mesh = new THREE.Group();
        const mainCaul = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        mesh.add(mainCaul);
        for(let i=0; i<8; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshStandardMaterial({ color: 0x228b22 }));
          leaf.position.set(Math.cos(i)*1.1, -0.5, Math.sin(i)*1.1);
          leaf.scale.set(1, 1.5, 0.5);
          mesh.add(leaf);
        }
        break;
      case 'cabbage':
        mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.9 }));
        break;
      case 'leafy':
        mesh = new THREE.Group();
        for(let i=0; i<5; i++) {
          const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshStandardMaterial({ color: data.color, side: THREE.DoubleSide }));
          leaf.rotation.set(Math.random(), Math.random(), Math.random());
          leaf.position.set(Math.random()*0.5, Math.random()*0.5, Math.random()*0.5);
          mesh.add(leaf);
        }
        break;
      case 'chili':
        const chiliGeo = new THREE.CylinderGeometry(0.2, 0.05, 2, 8);
        mesh = new THREE.Mesh(chiliGeo, new THREE.MeshStandardMaterial({ color: data.color }));
        mesh.rotation.z = Math.PI / 4;
        break;
      case 'carrot':
        mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 16), new THREE.MeshStandardMaterial({ color: data.color }));
        mesh.rotation.x = Math.PI;
        break;
      case 'peas':
        mesh = new THREE.Group();
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 8), new THREE.MeshStandardMaterial({ color: 0x228b22 }));
        pod.scale.set(1.5, 1, 0.5);
        mesh.add(pod);
        break;
      case 'capsicum':
        const capGeo = new THREE.SphereGeometry(1, 16, 16);
        capGeo.scale(1.1, 1, 1.1);
        mesh = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.2 }));
        break;
      case 'gourd':
        const gourdGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 16);
        mesh = new THREE.Mesh(gourdGeo, new THREE.MeshStandardMaterial({ color: data.color }));
        break;
      case 'okra':
        const okraGeo = new THREE.CylinderGeometry(0.2, 0.05, 2.5, 8);
        mesh = new THREE.Mesh(okraGeo, new THREE.MeshStandardMaterial({ color: data.color }));
        break;
      case 'pumpkin':
        const pumpGeo = new THREE.SphereGeometry(1.5, 32, 32);
        pumpGeo.scale(1.2, 0.9, 1.2);
        mesh = new THREE.Mesh(pumpGeo, new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.5 }));
        break;
      case 'drumstick':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 8), new THREE.MeshStandardMaterial({ color: data.color }));
        break;
      case 'radish':
        mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        mesh.rotation.x = Math.PI;
        break;
      default:
        mesh = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial({ color: data.color }));
    }

    if (mesh) group.add(mesh);
    
    // Position in a grid or random spread
    const angle = (index / vegData.length) * Math.PI * 2;
    const radius = 10 + Math.random() * 5;
    group.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10);
    
    group.userData = {
      id: data.id,
      name: data.name,
      desc: `Fresh ${data.name} available in our market.`,
      mesh: mesh,
      baseY: group.position.y,
      rotSpeed: Math.random() * 0.02,
      floatSpeed: 1 + Math.random()
    };

    scene.add(group);
    vegetables.push(group);
  });

  // Add background particles
  for(let i=0; i<50; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.5 }));
    p.position.set((Math.random()-0.5)*50, (Math.random()-0.5)*30, (Math.random()-0.5)*20);
    p.userData = { isParticle: true, speed: 0.01 + Math.random()*0.02 };
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
      if (hoveredObj) hoveredObj.scale.set(1, 1, 1);
      hoveredObj = found;
      document.body.style.cursor = 'pointer';
    }
    hoveredObj.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
  } else {
    if (hoveredObj) {
      hoveredObj.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      if (hoveredObj.scale.x < 1.01) {
        hoveredObj = null;
        document.body.style.cursor = 'default';
      }
    }
  }

  vegetables.forEach((v) => {
    if (v.userData.isParticle) {
      v.position.y += v.userData.speed;
      if (v.position.y > 15) v.position.y = -15;
    } else if (v.userData.id) {
      v.position.y = v.userData.baseY + Math.sin(time * v.userData.floatSpeed) * 0.5;
      v.rotation.y += v.userData.rotSpeed;
      v.rotation.x += v.userData.rotSpeed * 0.5;
    }
  });

  // Parallax camera
  camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
  camera.position.y += (-mouse.y * 5 + 2 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', initThreeScene);
