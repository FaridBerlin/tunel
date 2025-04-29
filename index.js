import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import spline from './spline.js';
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";


const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.002;
bloomPass.strength = 3.5;
bloomPass.radius = 0;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// create a line geometry frome the spline
const points = spline.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const line = new THREE.Line(geometry, material);
// scene.add(line);


// create a tube geometry from the spline
const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);


// create edge geometry from the spline 
const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00});
const lineEdges = new THREE.LineSegments(edges, lineMaterial);
scene.add(lineEdges);

// create boxes inside the tube
const numBoxes = 66;
const size = 0.06;
const boxGeometry = new THREE.BoxGeometry(size, size, size);

// Add rotation speed for the boxes
const boxRotationSpeed = 0.05; // Adjust this value for faster or slower rotation

// Store references to all boxes for animation
const rotatingBoxes = [];

for (let i = 0; i < numBoxes; i += 1) {
  const boxMat = new THREE.MeshBasicMaterial({
    color: 0xffff,
    wireframe: true
  });
  const box = new THREE.Mesh(boxGeometry, boxMat);
  const p = (i / numBoxes + Math.random() * 0.1) % 1;
  const pos = spline.getPointAt(p);
  pos.x += Math.random() - 0.4;
  pos.z += Math.random() - 0.4;
  box.position.copy(pos);
  const rote = new THREE.Vector3(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  );
  box.rotation.set(rote.x, rote.y, rote.z);
  rotatingBoxes.push(box); // Store the box for rotation updates
  const edges = new THREE.EdgesGeometry(boxGeometry, 0.2);
  const color = new THREE.Color().setHSL(1.0 - p, 1, 0.5);
  const lineMat = new THREE.LineBasicMaterial({ 
    color: 0xffff,
    transparent: true,
    opacity: 0.9
  });
  const boxLines = new THREE.LineSegments(edges, lineMat);
  boxLines.position.copy(pos);
  boxLines.rotation.set(rote.x, rote.y, rote.z);
  scene.add(box);
  scene.add(boxLines);
}

// create an updete camera function
function updateCamera(t) {
  const time = t * 0.01;
  const looptime = 4 * 1000;
  const p = (time % looptime) / looptime;
  const pos = spline.getPointAt(p); // Corrected access to the path
  const lookAt = spline.getPointAt((p + 0.03) % 1); // Corrected access to the path
  camera.position.copy(pos);
  camera.lookAt(lookAt);
}

function animate(t = 0) {
  requestAnimationFrame(animate);
  updateCamera(t);
  composer.render(scene, camera);
  controls.update();

  // Rotate each box
  rotatingBoxes.forEach((box) => {
    box.rotation.y += boxRotationSpeed; // Rotate around the Y-axis
    box.rotation.x += boxRotationSpeed * 0.5; // Optional: Add slight X-axis rotation
  });
}
animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);