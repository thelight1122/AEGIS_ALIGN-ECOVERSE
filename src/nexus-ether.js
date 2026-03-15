import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Clock,
  DoubleSide,
  FogExp2,
  IcosahedronGeometry,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  VideoTexture,
  WebGLRenderer,
} from "three";

const canvas = document.getElementById("ether-canvas");
if (!canvas) {
  // Non-immersive pages do not include this canvas.
} else {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0 };

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

  const scene = new Scene();
  scene.fog = new FogExp2(0x020711, 0.028);

  const camera = new PerspectiveCamera(58, 1, 0.1, 80);
  camera.position.set(0, 0.2, 5.5);
  const cameraTarget = new Vector3(0, 0, 0);
  const driftTarget = new Vector2(0, 0);
  let hasEntranceFocus = false;
  const isImmersiveNexus = document.body.classList.contains("immersive-root");
  const isSectionSurface = document.body.classList.contains("domain-surface");
  const roadSigns = [];
  let lockedRoadSign = null;
  const projectionBuffer = new Vector3();
  const focusThreshold = 0.13;
  let transitPull = 0;

  const starGeometry = new BufferGeometry();
  const starCount = 2500;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = -Math.random() * 28;
  }
  starGeometry.setAttribute("position", new BufferAttribute(positions, 3));

  const starMaterial = new PointsMaterial({
    color: 0xa6d8ff,
    size: 0.024,
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const stars = new Points(starGeometry, starMaterial);
  scene.add(stars);

  const veilGeometry = new BufferGeometry();
  const veilCount = 900;
  const veilPositions = new Float32Array(veilCount * 3);
  for (let i = 0; i < veilCount; i += 1) {
    veilPositions[i * 3] = (Math.random() - 0.5) * 16;
    veilPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    veilPositions[i * 3 + 2] = -Math.random() * 24;
  }
  veilGeometry.setAttribute("position", new BufferAttribute(veilPositions, 3));

  const veilMaterial = new PointsMaterial({
    color: 0x84ffd2,
    size: 0.015,
    transparent: true,
    opacity: 0.55,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const veil = new Points(veilGeometry, veilMaterial);
  scene.add(veil);

  const glowGeometry = new TorusGeometry(1.2, 0.08, 16, 96);
  const glowMaterial = new MeshBasicMaterial({
    color: 0x59b0ff,
    transparent: true,
    opacity: 0.25,
  });
  const glow = new Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, -0.3, -2.2);
  glow.rotation.x = Math.PI * 0.5;
  scene.add(glow);

  const shardGeometry = new IcosahedronGeometry(0.16, 0);
  const shardMaterial = new MeshBasicMaterial({
    color: 0xb8d8ff,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  const shards = [];
  for (let i = 0; i < 8; i += 1) {
    const shard = new Mesh(shardGeometry, shardMaterial);
    shard.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 3.8, -2 - Math.random() * 8);
    shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(shard);
    shards.push(shard);
  }

  const signHint = document.createElement("div");
  signHint.className = "roadsign-hint";
  signHint.setAttribute("aria-live", "polite");
  signHint.hidden = true;
  if (isImmersiveNexus) {
    document.body.appendChild(signHint);
  }

  function makeRoadSignTexture(label, subtitle, palette) {
    const canvasTexture = document.createElement("canvas");
    canvasTexture.width = 1024;
    canvasTexture.height = 360;
    const ctx = canvasTexture.getContext("2d");
    ctx.fillStyle = "rgba(8, 16, 30, 0.84)";
    ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);
    const gradient = ctx.createLinearGradient(0, 0, canvasTexture.width, canvasTexture.height);
    gradient.addColorStop(0, palette.gradA);
    gradient.addColorStop(1, palette.gradB);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 5;
    ctx.strokeRect(18, 18, canvasTexture.width - 36, canvasTexture.height - 36);
    ctx.fillStyle = "rgba(201, 235, 255, 0.96)";
    ctx.font = "600 64px 'Segoe UI', sans-serif";
    ctx.fillText(label, 48, 144);
    ctx.fillStyle = "rgba(179, 221, 247, 0.96)";
    ctx.font = "500 34px 'Segoe UI', sans-serif";
    ctx.fillText(subtitle, 48, 212);
    ctx.fillStyle = "rgba(142, 242, 215, 0.96)";
    ctx.font = "500 28px 'Segoe UI', sans-serif";
    ctx.fillText("Drift into resonance and click to enter", 48, 272);

    const texture = new CanvasTexture(canvasTexture);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    return texture;
  }

  function addRoadSigns() {
    if (!isImmersiveNexus) {
      return;
    }

    const specs = [
      {
        label: "Custodian Ops Center",
        route: "/custodian-ui/",
        x: -3.4,
        y: 0.5,
        z: -6.8,
        subtitle: "Stewardship + system continuity",
        color: 0x6ef1d0,
        palette: {
          gradA: "rgba(80, 245, 205, 0.42)",
          gradB: "rgba(59, 158, 121, 0.18)",
          stroke: "rgba(170, 255, 225, 0.82)",
        },
        motion: { swirl: 1.06, pulse: 1.2, spin: 1.25 },
      },
      {
        label: "AEGIS Application Lab",
        route: "/aegis-application-lab/",
        x: 3.2,
        y: 0.9,
        z: -8.5,
        subtitle: "Live demos and practical exploration",
        color: 0x7f66ff,
        palette: {
          gradA: "rgba(151, 119, 255, 0.45)",
          gradB: "rgba(95, 76, 228, 0.2)",
          stroke: "rgba(210, 192, 255, 0.84)",
        },
        motion: { swirl: 1.18, pulse: 1.35, spin: 1.5 },
      },
      {
        label: "Developers Depot",
        route: "/developer-depot/",
        x: -2.9,
        y: -1.2,
        z: -10.4,
        subtitle: "Build lanes and protocol surfaces",
        color: 0xffb56b,
        palette: {
          gradA: "rgba(255, 191, 118, 0.44)",
          gradB: "rgba(201, 118, 54, 0.2)",
          stroke: "rgba(255, 219, 174, 0.83)",
        },
        motion: { swirl: 0.98, pulse: 1.05, spin: 1.1 },
      },
      {
        label: "Agentic Workshop",
        route: "/agent-workshop/",
        x: 3.5,
        y: -0.9,
        z: -12.1,
        subtitle: "Agent mesh and recursive systems",
        color: 0x59b0ff,
        palette: {
          gradA: "rgba(96, 185, 255, 0.45)",
          gradB: "rgba(51, 120, 205, 0.2)",
          stroke: "rgba(182, 222, 255, 0.84)",
        },
        motion: { swirl: 1.28, pulse: 1.5, spin: 1.72 },
      },
    ];

    const signGeometry = new PlaneGeometry(2.6, 0.95);

    for (let i = 0; i < specs.length; i += 1) {
      const spec = specs[i];
      const texture = makeRoadSignTexture(spec.label, spec.subtitle, spec.palette);
      const material = new MeshBasicMaterial({
        map: texture,
        side: DoubleSide,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      });
      const sign = new Mesh(signGeometry, material);
      sign.position.set(spec.x, spec.y, spec.z);
      sign.userData.route = spec.route;
      sign.userData.label = spec.label;
      sign.userData.base = sign.position.clone();
      sign.userData.phase = Math.random() * Math.PI * 2;
      scene.add(sign);

      const halo = new Mesh(
        new RingGeometry(0.62, 0.7, 52),
        new MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.33,
          side: DoubleSide,
          depthWrite: false,
        }),
      );
      halo.position.set(spec.x, spec.y - 0.72, spec.z + 0.02);
      scene.add(halo);

      const tunnelRings = [];
      for (let r = 0; r < 7; r += 1) {
        const ring = new Mesh(
          new TorusGeometry(0.46 + r * 0.08, 0.016, 12, 42),
          new MeshBasicMaterial({
            color: spec.color,
            transparent: true,
            opacity: 0.06 + r * 0.012,
            depthWrite: false,
          }),
        );
        ring.position.set(spec.x, spec.y, spec.z - (r + 1) * 0.62);
        ring.rotation.x = Math.PI * 0.5 + r * 0.02;
        scene.add(ring);
        tunnelRings.push(ring);
      }

      roadSigns.push({
        sign,
        halo,
        texture,
        material,
        tunnelRings,
        label: spec.label,
        route: spec.route,
        motion: spec.motion,
      });
    }
  }

  addRoadSigns();

  const isCompact = window.matchMedia("(max-width: 900px)").matches;
  const billboardSources = [
    "/media/billboard-soft-light-721.mp4",
    "/media/billboard-soft-light-582.mp4",
    "/media/billboard-soft-light-578.mp4",
    "/media/billboard-soft-light-529.mp4",
    "/media/billboard-soft-light-562.mp4",
  ];
  const activeBillboardSources = isCompact ? billboardSources.slice(0, 3) : billboardSources;
  const billboardGeometry = new PlaneGeometry(1.9, 1.1);
  const billboardMeshes = [];
  const billboardMaterials = [];
  const billboardTextures = [];
  const billboardVideos = [];

  if (isImmersiveNexus) {
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

      const texture = new VideoTexture(video);
      texture.colorSpace = SRGBColorSpace;
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.generateMipmaps = false;

      const material = new MeshBasicMaterial({
        map: texture,
        side: DoubleSide,
        transparent: true,
        opacity: 0.78,
        blending: AdditiveBlending,
        depthWrite: false,
      });

      const mesh = new Mesh(billboardGeometry, material);
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

  function onPointerMove(event) {
    pointer.x = event.clientX / window.innerWidth - 0.5;
    pointer.y = event.clientY / window.innerHeight - 0.5;
  }
  window.addEventListener("pointermove", onPointerMove);

  let raf = 0;
  const clock = new Clock();

  window.addEventListener("aegis:entrance-focus", (event) => {
    const detail = event.detail || {};
    if (detail.type === "engage" && typeof detail.centerX === "number" && typeof detail.centerY === "number") {
      const normX = (detail.centerX / Math.max(1, detail.viewportW || window.innerWidth)) * 2 - 1;
      const normY = (detail.centerY / Math.max(1, detail.viewportH || window.innerHeight)) * 2 - 1;
      driftTarget.set(normX * 0.85, -normY * 0.5);
      hasEntranceFocus = true;
    } else if (detail.type === "release") {
      driftTarget.set(0, 0);
      hasEntranceFocus = false;
    }
  });

  function tick() {
    const t = clock.getElapsedTime();
    stars.rotation.y = t * 0.02;
    stars.rotation.x = Math.sin(t * 0.11) * 0.05;
    stars.position.z = Math.sin(t * 0.2) * 0.15;
    stars.position.x = pointer.x * 0.4;
    stars.position.y = -pointer.y * 0.3;
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

    if (roadSigns.length > 0) {
      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      const nearestProjection = { x: 0, y: 0 };

      for (let i = 0; i < roadSigns.length; i += 1) {
        const item = roadSigns[i];
        const base = item.sign.userData.base;
        const phase = item.sign.userData.phase;

        item.sign.position.x = base.x + Math.cos(t * 0.34 + phase) * 0.2;
        item.sign.position.y = base.y + Math.sin(t * 0.52 + phase) * 0.22;
        item.sign.position.z = base.z + Math.sin(t * 0.24 + phase) * 0.28;
        item.sign.lookAt(camera.position);

        item.halo.position.x = item.sign.position.x;
        item.halo.position.y = item.sign.position.y - 0.72;
        item.halo.position.z = item.sign.position.z + 0.02;
        item.halo.rotation.z += 0.006;

        const activeStrength = lockedRoadSign === item ? 1 : 0;
        const pullBoost = activeStrength * transitPull;
        item.halo.material.opacity = 0.27 + activeStrength * 0.2 + pullBoost * 0.26;
        const swirl = item.motion?.swirl || 1;
        const pulse = item.motion?.pulse || 1;
        const spin = item.motion?.spin || 1;

        for (let r = 0; r < item.tunnelRings.length; r += 1) {
          const ring = item.tunnelRings[r];
          const depthStep = r + 1;
          ring.position.x = item.sign.position.x;
          ring.position.y = item.sign.position.y;
          ring.position.z = item.sign.position.z - depthStep * (0.62 + pullBoost * 0.1);
          ring.rotation.z += (0.005 + depthStep * 0.0006 + pullBoost * 0.015) * spin;
          ring.scale.setScalar(1 + Math.sin(t * (2 * pulse) + depthStep * (0.44 * swirl)) * 0.05 + activeStrength * 0.12 + pullBoost * 0.2);
          ring.material.opacity = 0.05 + r * 0.012 + activeStrength * 0.15 + pullBoost * 0.24;
        }

        projectionBuffer.copy(item.sign.position).project(camera);
        const d = Math.hypot(projectionBuffer.x, projectionBuffer.y);
        if (d < nearestDistance) {
          nearestDistance = d;
          nearest = item;
          nearestProjection.x = projectionBuffer.x;
          nearestProjection.y = projectionBuffer.y;
        }
      }

      const shouldLock = nearest && nearestDistance < focusThreshold;
      if (shouldLock && lockedRoadSign !== nearest) {
        lockedRoadSign = nearest;
        if (signHint) {
          signHint.hidden = false;
          signHint.textContent = `${nearest.label} entrance in resonance - click to enter`;
        }
        const cx = ((nearestProjection.x + 1) * 0.5) * window.innerWidth;
        const cy = ((-nearestProjection.y + 1) * 0.5) * window.innerHeight;
        window.dispatchEvent(
          new CustomEvent("aegis:entrance-focus", {
            detail: { type: "engage", centerX: cx, centerY: cy, viewportW: window.innerWidth, viewportH: window.innerHeight },
          }),
        );
      } else if (!shouldLock && lockedRoadSign) {
        lockedRoadSign = null;
        if (signHint) {
          signHint.hidden = true;
        }
        window.dispatchEvent(new CustomEvent("aegis:entrance-focus", { detail: { type: "release" } }));
      }
    }

    if (!reducedMotion) {
      if (hasEntranceFocus) {
        const focusX = driftTarget.x;
        const focusY = driftTarget.y;
        camera.position.x += (focusX - camera.position.x) * 0.04;
        camera.position.y += (focusY - camera.position.y) * 0.04;
        camera.position.z += (5.05 - camera.position.z) * 0.025;
      } else {
        const pointerDriftX = pointer.x * (isSectionSurface ? 0.34 : 0.22);
        const pointerDriftY = -pointer.y * (isSectionSurface ? 0.2 : 0.12);
        const wanderX = Math.sin(t * 0.18) * (isSectionSurface ? 0.32 : 0.22) + pointerDriftX;
        const wanderY = Math.cos(t * 0.14) * (isSectionSurface ? 0.16 : 0.1) + pointerDriftY;
        camera.position.x += (wanderX - camera.position.x) * 0.03;
        camera.position.y += (wanderY - camera.position.y) * 0.03;
        camera.position.z += ((isSectionSurface ? 5.2 : 5.5) - camera.position.z) * 0.025;
      }
      if (transitPull > 0.001) {
        camera.position.z -= transitPull * 0.06;
        transitPull *= 0.92;
      } else {
        transitPull = 0;
      }
      camera.lookAt(cameraTarget);
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(tick);
  }

  tick();

  window.addEventListener("pointerdown", (event) => {
    if (!lockedRoadSign || event.button !== 0) {
      return;
    }
    transitPull = 1;
    const transit = window.aegisTransit;
    window.setTimeout(() => {
      if (typeof transit === "function") {
        transit(lockedRoadSign.route);
      } else {
        window.location.assign(lockedRoadSign.route);
      }
    }, 170);
  });

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
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
    if (signHint && signHint.parentNode) {
      signHint.parentNode.removeChild(signHint);
    }
    for (let i = 0; i < roadSigns.length; i += 1) {
      roadSigns[i].texture.dispose();
      roadSigns[i].material.dispose();
      roadSigns[i].sign.geometry.dispose();
      roadSigns[i].halo.geometry.dispose();
      roadSigns[i].halo.material.dispose();
      for (let r = 0; r < roadSigns[i].tunnelRings.length; r += 1) {
        roadSigns[i].tunnelRings[r].geometry.dispose();
        roadSigns[i].tunnelRings[r].material.dispose();
      }
    }
    for (let i = 0; i < billboardTextures.length; i += 1) {
      billboardTextures[i].dispose();
      billboardMaterials[i].dispose();
      billboardVideos[i].pause();
      billboardVideos[i].src = "";
      billboardVideos[i].load();
    }
  });
}
