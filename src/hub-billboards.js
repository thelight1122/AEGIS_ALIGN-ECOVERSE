import * as THREE from "three";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCompact = window.matchMedia("(max-width: 980px)").matches;

const hubConfigs = {
  "domain-aegis-application-lab": {
    opacity: 0.7,
    sources: [
      "/media/billboard-soft-light-876.mp4",
      "/media/billboard-soft-light-872.mp4",
      "/media/billboard-soft-light-878.mp4",
    ],
  },
  "domain-developer-depot": {
    opacity: 0.68,
    sources: [
      "/media/billboard-soft-light-898.mp4",
      "/media/billboard-soft-light-808.mp4",
      "/media/billboard-soft-light-721.mp4",
    ],
  },
};

const classList = Array.from(document.body.classList);
const hubClass = classList.find((value) => hubConfigs[value]);
const config = hubClass ? hubConfigs[hubClass] : null;

if (config) {
  const canvas = document.createElement("canvas");
  canvas.className = "hub-billboards-canvas";
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07101a, 0.045);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 60);
  camera.position.set(0, 0.2, 10.5);

  const boardGeometry = new THREE.PlaneGeometry(2.4, 1.36);
  const boards = [];
  const videos = [];
  const textures = [];
  const materials = [];

  const activeSources = isCompact ? config.sources.slice(0, 2) : config.sources;

  for (let i = 0; i < activeSources.length; i += 1) {
    const video = document.createElement("video");
    video.src = activeSources[i];
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "metadata";
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
      opacity: config.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(boardGeometry, material);
    const spread = activeSources.length === 1 ? 0 : i / (activeSources.length - 1);
    mesh.position.set((spread - 0.5) * 6.5, (Math.random() - 0.5) * 1.8, -3.4 - i * 1.5);
    mesh.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI * 2, 0);
    scene.add(mesh);

    const start = video.play();
    if (start && typeof start.catch === "function") {
      start.catch(() => {
        // Autoplay can be deferred by the browser.
      });
    }

    boards.push({
      mesh,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      phase: Math.random() * Math.PI * 2,
    });
    videos.push(video);
    textures.push(texture);
    materials.push(material);
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

  const clock = new THREE.Clock();
  let raf = 0;

  function tick() {
    const t = clock.getElapsedTime();

    for (let i = 0; i < boards.length; i += 1) {
      const board = boards[i];
      const wobble = board.phase;
      board.mesh.position.x = board.baseX + Math.cos(t * 0.22 + wobble) * 0.26;
      board.mesh.position.y = board.baseY + Math.sin(t * 0.36 + wobble) * 0.18;
      board.mesh.position.z = board.baseZ + Math.sin(t * 0.2 + wobble) * 0.28;
      board.mesh.rotation.y += reducedMotion ? 0.0012 : 0.0028;
      board.mesh.rotation.x = Math.sin(t * 0.3 + wobble) * 0.12;
    }

    if (!reducedMotion) {
      camera.position.x = Math.sin(t * 0.13) * 0.45;
      camera.position.y = Math.cos(t * 0.11) * 0.2;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(tick);
  }

  tick();

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(raf);
    renderer.dispose();
    boardGeometry.dispose();
    for (let i = 0; i < textures.length; i += 1) {
      textures[i].dispose();
      materials[i].dispose();
      videos[i].pause();
      videos[i].src = "";
      videos[i].load();
    }
  });
}
