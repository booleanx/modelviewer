if (!Detector.webgl) Detector.addGetWebGLMessage();

var divContainer;

var camera, scene, renderer, objects, orbitControls;
var light;
var light2;
var dae;
var hemiLight, dirLight, dirLight2;
var axes;
var composer, composer2;

var loader = new THREE.ColladaLoader();

var filename = './model/SUPERVISION_BUILDING.dae';
loader.load(filename,function(result){
    onLoad(result);
});

loader.options.convertUpAxis = true;

// custom global variables
var targetList = [];
var projector, mouse = { x: 0, y: 0 };
var animateModel = false;
var distanceToCenter = 0;
var showSurfaces = true;

var INTERSECTED;
var selectedFaces = [];
var floorSide = 1000;
var baseColor = new THREE.Color(0x44dd66);
var highlightedColor = new THREE.Color(0xddaa00);
var selectedColor = new THREE.Color(0x4466dd);
var mouseSphereCoords = null;
var mouseSphere = [];

var lastMeshMaterial, lastMeshID, lastObjectMaterial, lastObjectID;
var selMaterial;

function AddCameraNavigationControls(camera, render, divContainer) {
	// navigation (mouse  + keyboards)
	orbitControls = new THREE.OrbitControls(camera, divContainer);
	orbitControls.damping = 0.2;
	orbitControls.addEventListener('change', render);
}

function AddPlaneGrid(scene) {
	var size = 14, step = 1;

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({ color: 0x909090 });

	for (var i = -size; i <= size; i += step) {

		geometry.vertices.push(new THREE.Vector3(-size, -0.04, i));
		geometry.vertices.push(new THREE.Vector3(size, -0.04, i));

		geometry.vertices.push(new THREE.Vector3(i, -0.04, -size));
		geometry.vertices.push(new THREE.Vector3(i, -0.04, size));

	}
	var line = new THREE.Line(geometry, material, THREE.LinePieces);
	scene.add(line);
}

function AddSceneCenter(scene) {
	AddCubeAtPosition(scene, new THREE.Vector3(0, 0, 0), 0xff0000);
}

function AddCubeAtPosition(scene, vector, colorCube) {
	var geometryCenter = new THREE.BoxGeometry(0.3, 0.3, 0.3);
	var materialCenter = new THREE.MeshBasicMaterial({ color: colorCube });
	var sphereCenter = new THREE.Mesh(geometryCenter, materialCenter);
	sphereCenter.position.set(vector.x, vector.y, vector.z);
	scene.add(sphereCenter);
}


function buildAxes(length) {
	var axes = new THREE.Object3D();

	axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X RED
	axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X RED
	axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x00FF00, false)); // +Y GREEN
	axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x00FF00, true)); // -Y GREEN
	axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z BLUE
	axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z BLUE

	return axes;

}

function buildAxis(src, dst, colorHex, dashed) {
	var geom = new THREE.Geometry(),
		mat;

	if (dashed) {
		mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
	} else {
		mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
	}

	geom.vertices.push(src.clone());
	geom.vertices.push(dst.clone());
	geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

	var axis = new THREE.Line(geom, mat, THREE.LinePieces);

	return axis;

}

function DrawAxes(scene, length) {
	axes = buildAxes(length);
	scene.add(axes);
}


function AddDirectionalLight(scene, h, s, l, position, color) {
	var dirLight = new THREE.DirectionalLight(0xffffff, 1);
	dirLight.color.setHSL(h, s, l);
	dirLight.position.set(position.x, position.y, position.z);
	//AddCubeAtPosition(scene, dirLight.position, color);


	dirLight.castShadow = false;

	dirLight.shadowMapWidth = 2048;
	dirLight.shadowMapHeight = 2048;

	var d = 50;

	dirLight.shadowCameraLeft = -d;
	dirLight.shadowCameraRight = d;
	dirLight.shadowCameraTop = d;
	dirLight.shadowCameraBottom = -d;

	dirLight.shadowCameraFar = 3500;
	dirLight.shadowBias = -0.0001;
	dirLight.shadowDarkness = 0.35;

	dirLight.shadowCameraVisible = true;

	scene.add(dirLight);
}

function AddHemisphereLight(scene, h1, s1, l1, h2, s2, l2, position, color) {

	var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
	hemiLight.color.setHSL(h1, s1, l1);
	hemiLight.groundColor.setHSL(h2, s2, l2);
	hemiLight.position.set(position.x, position.y, position.z);
	scene.add(hemiLight);
	//AddCubeAtPosition(scene, hemiLight.position, color);

}

function modelWidth() {

	return  divContainer.clientWidth;
	//return 400;
}

