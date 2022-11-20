// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.146.0/build/three.module.js";
import * as THREE from "three";
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.146.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.146.0/examples/jsm/loaders/GLTFLoader.js";



setupMobileDebug();
let camera, scene, renderer

let image
let loader  // glb model loader
let model   // save reference to model

init()
animate()

function setupMobileDebug() {
    const containerEl = document.getElementById('console-ui')
    eruda.init({
        container: containerEl
    })
    const devToolEl = containerEl.shadowRoot.querySelector('.eruda-dev-tools')
    devToolEl.getElementsByClassName.height = '40%'
}

async function init() {
    const container = document.createElement('div')

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        40
    )

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    container.appendChild(renderer.domElement)

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbf, 1)
    light.position.set(0.5, 1, 0.25)
    scene.add(light)

    await loadModel()
    // setup image target
    const url = 'the-scream.jpg'
    const imgBitmap = await getImageBitmap(url)

    const button = ARButton.createButton(renderer, {
        requiredFeatures: ['image-tracking'],
        trackedImages: [
            {
                image: imgBitmap,
                widthInMeters: 0.5,
            },
        ],
        optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
        domOverlay:{
            root: document.body
        }
    })
    document.body.appendChild(button)

    window.addEventListener('resize', onWindowResize, false)
}
async function loadModel() {
    const modelUrl = 'avocado.glb'

    loader = new GLTFLoader()

    const gltf = await loader.loadAsync(modelUrl)
    model = gltf.scene
    model.scale.multiplyScalar(3)
    model.visible = false

    scene.add(model)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window,innerHeight)
}

function animate() {
    renderer.setAnimationLoop(render)
}

async function getImageBitmap(url){
    const response = await fetch(url)
    const blob = await response.blob()
    const imageBitmap = await createImageBitmap(blob)
    return imageBitmap
}
function updateModel(pose){
    if (model) {
        model.rotation.x = pose.transform.orientation.x;
        model.rotation.y = pose.transform.orientation.y;
        model.rotation.z = pose.transform.orientation.z;
        
        model.position.x = pose.transform.position.x;
        model.position.y = pose.transform.position.y;
        model.position.z = pose.transform.position.z;
      }
}

function render(timestamp, frame){
    if (frame) {
        const results = frame.getImageTrackingResults();

        for (const result of results) {
            // The result's index is the image's position in the trackedImages array specified at 
            // session creation
            const imageIndex = result.index;

            // Get the pose of the image relative to a reference space.
            const referenceSpace = renderer.xr.getReferenceSpace();
            const pose = frame.getPose(result.imageSpace, referenceSpace);

            const state = result.trackingState;

            if (state == "tracked") {
              // do something when image is tracked
              // console.log("Image target has been found");
              if (model) {
                model.visible = true;
                updateModel(pose);
              }
            } else if (state == "emulated") {
              // do something when image is lost
              if (model) {
                model.visible = false;
              }
              // console.log("Image target no longer seen");
            }
          }
    }
    renderer.render(scene, camera);
}





























