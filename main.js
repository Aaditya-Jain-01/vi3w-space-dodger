import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- GAME STATE ---
let score = 0;
let highScore = parseInt(localStorage.getItem('vi3w_high_score') || '0', 10);
let isGameOver = false;
let speed = 45;
const LANE_LIMIT = 5;

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');

highScoreEl.innerText = highScore;

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030308, 0.02);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 4, 8);
camera.lookAt(0, 0, -6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- LIGHTING ---
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.0);
dirLight.position.set(5, 12, 7);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xffaa00, 1.5, 30);
pointLight.position.set(0, 2, 0);
scene.add(pointLight);

// --- STARFIELD ---
const starsGeo = new THREE.BufferGeometry();
const starCount = 1200;
const coords = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  coords[i] = (Math.random() - 0.5) * 200;
  coords[i + 1] = (Math.random() - 0.5) * 100;
  coords[i + 2] = -Math.random() * 250;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(coords, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 });
const starField = new THREE.Points(starsGeo, starsMat);
scene.add(starField);

// --- AUTO-CENTER & SCALING HELPER ---
function fitModelToSize(object, targetDimension) {
  const container = new THREE.Group();
  container.add(object);

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const scale = targetDimension / (maxDim || 1);
  object.scale.setScalar(scale);

  object.position.x = -center.x * scale;
  object.position.y = -center.y * scale;
  object.position.z = -center.z * scale;

  return container;
}

// --- PLAYER SETUP ---
const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, 0);
scene.add(playerGroup);

const fallbackPlayer = new THREE.Mesh(
  new THREE.ConeGeometry(0.7, 1.8, 4),
  new THREE.MeshStandardMaterial({ color: 0x00f0ff, wireframe: true })
);
fallbackPlayer.rotation.x = Math.PI / 2;
playerGroup.add(fallbackPlayer);

// --- LOAD MODELS ---
const loader = new GLTFLoader();
let obstacleTemplate = null;
let crystalTemplate = null;

// 1. Load Player
loader.load(
  '/models/player.glb',
  (gltf) => {
    playerGroup.remove(fallbackPlayer);
    const normalized = fitModelToSize(gltf.scene, 1.8);
    playerGroup.add(normalized);
  },
  undefined,
  (err) => console.warn('Using fallback for player:', err)
);

// 2. Load Obstacle
loader.load(
  '/models/obstacle.glb',
  (gltf) => {
    obstacleTemplate = fitModelToSize(gltf.scene, 1.5);
  },
  undefined,
  () => {
    obstacleTemplate = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8),
      new THREE.MeshStandardMaterial({ color: 0xff0055 })
    );
  }
);

// 3. Load Crystal
loader.load(
  '/models/crystal.glb',
  (gltf) => {
    crystalTemplate = fitModelToSize(gltf.scene, 1.2);
  },
  undefined,
  () => {
    crystalTemplate = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.6),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00 })
    );
  }
);

// --- OBJECT ARRAYS ---
const obstacles = [];
const crystals = [];

function spawnObstacle() {
  if (!obstacleTemplate) return;
  const obs = obstacleTemplate.clone();
  obs.position.set((Math.random() - 0.5) * (LANE_LIMIT * 2), 0, -90);
  scene.add(obs);
  obstacles.push(obs);
}

function spawnCrystal() {
  if (!crystalTemplate) return;
  const cry = crystalTemplate.clone();
  cry.position.set((Math.random() - 0.5) * (LANE_LIMIT * 2), 0, -90);
  scene.add(cry);
  crystals.push(cry);
}

// --- CONTROLS ---
const keys = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'Space' && isGameOver) resetGame();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
});

// --- GAME LOOP ---
let lastObsSpawn = 0;
let lastCrySpawn = 0;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (!isGameOver) {
    const moveStep = 14 * delta;
    if (keys.left && playerGroup.position.x > -LANE_LIMIT) {
      playerGroup.position.x -= moveStep;
      playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, 0.4, 0.1);
    } else if (keys.right && playerGroup.position.x < LANE_LIMIT) {
      playerGroup.position.x += moveStep;
      playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, -0.4, 0.1);
    } else {
      playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, 0, 0.1);
    }

    score += Math.floor(delta * 25);
    scoreEl.innerText = score;

    if (elapsed - lastObsSpawn > Math.max(0.45, 1.2 - score * 0.0002)) {
      spawnObstacle();
      lastObsSpawn = elapsed;
    }
    if (elapsed - lastCrySpawn > 1.6) {
      spawnCrystal();
      lastCrySpawn = elapsed;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.z += speed * delta;
      obs.rotation.x += delta;
      obs.rotation.y += delta;

      if (playerGroup.position.distanceTo(obs.position) < 1.3) {
        triggerGameOver();
      }

      if (obs.position.z > 10) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }

    for (let i = crystals.length - 1; i >= 0; i--) {
      const cry = crystals[i];
      cry.position.z += speed * delta;
      cry.rotation.y += delta * 2.5;

      if (playerGroup.position.distanceTo(cry.position) < 1.4) {
        score += 300;
        scene.remove(cry);
        crystals.splice(i, 1);
        continue;
      }

      if (cry.position.z > 10) {
        scene.remove(cry);
        crystals.splice(i, 1);
      }
    }

    speed += delta * 0.4;
  }

  renderer.render(scene, camera);
}

function triggerGameOver() {
  isGameOver = true;
  finalScoreEl.innerText = score;
  gameOverScreen.classList.remove('hidden');

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('vi3w_high_score', highScore);
    highScoreEl.innerText = highScore;
  }
}

function resetGame() {
  obstacles.forEach((obs) => scene.remove(obs));
  crystals.forEach((cry) => scene.remove(cry));
  obstacles.length = 0;
  crystals.length = 0;

  score = 0;
  speed = 45;
  playerGroup.position.set(0, 0, 0);
  playerGroup.rotation.set(0, 0, 0);
  scoreEl.innerText = '0';
  gameOverScreen.classList.add('hidden');
  isGameOver = false;
}

restartBtn.addEventListener('click', resetGame);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();