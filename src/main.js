import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

camera.position.set(0, 20, 20);

const controls = new OrbitControls(camera, renderer.domElement);

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color,
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAcceleration = false,
    isEnemy = false,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color }),
    );

    this.height = height;
    this.width = width;
    this.depth = depth;
    this.color = color;

    this.position.set(position.x, position.y, position.z);

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.leftSide = this.position.x - this.width / 2;
    this.rightSide = this.position.x + this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.012;
    this.zAcceleration = zAcceleration;
    this.isEnemy = isEnemy;
  }

  update(ground) {
    this.updateSides();
    if (this.zAcceleration) this.velocity.z = +0.1;
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  updateSides() {
    this.leftSide = this.position.x - this.width / 2;
    this.rightSide = this.position.x + this.width / 2;
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    if (
      boxCollision({
        box1: this,
        box2: ground,
      })
    ) {
      this.velocity.y *= 0.7;
      this.velocity.y = -this.velocity.y;
    } else this.position.y += this.velocity.y;
  }
}

// Box colision
function boxCollision({ box1, box2 }) {
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;
  const xCollision =
    box1.rightSide >= box2.leftSide && box1.leftSide <= box2.rightSide;
  const yCollision = box1.bottom + box1.velocity.y <= box2.top;

  return xCollision && yCollision && zCollision;
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  color: 0x00ff00,
  velocity: {
    x: 0,
    y: -0.01,
    z: 0,
  },
});

cube.castShadow = true;
scene.add(cube);

const ground = new Box({
  width: 12,
  height: 0.5,
  depth: 50,
  color: 0x00369a1,
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});
ground.receiveShadow = true;
scene.add(ground);

const directionLight = new THREE.DirectionalLight(0xffffff, 5);
directionLight.position.y = 10;
directionLight.position.z = 3;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.015);
scene.add(directionLight, ambientLight);
directionLight.castShadow = true;

const lightBallGeometry = new THREE.SphereGeometry(1);
const lightBallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lightBall = new THREE.Mesh(lightBallGeometry, lightBallMaterial);
scene.add(lightBall);
lightBall.position.set(0, 10, 3);

console.log("Cube bottom: ", cube.bottom, "Ground: ", ground.top);

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
};

// add controls
window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
    case "KeyS":
      keys.s.pressed = true;
      break;
    case "KeyW":
      keys.w.pressed = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    case "KeyS":
      keys.s.pressed = false;
      break;
    case "KeyW":
      keys.w.pressed = false;
      break;
  }
});

const movementSpeedX = 0.06;
const movementSpeedZ = 0.09;

function createEnemy(spawnPosition) {
  const enemy = new Box({
    width: 1,
    height: 1,
    depth: 0.97,
    color: 0xff0000,
    velocity: {
      x: 0,
      y: -0.01,
      z: 0.05,
    },
    position: {
      x: spawnPosition,
      y: 0,
      z: -20,
    },
    zAcceleration: true,
  });
  enemy.castShadow = true;
  return enemy;
}
const enemies = [];
const spawnPositions = [-3, 0, 3];

let frames = 0;
let spawnRate = 200;

function animate() {
  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // movement
  cube.velocity.x = 0;
  cube.velocity.z = 0;
  if (keys.a.pressed) cube.velocity.x = -movementSpeedX;
  else if (keys.d.pressed) cube.velocity.x = movementSpeedX;

  if (keys.s.pressed) cube.velocity.z = movementSpeedZ;
  else if (keys.w.pressed) cube.velocity.z = -movementSpeedZ;

  cube.update(ground);

  enemies.forEach((enemy) => {
    enemy.update(ground);
    if (
      boxCollision({
        box1: cube,
        box2: enemy,
      })
    ) {
      console.log("collision detected");
      window.cancelAnimationFrame(animationId);
    }
  });

  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 5;

    const spawnPosition = Math.random() * (6 - -6) + -6;
    const enemy = createEnemy(spawnPosition);
    console.log(spawnPosition);
    enemies.push(enemy);
    scene.add(enemy);
  }

  frames++;
}
animate();
