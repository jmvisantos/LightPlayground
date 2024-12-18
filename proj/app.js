import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, rotate, normalize, scale } from '../../libs/MV.js';

import * as dat from '../../libs/dat.gui.module.js';
import * as BUNNY from '../../libs/objects/bunny.js';
import * as COW from '../../libs/objects/cow.js';
import * as STACK from '../../libs/stack.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';

let programP;
let programG;
let program;

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    BUNNY.init(gl);
    COW.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);
    TORUS.init(gl);
    PYRAMID.init(gl);

    programG = buildProgramFromSources(gl, shaders['shaderG.vert'], shaders['shaderG.frag']);
    programP = buildProgramFromSources(gl, shaders['shaderP.vert'], shaders['shaderP.frag']);
    program = programG;

    gl.useProgram(programG);
    
    let options = {
        wireframe: false,
        drawLightPositions: true
    }

    let object, ground;
    let camera;
    let lights;
    let worldLight, objectLight, cameraLight;
    
    const sceneGraph = {
        camera: {
            eye: vec3(-5, 2, 5),
            at: vec3(0, 0, 0),
            up: vec3(0, 1, 0),
            fovy: 40,
            aspect: 1,
            near: 0.1,
            far: 20
        },

        lights: [
            { type: 'world', 
                position: vec4(2, 2, 2, 0), 
                Ia: vec3(50, 50, 50), 
                Id: vec3(200, 200, 200), 
                Is: vec3(255, 255, 255), 
                enabled: true },
            { type: 'object', 
                position: vec4(-2, 2, 0, 0), 
                Ia: vec3(30, 30, 30), 
                Id: vec3(150, 150, 150), 
                Is: vec3(200, 200, 200), 
                enabled: true },
            { type: 'camera', 
                position: vec4(0, 0, 0, 0), 
                Ia: vec3(40, 40, 40), 
                Id: vec3(100, 100, 100), 
                Is: vec3(150, 150, 150), 
                enabled: true }
        ],

        objects: [
            { name: 'Object',
                position: vec3(0, 0.5, 0),
                scale: vec3(2, 2, 2),
                rotation: vec3(0, 0, 0),
                Ka: [0, 0, 0], 
                Kd: [130, 50, 20], 
                Ks: [255, 255, 255],
                shininess: 50
            },
            { name: 'Ground',
                position: vec3(0, -0.5, 0),
                scale: vec3(10, 0.1, 10),
                Ka: vec3(0.0, 0.4, 0.05), 
                Kd: vec3(0.0, 0.4, 0.05), 
                Ks: vec3(0.0, 0.4, 0.05)
            }
        ]
    }

    function loadSceneGraph(graph) {
        camera = graph.camera;

        lights = graph.lights;
        
        worldLight = graph.lights.find(light => light.type === 'world');
        objectLight = graph.lights.find(light => light.type === 'object');
        cameraLight = graph.lights.find(light => light.type === 'camera');

        object = graph.objects.find(obj => obj.name === 'Object');
        ground = graph.objects.find(obj => obj.name === 'Ground');
    }

    loadSceneGraph(sceneGraph);

    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "wireframe");
    optionsGui.add(options, "drawLightPositions");

    const cameraGui = gui.addFolder("camera");
    cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";
    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });
    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });

    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    let num_lights = 3;
    const lightsGUI = gui.addFolder("lights");

    lights.forEach((light, index) => {
        let folderName;
        if (index === 0) {
            folderName = "world";
        } else if (index === 1) {
            folderName = "object";
        } else {
            folderName = "camera";
        }
        const lightGui = lightsGUI.addFolder(folderName);
        lightGui.add(light.position, 0, -10, 10).step(0.1).name('x'); 
        lightGui.add(light.position, 1, -10, 10).step(0.1).name('y'); 
        lightGui.add(light.position, 2, -10, 10).step(0.1).name('z'); 
        lightGui.addColor(light, "Ia").name('ambient');
        lightGui.addColor(light, "Id").name('diffuse');
        lightGui.addColor(light, "Is").name('specular'); 
        lightGui.add(light, "enabled").name("directional").onChange(function (value) {
            light.position[3] = value ? 0 : 1;
            console.log(light.position);
        });
        lightGui.add(light, "enabled").name("active").onChange(function (value) {
            num_lights = lights.filter(light => light.enabled).length;
        });
    });

    let object_to_draw = 1;
    let gouraud = true;

    const objectGUI = new dat.GUI(); 
    objectGUI.domElement.id = "object-gui";

    const name = objectGUI.addFolder("name");
    name.add({ name: 'Bunny' }, 'name', ['Bunny', 'Cow', 'Cylinder', 'Torus', 'Sphere', 'Cube', 'Pyramid']).onChange(function (v) {
        switch (v) {
            case 'Bunny':
                object_to_draw = 1;
                break;
            case 'Cow':
                object_to_draw = 2;
                break;
            case 'Cylinder':
                object_to_draw = 3;
                break;
            case 'Torus':
                object_to_draw = 4;
                break;
            case 'Sphere':
                object_to_draw = 5;
                break;
            case 'Cube':
                object_to_draw = 6;
                break;
            case 'Pyramid':
                object_to_draw = 7;
                break;
            default:
                object_to_draw = 0;
        }
    });

    const transform = objectGUI.addFolder("transform");
    
    const position = transform.addFolder("position");
    position.add(object.position, 0).name('x').step(0.05).listen();
    position.add(object.position, 1).name('y').step(0.05).listen();
    position.add(object.position, 2).name('z').step(0.05).listen();

    const rotation = transform.addFolder("rotation");
    rotation.add(object.rotation, 0).name('x').step(1).listen().domElement.style.pointerEvents = "none";;
    rotation.add(object.rotation, 1).name('y').step(1).listen();
    rotation.add(object.rotation, 2).name('z').step(1).listen().domElement.style.pointerEvents = "none";;

    const scale = transform.addFolder("scale");
    scale.add(object.scale, 0).name('x').min(0.1).step(0.05).listen();
    scale.add(object.scale, 1).name('y').min(0.1).step(0.05).listen();
    scale.add(object.scale, 2).name('z').min(0.1).step(0.05).listen();

    const material = objectGUI.addFolder("material");
    material.add({ shader: 'Gouraud' }, 'shader', ['Gouraud', 'Phong']).onChange(function (v) {
        gouraud = (v === 'Gouraud');
        program = gouraud ? programG : programP;
    });

    material.addColor(object, 'Ka');
    material.addColor(object, 'Kd');
    material.addColor(object, 'Ks');
    material.add(object, 'shininess').min(1).max(100).step(1);

    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.0, 0.7, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function (event) {


        if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.metaKey || event.ctrlKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.ctrlKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    function inCameraSpace(m) {
        const mInvView = inverse(mView);

        return mult(mInvView, mult(m, mView));
    }

    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {
                // Do something here...

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);

                console.log(eyeAt, newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }

        }
    });

    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.0, 0.3, 0.7, 1.0);
    });

    canvas.addEventListener('mouseup', function () {
        down = false;
        gl.clearColor(0.0, 0.7, 1.0, 1.0);
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.aspect = canvas.width / canvas.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
        window.requestAnimationFrame(render);
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
        // Update view matrix based on camera
        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);
    
        // Set up the projection matrix
        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        if (gouraud) {
            gl.useProgram(programG);
        } else {
            gl.useProgram(programP);
        }

        if (options.drawLightPositions) {
            for (let i = 0; i < lights.length; i++) {
                STACK.pushMatrix();
                if (i == 2){
                    STACK.loadIdentity();
                    STACK.pushMatrix();
                }
                
                STACK.multTranslation(lights[i].position.slice(0, 3));
                STACK.multScale([0.2, 0.2, 0.2]);
                
                // Disable lighting for the spheres representing the lights
                gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), [1.0, 1.0, 1.0]);
                gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), lights[i].Id.map(x => x / 255.0));
                gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), [0.0, 0.0, 0.0]);
                gl.uniform1f(gl.getUniformLocation(program, "u_material.shininess"), 1.0);
                
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(STACK.modelView()));
                SPHERE.draw(gl, program, gl.TRIANGLES);
                STACK.popMatrix();

                if (i == 2){
                    STACK.popMatrix();
                }
            }
        }

        // Pass the matrices to the shaders
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(mView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(mView)));
        
        // Pass material properties (convert from [0, 255] range to [0, 1] range)
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), object.Ka.map(x => x / 255.0));
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), object.Kd.map(x => x / 255.0));
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), object.Ks.map(x => x / 255.0));
        gl.uniform1f(gl.getUniformLocation(program, "u_material.shininess"), object.shininess);

        gl.uniform1i(gl.getUniformLocation(program, "u_num_lights"), num_lights);

        // Pass light properties
        for (let i = 0; i < lights.length; i++) {
            if (lights[i].enabled) {
                gl.uniform1i(gl.getUniformLocation(program, `u_lightType[${i}]`), lights[i].position[3] === 0 ? 0 : (lights[i].enabled ? 1 : 2));
                gl.uniform4fv(gl.getUniformLocation(program, `u_light[${i}].position`), lights[i].position);
                gl.uniform3fv(gl.getUniformLocation(program, `u_light[${i}].Ia`), lights[i].Ia.map(x => x / 255.0));
                gl.uniform3fv(gl.getUniformLocation(program, `u_light[${i}].Id`), lights[i].Id.map(x => x / 255.0));
                gl.uniform3fv(gl.getUniformLocation(program, `u_light[${i}].Is`), lights[i].Is.map(x => x / 255.0));
            } else {
                gl.uniform1i(gl.getUniformLocation(program, `u_lightType[${i}]`), -1);
            }
        }

        STACK.pushMatrix();
        STACK.multTranslation(object.position);
        STACK.multScale(object.scale);
        STACK.multRotationY(object.rotation[1]);
        STACK.multRotationX(object.rotation[0]);
        STACK.multRotationZ(object.rotation[2]);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(STACK.modelView()));

        switch (object_to_draw) {
            case 1:
                BUNNY.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            case 2:
                COW.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            case 3:
                CYLINDER.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            case 4:
                TORUS.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            case 5:
                SPHERE.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            case 6:
                CUBE.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            case 7:
                PYRAMID.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
                break;
            default:
            break;
        }
        STACK.popMatrix();
        
        // Draw the floor 
        STACK.multTranslation(ground.position);
        STACK.multScale(ground.scale);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(STACK.modelView()));
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), ground.Ka);
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), ground.Kd);
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), ground.Ks);
        
        CUBE.draw(gl, program, gl.TRIANGLES);
    }
}    

const urls = ['shaderP.vert', 'shaderG.vert', 'shaderP.frag', 'shaderG.frag'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));