function modelHeight() {

	//return divContainer.clientHeight;
	//return window.innerHeight;
	return window.innerHeight - formModelManipulation.clientHeight - 40;
}

var assetPanel,formModelManipulation;

function init() {

	lastMeshMaterial = -1;
	lastMeshID = -1;
	lastObjectMaterial = -1;
	lastObjectID = -1;

	divContainer = document.getElementById("div3dModel");
	assetPanel = document.getElementById("AssetPanel");
	formModelManipulation = document.getElementById("formModelManipulation");
	
	// world
	scene = new THREE.Scene();

	
	dae.scale.x = dae.scale.y = dae.scale.z = 0.01;
	var modelBox = new THREE.Box3().setFromObject(dae);

	var depth = modelBox.max.z - modelBox.min.z;

	var objectCenter = new THREE.Vector3((modelBox.max.x + modelBox.min.x) / 2, (modelBox.max.y + modelBox.min.y) / 2, (modelBox.max.z + modelBox.min.z) / 2);

	dae.translateX(-objectCenter.x);
	dae.translateZ(-objectCenter.z);

	dae.traverse(function (child) {
		if (child instanceof THREE.Mesh) {
			if (child.material) {
				child.material.side = THREE.DoubleSide;
			}
		}
	});

	computeNormalsAndFaces();

	modelBox = new THREE.Box3().setFromObject(dae);
	depth = modelBox.max.z - modelBox.min.z;
	objectCenter = new THREE.Vector3((modelBox.max.x + modelBox.min.x) / 2, (modelBox.max.y + modelBox.min.y) / 2, (modelBox.max.z + modelBox.min.z) / 2);

	camera = new THREE.PerspectiveCamera(45, (modelWidth() ) / (modelHeight() ), 1, 1000);
	camera.position.set(objectCenter.x + 2*modelBox.max.x, objectCenter.y + 2*modelBox.max.y, objectCenter.z + depth);

	var centerPosition = new THREE.Vector3(0, 0, 0);
	var cameraPosition = this.camera.position;
	distanceToCenter = cameraPosition.distanceTo(centerPosition);

	AddCameraNavigationControls(camera, render, divContainer);

	//// Grid
	//AddPlaneGrid(scene);

	scene.add(camera);

	camera.up = new THREE.Vector3(0, 1, 0);
	camera.lookAt(scene.position);

	scene.add(dae);

	//AddSceneCenter(scene);
	//DrawAxes(scene, 1000);

	//AddCubeAtPosition(scene, objectCenter, 0x00ff00);

	// LIGHTS

	AddHemisphereLight(scene, 0.6, 1, 0.6, 0.095, 1, 0.75, new THREE.Vector3(objectCenter.x, objectCenter.y + 2, objectCenter.z), 0x0000ff);
	AddDirectionalLight(scene, 0.1, 1, 0.95, new THREE.Vector3(objectCenter.x, objectCenter.y + 2, objectCenter.z + 5), 0x00ffff);
	AddDirectionalLight(scene, 0.1, 1, 0.95, new THREE.Vector3(objectCenter.x, objectCenter.y + 2, objectCenter.z - 10), 0x00ffff);

	// renderer
	renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer(); // Fallback to canvas renderer, if necessary.

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth - 300, window.innerHeight - 80);
	renderer.setClearColor(0xffffff, 1);

	// postprocessing
	composer = new THREE.EffectComposer(renderer);
	composer.renderToScreen = false;
	composer.addPass(new THREE.RenderPass(scene, camera));

	var cannyEdge = new THREE.ShaderPass(THREE.CannyEdgeFilterPass);
	cannyEdge.renderToScreen = false;
	composer.addPass(cannyEdge);

	var effect = new THREE.ShaderPass(THREE.InvertThreshholdPass);
	effect.renderToScreen = false;
	composer.addPass(effect);


	effect = new THREE.ShaderPass(THREE.CopyShader);
	effect.renderToScreen = true;
	composer.addPass(effect);


	divContainer.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);

	selMaterial = new THREE.MeshBasicMaterial({ color: '#f2f215', side: '2' });   //color for selected mesh element

	projector = new THREE.Projector();
	divContainer.addEventListener('mousedown', onDocumentMouseDown, false);
	divContainer.addEventListener('mousemove', onDocumentMouseMove, false);
	divContainer.addEventListener('mouseup', onDocumentMouseUp, false);

	render();

}

function computeNormalsAndFaces() {

	dae.traverse(function (child) {
		if (child instanceof THREE.Mesh) {
			targetList.push(child);
		}
	});

}

//var mouseDown = false;
//var mouseMovedOnDown = false;

var mouseDownCoordinates;

