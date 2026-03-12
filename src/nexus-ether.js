import * as THREE from "three";

const canvas = document.getElementById("ether-canvas");
if (!canvas) {
  // Non-immersive pages do not include this canvas.
} else {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020711, 0.028);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);
  camera.position.set(0, 0.2, 5.5);

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2500;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = -Math.random() * 28;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xa6d8ff,
    size: 0.024,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const veilGeometry = new THREE.BufferGeometry();
  const veilCount = 900;
  const veilPositions = new Float32Array(veilCount * 3);
  for (let i = 0; i < veilCount; i += 1) {
    veilPositions[i * 3] = (Math.random() - 0.5) * 16;
    veilPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    veilPositions[i * 3 + 2] = -Math.random() * 24;
  }
  veilGeometry.setAttribute("position", new THREE.BufferAttribute(veilPositions, 3));

  const veilMaterial = new THREE.PointsMaterial({
    color: 0x84ffd2,
    size: 0.015,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const veil = new THREE.Points(veilGeometry, veilMaterial);
  scene.add(veil);

  const glowGeometry = new THREE.TorusGeometry(1.2, 0.08, 16, 96);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x59b0ff,
    transparent: true,
    opacity: 0.25,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, -0.3, -2.2);
  glow.rotation.x = Math.PI * 0.5;
  scene.add(glow);

  const shardGeometry = new THREE.IcosahedronGeometry(0.16, 0);
  const shardMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8d8ff,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  const shards = [];
  for (let i = 0; i < 8; i += 1) {
    const shard = new THREE.Mesh(shardGeometry, shardMaterial);
    shard.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 3.8, -2 - Math.random() * 8);
    shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(shard);
    shards.push(shard);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener("resize", resize);

  let raf = 0;
  const clock = new THREE.Clock();

  function tick() {
    const t = clock.getElapsedTime();
    stars.rotation.y = t * 0.02;
    stars.position.z = Math.sin(t * 0.2) * 0.15;
    veil.rotation.y = -t * 0.015;
    veil.position.y = Math.sin(t * 0.33) * 0.08;
    glow.rotation.z = t * 0.12;
    for (let i = 0; i < shards.length; i += 1) {
      const shard = shards[i];
      const drift = i * 0.37;
      shard.rotation.x += 0.0026;
      shard.rotation.y += 0.0019;
      shard.position.y += Math.sin(t * 0.4 + drift) * 0.0009;
      shard.position.x += Math.cos(t * 0.34 + drift) * 0.0007;
    }

    if (!reducedMotion) {
      camera.position.x = Math.sin(t * 0.18) * 0.22;
      camera.position.y = Math.cos(t * 0.14) * 0.1;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(tick);
  }

  tick();

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(raf);
    renderer.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    veilGeometry.dispose();
    veilMaterial.dispose();
    glowGeometry.dispose();
    glowMaterial.dispose();
    shardGeometry.dispose();
    shardMaterial.dispose();
  });
}
