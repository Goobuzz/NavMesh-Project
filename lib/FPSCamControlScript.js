define([
	'goo/math/Vector3',
	'goo/util/GameUtils',
	'lib/Input',
	'lib/Game',
	'lib/Time',
	'goo/math/Ray',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/EntityUtils'
], function(
	Vector3,
	GameUtils,
	Input,
	Game,
	Time,
	Ray,
	Camera,
	CameraComponent,
	EntityUtils
) {
	'use strict';
	var ray = new Ray();
	var room = -1;
	var entity;
	var cam;
	var speed = 10;
	function FPSCamComponent(entityRef){
		entity = entityRef;
		cam = EntityUtils.createTypcialEntity(Game.goo.world, new Camera(45, 1, 0.1, 100));
		cam.addToWorld();
		entity.transformComponent.attachChild(cam.transformComponent);
		entity.transformComponent.setUpdated();
		
		/*
	var camera = new Camera(45, 1, 0.1, 1000);
	var cameraEntity = 	EntityUtils.createTypicalEntity(goo.world, camera, new OrbitCamControlScript(), [0,0,5]);
	cameraEntity.addToWorld();
		*/
		var camRotation = cam.transformComponent.transform.rotation;

		//function exitPointerLock(bool0){
		//	if(true == bool0){
		//		alert("test");
		//		GameUtils.exitPointerLock();
		//	}
		//}

		var tmpVec = new Vector3();
		function mouseMove() {
			if(!document.pointerLockElement) return;

			camRotation.toAngles(tmpVec);
			tmpVec.x -= Input.movement.y * 0.2 * Time.dt;
			tmpVec.y -= Input.movement.x * 0.2 * Time.dt;

			tmpVec.x = Math.min(tmpVec.x, Math.PI/2)
			tmpVec.x = Math.max(tmpVec.x, -Math.PI/2)
			camRotation.fromAngles(tmpVec.x,tmpVec.y,tmpVec.z);
			cam.transformComponent.setUpdated();
		}

		function mouseDown1(t) {
			if(true == t){
				if(!document.pointerLockElement) {
					GameUtils.requestPointerLock();
				}
			}
		}
		this.fwdBase = new Vector3(0,0,-1);
		this.leftBase = new Vector3(-1,0,0);

		this.direction = new Vector3(0,0,1);
		this.left = new Vector3(1,0,0);

		this.movement = new Vector3(1,0,0);

		Game.register("Update", this, this.update);
		Game.register("MouseMove", this, mouseMove);
		Game.register("MouseButton1", this, mouseDown1);
		// escape
		//Game.register("Key27", this, exitPointerLock);

	}
	FPSCamControlScript.prototype.setHeight = function(n0){
		cam.transformComponent.transform.translation.y = n0;
		cam.transformComponent.setUpdated();
	};
	
	FPSCamControlScript.prototype.update = function() {
			Vector3.add(entity.transformComponent.transform.translation, Vector3.UP, ray.origin);
			ray.direction = Vector3.DOWN;
			Game.picking.castRay(ray, function(hit){
				if(null != hit){
					room = hit.entity.navID;
				}
			}, 1);
			if(room != cam.room){
				if(room != -1){
					Game.raiseEvent("PlayerMoved", room, cam.transformComponent.transform.translation);
					entity.room = room;
				}
			}
	
			entity.transformComponent.transform.applyForwardVector( this.fwdBase, this.direction); // get the direction the camera is looking
			entity.transformComponent.transform.applyForwardVector( this.leftBase, this.left); // get the direction to the left of the camera
			
			this.movement.copy(Vector3.ZERO);

			if (true == Input.keys[87]) // W
				this.movement.add(this.direction);
			if (true == Input.keys[83]) // S
				this.movement.sub(this.direction);
			if (true == Input.keys[65]) // A
				this.movement.add(this.left);
			if (true == Input.keys[68]) // D
				this.movement.sub(this.left);
			if (true == Input.keys[32] && false == this.jump) { // space bar
				this.jump = true;
			}

			this.movement.y = 0; // don't allow flying around, stay on ground
			this.movement.normalize(); // move the same amount regardless of where we look
			entity.transformComponent.addTranslation(this.movement.scale(Time.dt*speed)); // move
	}

	return FPSCamControlScript;
});