function cursorPositionInCanvas(canvas, event) {
                var x, y;

                var canoffset = $(canvas).offset();
                x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left);
                y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;

                return [x,y];
    }


function onDocumentMouseMove(event) {
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		//event.preventDefault();
		var canvas = renderer.domElement;		

		mouse.x = (cursorPositionInCanvas( renderer.domElement, event )[0] / $(canvas).width()) * 2 - 1;
		mouse.y = -(cursorPositionInCanvas(renderer.domElement, event)[1] / $(canvas).height()) * 2 + 1;

    //if (mouseDown)
    //    mouseMovedOnDown = true;
}

function onDocumentMouseDown(event) {
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	//event.preventDefault();

    //if (!checkSelection()) {
    //    var canvas = renderer.domElement;
    //    // update the mouse variable
    //    mouse.x = (cursorPositionInCanvas(renderer.domElement, event)[0] / $(canvas).width()) * 2 - 1;
    //    mouse.y = -(cursorPositionInCanvas(renderer.domElement, event)[1] / $(canvas).height()) * 2 + 1;
    //} else {
    //    event.preventDefault();
    //    event.stopPropagation();
    //}

    var canvas = renderer.domElement;
    // update the mouse variable
    mouse.x = (cursorPositionInCanvas(renderer.domElement, event)[0] / $(canvas).width()) * 2 - 1;
    mouse.y = -(cursorPositionInCanvas(renderer.domElement, event)[1] / $(canvas).height()) * 2 + 1;
    //mouseDown = true;
    mouseDownCoordinates = JSON.parse(JSON.stringify(mouse));
}

function onDocumentMouseUp(event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    //event.preventDefault();
    var test = Math.sqrt(Math.pow(mouseDownCoordinates.x - mouse.x, 2) + Math.pow(mouseDownCoordinates.y - mouse.y, 2));

    if (Math.sqrt(Math.pow(mouseDownCoordinates.x - mouse.x, 2) + Math.pow(mouseDownCoordinates.y - mouse.y, 2)) < 0.0005) {
        checkSelection();
    }
    //mouseMovedOnDown = false;
    //mouseDown = false;

}

function ColorSelected() {
		selectedFaces.forEach(function (arrayItem) {
			//arrayItem.face.color = selectedColor;
			//arrayItem.object.geometry.colorsNeedUpdate = true;
		});
}

var lastObject, lastMesh;

function checkSelection() {
		// find intersections

		// create a Ray with origin at the mouse position
		//   and direction into the scene (camera direction)
		var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
		//projector.unprojectVector(vector, camera);
		vector.unproject(camera);


		var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

		// create an array containing all objects in the scene with which the ray intersects
		var intersects = ray.intersectObjects(targetList);

		//if an intersection is detected
		if (intersects.length > 0) {


			console.log("Hit : " + toString(intersects[0].point));
            console.dir(intersects[0].object);
			var meshId = intersects[0].object.id;
			var meshName = intersects[0].object.name;
			var meshUuid = intersects[0].object.uuid;


			if (lastObject != undefined || lastMesh != undefined) {

				//reset last material for last lastMeshID
				lastMesh.material = lastMeshMaterial;
				if (lastMesh.material) {
					lastMesh.material.needsUpdate = true;
				}

				lastObject.material = lastObjectMaterial;
				if (lastObject.material) {
					lastObject.material.needsUpdate = true;
				}
			}

			//set lastMaterial
			lastMeshMaterial = intersects[0].material;
			//set lastMeshID
			lastMeshID = intersects[0].id;
			lastMesh = intersects[0];

			lastObjectMaterial = intersects[0].object.material;
			lastObjectID = intersects[0].object.id;
			lastObject = intersects[0].object;

			//apply SelMaterial
			intersects[0].material = selMaterial;
			intersects[0].material.needsUpdate = true;

			if (intersects[0].object) {
				intersects[0].object.material = selMaterial;
				intersects[0].object.material.needsUpdate = true;
			}

			render();

		    window.parent.$('#appModelSelectPopup').wijdialog({
		        //show: 'clip',
		        //hide: 'clip',
		        modal: false,
		        width: $(window.parent).width() * (window.mobileAndTabletcheck() ? 1 : 0.80),
		        height: $(window.parent).height() * (window.mobileAndTabletcheck() ? 1 : 0.80),
		        zIndex: 2004,
		        contentUrl: window.appLocalHost + 'wf/selected3delement.aspx?id=' + meshId + '&name=' + meshName + '&uuid=' + meshUuid,
		        close: function (e) {;
		            $('#appModelSelectPopup').wijdialog('destroy');
		        },
		        autoOpen: true,
		        title: 'Selected 3D item',
		        captionButtons: {
		            pin: { visible: false },
		        },
		    });

		    $(window.parent).resize(function () {
		        window.parent.$('#appModelSelectPopup').wijdialog('option', 'width', $(window.parent).width() * (window.mobileAndTabletcheck() ? 1 : 0.97));
		        window.parent.$('#appModelSelectPopup').wijdialog('option', 'height', $(window.parent).height() * (window.mobileAndTabletcheck() ? 1 : 0.97));
		    });

		    return true;
		} else {
			
			if (lastObject != undefined || lastMesh != undefined) {

				//reset last material for last lastMeshID
				lastMesh.material = lastMeshMaterial;
				if (lastMesh.material) {
					lastMesh.material.needsUpdate = true;
				}

				lastObject.material = lastObjectMaterial;
				if (lastObject.material) {
					lastObject.material.needsUpdate = true;
				}

				lastObject = undefined;
				lastMesh = undefined;

				render();
			}

		    return false;
		}
	}
	

