import Ammo from "ammojs-typed";
import * as THREE from "three";
import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";
import { ShadowMesh } from "three/examples/jsm/objects/ShadowMesh";

const clock = new THREE.Clock();

Ammo(Ammo).then(() => {
    // #region init
    const container = document.getElementById("game_view")!;

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 30;

    //#region scene

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const gridHelper = new THREE.PolarGridHelper(30, 0);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0x887766);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);

    //#endregion

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const effect = new OutlineEffect(renderer);

    //#region model

    function onProgress(xhr: ProgressEvent): void {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete) + "% downloaded");
        }
    }

    const modelFile = "https://threejs.org/examples/models/mmd/miku/miku_v2.pmd";
    const vmdFiles = [ "https://threejs.org/examples/models/mmd/vmds/wavefile_v2.vmd" ];

    const helper = new MMDAnimationHelper({
        afterglow: 2.0
    });

    const loader = new MMDLoader();

    let shadowMesh: ShadowMesh;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.01 + -10);
    const lightPosition = new THREE.Vector4(5, 7, -1, 0.001);

    loader.loadWithAnimation(modelFile, vmdFiles, (mmd) => {
        const mesh = mmd.mesh;
        mesh.position.y = -10;
        scene.add(mesh);

        shadowMesh = new (ShadowMesh as any)(mesh) as ShadowMesh;

        scene.add(shadowMesh);

        helper.add(mesh, {
            animation: mmd.animation,
            physics: true
        });

        const ikHelper = helper.objects.get(mesh)!.ikSolver.createHelper();
        ikHelper.visible = false;
        scene.add(ikHelper);

        const physicsHelper = helper.objects.get(mesh)!.physics!.createHelper();
        physicsHelper.visible = false;
        scene.add(physicsHelper);
    }, onProgress, undefined);

    //#endregion

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 10;
    controls.maxDistance = 100;

    window.addEventListener("resize", onWindowResize);
    // #endregion

    animate();

    function onWindowResize(): void {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        effect.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate(): void {
        requestAnimationFrame(animate);
        render();
    }

    function render(): void {
        helper.update(clock.getDelta());
        shadowMesh?.update(plane, lightPosition);
        effect.render(scene, camera);
    }
});
