require([
	'goo/entities/GooRunner',
	'goo/statemachine/FSMSystem',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/loaders/DynamicLoader',
	'goo/math/Vector3',
	'goo/math/Quaternion',
	'goo/entities/EntityUtils',

	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',

	'goo/entities/components/ScriptComponent',
	'goo/scripts/OrbitCamControlScript',

	'goo/renderer/light/DirectionalLight',
	'goo/entities/components/LightComponent',

	'goo/shapes/ShapeCreator',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
    'js/SphereSpatial',
	'goo/util/rsvp',

	'js/FPSCamComponent',
	'js/ShotgunComponent',
	'js/FlashlightComponent',
	'js/Game',
	'js/Input',
	'js/Time',
	'js/HealthComponent',
	'js/Zombie'
], function (
	GooRunner,
	FSMSystem,
	HowlerSystem,
	DynamicLoader,
	Vector3,
	Quaternion,
	EntityUtils,

	Camera,
	CameraComponent,

	ScriptComponent,
	OrbitCamControlScript,

	DirectionalLight,
	LightComponent,

	ShapeCreator,
	Material,
	ShaderLib,
    SphereSpatial,
	RSVP,

	FPSCamComponent,
	ShotgunComponent,
	FlashlightComponent,
	Game,
	Input,
	Time,
	HealthComponent,
	Zombie
) {
	'use strict';


	var levelMesh;
       var calcVec = new Vector3();
	var zombieMesh;

	var goo;
	var ammoWorld;

	// worker variables.
	var physTransform;
	var quaternion;
	var btVec;

	// enum PHY_ScalarType
	var PHY_FLOAT = 0;
	var PHY_DOUBLE = 1;
	var PHY_INTEGER = 2;
	var PHY_SHORT = 3;
	var PHY_FIXEDPOINT88 = 4;
	var PHY_UCHAR = 5;

	Vector3.DOWN = new Vector3(0,-1,0);
	Object.freeze(Vector3.DOWN);

	function initAmmoWorld() {

		physTransform = new Ammo.btTransform();
		Game.physTransform = physTransform;
		quaternion = new Quaternion();
		btVec = new Ammo.btVector3();

		var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		var dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		var overlappingPairCache = new Ammo.btDbvtBroadphase();
		var solver = new Ammo.btSequentialImpulseConstraintSolver();
		ammoWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
		ammoWorld.setGravity(new Ammo.btVector3(0, -12, 0));
		Game.ammoWorld = ammoWorld;


		var groundShape = createTriangleMeshShape();
		var groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();
		groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
		var groundMass = 0; // Mass of 0 means ground won't move from gravity or collisions
		var localInertia = new Ammo.btVector3(0, 0, 0);
		var motionState = new Ammo.btDefaultMotionState( groundTransform );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, motionState, groundShape, localInertia);
		var groundAmmo = new Ammo.btRigidBody( rbInfo );
		ammoWorld.addRigidBody(groundAmmo);

		// TODO:  Do this updating in a Worker()
		//setInterval(function(){ammoWorld.stepSimulation(1/60, 5)}, 1000/60);
	}

	function createTriangleMeshShape() {

		var meshData = levelMesh.getComponent("meshDataComponent").meshData;

		var vertices = meshData.dataViews.POSITION;
		var indices = meshData.indexData.data;

		var numTriangles = meshData.indexCount / 3;
		var numVertices = meshData.vertexCount;

		var triangleMesh = new Ammo.btTriangleIndexVertexArray();

		var indexType = PHY_INTEGER;
		var mesh = new Ammo.btIndexedMesh();

		var floatByteSize = 4;
		var vertexBuffer = Ammo.allocate( floatByteSize * vertices.length, "float", Ammo.ALLOC_NORMAL );

		var scale = 1;

		for ( var i = 0, il = vertices.length; i < il; i ++ ) {

			Ammo.setValue( vertexBuffer + i * floatByteSize, scale * vertices[ i ], 'float' );

		}
		var use32bitIndices = true;
		var intByteSize = use32bitIndices ? 4 : 2;
		var intType = use32bitIndices ? "i32" : "i16";


		var indexBuffer = Ammo.allocate( intByteSize * indices.length, intType, Ammo.ALLOC_NORMAL );

		for ( var i = 0, il = indices.length; i < il; i ++ ) {

			Ammo.setValue( indexBuffer + i * intByteSize, indices[ i ], intType );

		}

		var indexStride = intByteSize * 3;
		var vertexStride = floatByteSize * 3;

		mesh.set_m_numTriangles( numTriangles );
		mesh.set_m_triangleIndexBase( indexBuffer );
		mesh.set_m_triangleIndexStride( indexStride );

		mesh.set_m_numVertices( numVertices );
		mesh.set_m_vertexBase( vertexBuffer );
		mesh.set_m_vertexStride( vertexStride );

		triangleMesh.addIndexedMesh( mesh, indexType );

		var useQuantizedAabbCompression = true;
		var buildBvh = true;

		var shape = new Ammo.btBvhTriangleMeshShape( triangleMesh, useQuantizedAabbCompression, buildBvh );

		return shape;
	}

	function createUserEntity(){
		Game.userEntity = goo.world.createEntity("UserEntity");
		Game.userEntity.addToWorld();
		
		var mass = 1.5;
		var startTransform = new Ammo.btTransform();
		startTransform.setIdentity();
		startTransform.getOrigin().setY(2);
		var localInertia = new Ammo.btVector3(0,0,0);
		var shape = new Ammo.btCapsuleShape(0.7, 0.4);
		//var shape = new Ammo.btSphereShape(1);
		shape.calculateLocalInertia(mass, localInertia);
		var motionState = new Ammo.btDefaultMotionState(startTransform);
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
		Game.userEntity.ammoComponent = new Ammo.btRigidBody(rbInfo);
		// keep it always up
		Game.userEntity.ammoComponent.setSleepingThresholds(0.0, 0.0);
		Game.userEntity.ammoComponent.setAngularFactor(new Ammo.btVector3(0,1,0));
		Game.userEntity.ammoComponent.setFriction(0.0);

		ammoWorld.addRigidBody(Game.userEntity.ammoComponent);

		Game.userEntity.setComponent(new FPSCamComponent(Game.userEntity));
		Game.userEntity.fPSCamComponent.setHeight(1.8);
		Game.currentGun = new ShotgunComponent();
		Game.userEntity.setComponent(Game.currentGun);
		Game.userEntity.setComponent(new FlashlightComponent());
	}

	function init() {
		// Create typical goo application
		goo = new GooRunner({
			antialias: true,
			manuallyStartGameLoop: true,
			debugKeys: true,
			tpfSmoothingCount:1,
			showStats:true
		});
		Game.init(goo);
		goo.world.setSystem(new Time(goo));
		Input.init(goo);
		var fsm = new FSMSystem(goo);
		goo.world.setSystem(fsm);
		goo.world.setSystem(new HowlerSystem());

		// The Loader takes care of loading data from a URL...
		var loader = new DynamicLoader({world: goo.world, rootPath: 'res'});

		var p1 = loader.loadFromBundle('project.project', 'level.bundle');
		var p2 = loader.loadFromBundle('project.project', 'zombie.bundle');
		RSVP.all([p1,p2]).then(function(configsArray) {

			var oldCam = loader.getCachedObjectForRef("entities/DefaultToolCamera.entity");
			oldCam.removeFromWorld();
			// This function is called when the project has finished loading.
			levelMesh = loader.getCachedObjectForRef("level_v03/entities/polySurface24_0.entity");
			levelMesh.hitMask = 1;

			//for( var k in configsArray[0])if(k[k.length-1] == 'y' ) console.log(k);
			//for( var k in configsArray[1])if(k[k.length-1] == 'y' ) console.log(k);
			
			var cam = loader.getCachedObjectForRef("entities/DefaultToolCamera.entity");
			Zombie.ref = loader.getCachedObjectForRef('walking/entities/RootNode.entity');
			Zombie.ref.transformComponent.transform.scale.setd(0.018,0.018,0.018);
			Zombie.ref.removeFromWorld();
			//zombieMesh = 
            //zombieMesh.transformComponent.transform.scale.setd(0.018,0.018,0.018);
			//zombieMesh.removeFromWorld();
			goo.renderer.setClearColor(0, 0, 0, 1); 
			goo.renderer.domElement.id = 'goo';
			document.body.appendChild(goo.renderer.domElement);
			goo.startGameLoop();
			initAmmoWorld();
			
 			createUserEntity();

 			for(var i = 0, ilen = 20; i < ilen; i++){
 				Zombie.spawn();
 			}

			//addKeyBoardListeners();
			//Game.register("Key88", Game, onKey88);
		})
		.then(null, function(e) {
			// The second parameter of 'then' is an error handling function.
			// We just pop up an error message in case the scene fails to load.
			alert('Failed to load scene: ' + e);
			console.log(e.trace);
		});
	}

	function onKey88(b0){
		if(b0){
			Zombie.create();
			//spawnMovableSphere();
		}
	}

	function addKeyBoardListeners() {
		document.addEventListener('keyup', function (event) {
			console.log(event.keyCode);
			//spawnMovableSphere();
		}, true);
	}

	init();
});