function onWindowResize() {
	
	camera.aspect = (modelWidth()) / (modelHeight());
	camera.updateProjectionMatrix();

	renderer.setSize(modelWidth(), modelHeight());

	render();

}

function animate() {

	if (animateModel) {
		requestAnimationFrame(animate);
		orbitControls.update();
		render();
	}
}
var clock = new THREE.Clock();
function render() {

	if (animateModel) {

		var timer = 0.0005 * Date.now();
		
		camera.position.x = Math.cos(timer) * distanceToCenter;
		camera.position.z = Math.sin(timer) * distanceToCenter;

		camera.lookAt(scene.position);

		THREE.AnimationHandler.update(clock.getDelta());
	}
	if (showSurfaces) {
		renderer.render(scene, camera);
	} else {
		composer.render();
	}

		
}

$(document).ready(function () {
    $("#rotateLeft").on("click", function () {
        var theta = 0.1;
        var x = camera.position.x;
        var z = camera.position.z;

        camera.position.x = x * Math.cos(theta) - z * Math.sin(theta);
        camera.position.z = z * Math.cos(theta) + x * Math.sin(theta);

        camera.updateProjectionMatrix();
        camera.lookAt(scene.position);
        render();
    });



    $("#rotateRight").on("click", function () {
        var theta = 0.1;
        var x = camera.position.x;
        var z = camera.position.z;

        camera.position.x = x * Math.cos(theta) + z * Math.sin(theta);
        camera.position.z = z * Math.cos(theta) - x * Math.sin(theta);

        camera.updateProjectionMatrix();
        camera.lookAt(scene.position);
        render();
    });

    $("#in").on("click", function () {
        camera.fov -= 5;
        camera.updateProjectionMatrix();
        render();

    });

    $("#out").on("click", function () {
        camera.fov += 5;
        camera.updateProjectionMatrix();
        render();
    });

    $("#up").on("click", function () {

        var press = $.Event("keypress");
        press.ctrlKey = false;
        press.keyCode = 38;

        orbitControls.externalKeyDown(press);
        render();
    });

    $("#down").on("click", function () {

        var press = $.Event("keypress");
        press.ctrlKey = false;
        press.keyCode = 40;

        orbitControls.externalKeyDown(press);
        render();

    });

    $("#left").on("click", function () {

        var press = $.Event("keypress");
        press.ctrlKey = false;
        press.keyCode = 37;

        orbitControls.externalKeyDown(press);
        render();
    });


    $("#right").on("click", function () {

        var press = $.Event("keypress");
        press.ctrlKey = false;
        press.keyCode = 39;

        orbitControls.externalKeyDown(press);
        render();
    });

    $("#showSurfaces").on("click", function () {

        showSurfaces = $("#showSurfaces").prop("checked");
        render();

    });

    $("#animateModel").on("click", function () {
        animateModel = $("#animateModel").prop("checked");
        animate();
    });
});

function onLoad(collada) {
    dae = collada.scene;
    dae.updateMatrix();
    init();
   
    $('#modelLoadProgressBarText').text(100 + '%');
    $('#modelLoadProgressBar').css('width', 100 + '%').attr('aria-valuenow', 100);
    setTimeout(function () {
        $('#modelLoadProgressBar').toggle();
        $('#modelLoadProgressBar').css('width', 0 + '%').attr('aria-valuenow', 0);
        $('#modelLoadProgressBarText').text(0 + '%');
    }, 500);
}

function loadProgress(args) {
    var percentage = Math.floor((args.loaded * 100) / args.total);
		
    $('#modelLoadProgressBarText').text(percentage + '%');
    $('#modelLoadProgressBar').css('width', percentage + '%').attr('aria-valuenow', percentage);
}