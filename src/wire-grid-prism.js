import * as THREE from "three";

const isWorkshop = document.body.classList.contains("domain-agent-workshop");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (isWorkshop) {
  const canvas = document.createElement("canvas");
  canvas.id = "wire-grid-canvas";
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070f16, 0.03);

  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 120);
  camera.position.set(0, 0, 26);

  const params = {
    size: 10,
    step: 2,
    lineColor: new THREE.Color("#4f6f84"),
    dotColor: new THREE.Color("#66d9ff"),
    speed: 0.14,
    dotLength: 0.18,
    dotDensity: 1.8,
  };

  function isInside(v) {
    const r = params.size;
    return Math.abs(v.x) <= r && Math.abs(v.y) <= r && Math.abs(v.z) <= r;
  }

  function isSurface(v) {
    if (!isInside(v)) return false;
    const s = params.step;
    const dirs = [
      new THREE.Vector3(s, 0, 0),
      new THREE.Vector3(-s, 0, 0),
      new THREE.Vector3(0, s, 0),
      new THREE.Vector3(0, -s, 0),
      new THREE.Vector3(0, 0, s),
      new THREE.Vector3(0, 0, -s),
    ];
    for (const d of dirs) {
      const n = v.clone().add(d);
      if (!isInside(n)) return true;
    }
    return false;
  }

  function snap(n) {
    return Math.round(n / params.step) * params.step;
  }

  function randomSurfacePoint() {
    for (let i = 0; i < 220; i += 1) {
      const p = new THREE.Vector3(
        snap((Math.random() - 0.5) * params.size * 2.1),
        snap((Math.random() - 0.5) * params.size * 2.1),
        snap((Math.random() - 0.5) * params.size * 2.1),
      );
      if (isSurface(p)) return p;
    }
    return new THREE.Vector3(params.size, 0, 0);
  }

  function createSignalGeometry() {
    const positions = [];
    const distances = [];
    const dirs = [
      new THREE.Vector3(params.step, 0, 0),
      new THREE.Vector3(-params.step, 0, 0),
      new THREE.Vector3(0, params.step, 0),
      new THREE.Vector3(0, -params.step, 0),
      new THREE.Vector3(0, 0, params.step),
      new THREE.Vector3(0, 0, -params.step),
    ];

    let current = randomSurfacePoint();
    let distance = 0;
    const segments = reducedMotion ? 2400 : 5200;

    for (let i = 0; i < segments; i += 1) {
      const next = current.clone().add(dirs[Math.floor(Math.random() * dirs.length)]);
      if (isSurface(next)) {
        positions.push(current.x, current.y, current.z, next.x, next.y, next.z);
        distances.push(distance, distance + params.step);
        current = next;
        distance += params.step;
      } else {
        current = randomSurfacePoint();
        distance += 40;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("lineDistance", new THREE.Float32BufferAttribute(distances, 1));
    return geometry;
  }

  const vertexShader = `
    attribute float lineDistance;
    varying float vDistance;
    void main() {
      vDistance = lineDistance;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 colorLine;
    uniform vec3 colorDot;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uDotLength;
    uniform float uDotRepeat;
    varying float vDistance;

    void main() {
      float baseAlpha = 0.18;
      float cycle = uDotRepeat * 10.0;
      float trail = cycle * uDotLength;
      float flow = mod(vDistance - uTime * uSpeed * 10.0, cycle);
      float signal = smoothstep(cycle - trail, cycle, flow);
      vec3 color = mix(colorLine, colorDot, signal);
      float alpha = max(baseAlpha, signal * 0.92);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      colorLine: { value: params.lineColor },
      colorDot: { value: params.dotColor },
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uDotLength: { value: params.dotLength },
      uDotRepeat: { value: params.dotDensity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const geometry = createSignalGeometry();
  const mesh = new THREE.LineSegments(geometry, material);
  scene.add(mesh);

  const pointer = { x: 0, y: 0 };
  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }
  window.addEventListener("pointermove", onPointerMove);

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
    material.uniforms.uTime.value = t;

    mesh.rotation.y = t * 0.07;
    mesh.rotation.x = Math.sin(t * 0.2) * 0.12;
    mesh.rotation.z = Math.cos(t * 0.16) * 0.08;

    if (!reducedMotion) {
      camera.position.x = pointer.x * 1.4;
      camera.position.y = -pointer.y * 0.8;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(tick);
  }

  tick();

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  });
}
