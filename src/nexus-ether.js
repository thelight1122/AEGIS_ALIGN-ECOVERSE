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

  const isCompact = window.matchMedia("(max-width: 900px)").matches;
  const billboardSources = [
    "/media/billboard-soft-light-721.mp4",
    "/media/billboard-soft-light-582.mp4",
    "/media/billboard-soft-light-578.mp4",
    "/media/billboard-soft-light-529.mp4",
    "/media/billboard-soft-light-562.mp4",
  ];
  const activeBillboardSources = isCompact ? billboardSources.slice(0, 3) : billboardSources;
  const billboardGeometry = new THREE.PlaneGeometry(1.9, 1.1);
  const billboardMeshes = [];
  const billboardMaterials = [];
  const billboardTextures = [];
  const billboardVideos = [];

  for (let i = 0; i < activeBillboardSources.length; i += 1) {
    const source = activeBillboardSources[i];
    const video = document.createElement("video");
    video.src = source;
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(billboardGeometry, material);
    const arc = (i / activeBillboardSources.length) * Math.PI * 2;
    mesh.position.set(Math.cos(arc) * 3.4, Math.sin(arc * 1.2) * 1.2, -4.2 - i * 1.2);
    scene.add(mesh);

    const start = video.play();
    if (start && typeof start.catch === "function") {
      start.catch(() => {
        // Autoplay can be blocked until user interaction on some clients.
      });
    }

    billboardMeshes.push({
      mesh,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      phase: Math.random() * Math.PI * 2,
    });
    billboardVideos.push(video);
    billboardTextures.push(texture);
    billboardMaterials.push(material);
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
    for (let i = 0; i < billboardMeshes.length; i += 1) {
      const board = billboardMeshes[i];
      const wobble = board.phase;
      board.mesh.position.x = board.baseX + Math.cos(t * 0.22 + wobble) * 0.22;
      board.mesh.position.y = board.baseY + Math.sin(t * 0.36 + wobble) * 0.17;
      board.mesh.position.z = board.baseZ + Math.sin(t * 0.18 + wobble) * 0.25;
      board.mesh.lookAt(camera.position);
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
    billboardGeometry.dispose();
    for (let i = 0; i < billboardTextures.length; i += 1) {
      billboardTextures[i].dispose();
      billboardMaterials[i].dispose();
      billboardVideos[i].pause();
      billboardVideos[i].src = "";
      billboardVideos[i].load();
    }
  });
}
