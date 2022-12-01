import * as THREE from "three";
import { ShadowMesh } from "three/examples/jsm/objects/ShadowMesh";

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, screenWidth / screenHeight, 1, 3000);
const clock = new THREE.Clock();
const renderer = new THREE.WebGLRenderer();

const sunLight = new THREE.DirectionalLight("rgb(255,255,255)", 1);
const normalVector = new THREE.Vector3(0, 1, 0);
const planeConstant = 0.01; // this value must be slightly higher than the groundMesh's y position of 0.0
const groundPlane = new THREE.Plane(normalVector, planeConstant);
const lightPosition4D = new THREE.Vector4();
let verticalAngle = 0;
let horizontalAngle = 0;
let frameTime = 0;
const pi2 = Math.PI * 2;

scene.background = new THREE.Color(0x0096ff);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(screenWidth, screenHeight);
document.getElementById("game_view")!.appendChild(renderer.domElement);
window.addEventListener("resize", onWindowResize);

camera.position.set(0, 2.5, 10);
scene.add(camera);
onWindowResize();

sunLight.position.set(5, 7, -1);
sunLight.lookAt(scene.position);
scene.add(sunLight);

lightPosition4D.x = sunLight.position.x;
lightPosition4D.y = sunLight.position.y;
lightPosition4D.z = sunLight.position.z;
// amount of light-ray divergence. Ranging from:
// 0.001 = sunlight(min divergence) to 1.0 = pointlight(max divergence)
lightPosition4D.w = 0.001; // must be slightly greater than 0, due to 0 causing matrixInverse errors

// GROUND
const groundGeometry = new THREE.BoxGeometry(30, 0.01, 40);
const groundMaterial = new THREE.MeshLambertMaterial({ color: "rgb(0,130,0)" });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.position.y = 0.0; //this value must be slightly lower than the planeConstant (0.01) parameter above
scene.add(groundMesh);

// Create bone
const bone1 = new THREE.Bone();
const bone2 = new THREE.Bone();
bone2.position.set(0, 2, 0);
bone1.add(bone2);

// Create skinned mesh
const geometry = new THREE.CylinderGeometry(5, 5, 5, 5, 15, false, 5, 30);

// create the skin indices and skin weights manually
// (typically a loader would read this data from a 3D model for you)

const position = geometry.attributes.position;

const vertex = new THREE.Vector3();

const skinIndices = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);

    // compute skinIndex and skinWeight based on some configuration data
    const y = (vertex.y + 2.5) / 5; // 0..1

    const skinIndex = Math.floor(y / 0.25);
    const skinWeight = (y % 0.25) / 0.25;

    skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0);

}

geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));

// create skinned mesh and skeleton

const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
const skeleton = new THREE.Skeleton([bone1, bone2]);

// see example from THREE.Skeleton

const rootBone = skeleton.bones[0];
mesh.add(rootBone);

// bind the skeleton to the mesh

mesh.bind(skeleton);

// move the bones and manipulate the model

skeleton.bones[0].rotation.x = -0.1;
skeleton.bones[1].rotation.x = 0.2;

scene.add(mesh);

// RED CUBE and CUBE's SHADOW
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshLambertMaterial({ color: "rgb(255,0,0)", emissive: 0x200000 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.z = -1;
scene.add(cube);

const cubeShadow = new (ShadowMesh as any)(cube) as ShadowMesh;
scene.add(cubeShadow);

animate();

function animate(): void {
    requestAnimationFrame(animate);

    frameTime = clock.getDelta();

    cube.rotation.x += 1.0 * frameTime;
    cube.rotation.y += 1.0 * frameTime;

    horizontalAngle += 0.5 * frameTime;
    if (horizontalAngle > pi2)
        horizontalAngle -= pi2;
    cube.position.x = Math.sin(horizontalAngle) * 4;

    verticalAngle += 1.5 * frameTime;
    if (verticalAngle > pi2)
        verticalAngle -= pi2;
    cube.position.y = Math.sin(verticalAngle) * 2 + 2.9;

    // update the ShadowMeshes to follow their shadow-casting objects
    cubeShadow.update(groundPlane, lightPosition4D);

    renderer.render(scene, camera);
}

function onWindowResize(): void {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    renderer.setSize(screenWidth, screenHeight);

    camera.aspect = screenWidth / screenHeight;
    camera.updateProjectionMatrix();
}
