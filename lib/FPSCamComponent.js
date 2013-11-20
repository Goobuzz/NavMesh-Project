define([
	'goo/entities/components/Component',
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
	Component,
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
	var entityTransform;
	var cam;
	var camTransform;
	var speed = 5;
	var tmpVec = new Vector3();
	var fwdBase = new Vector3(0,0,-1);
	var leftBase = new Vector3(-1,0,0);
	var direction = new Vector3(0,0,1);
	var left = new Vector3(1,0,0);
	var movement = new Vector3(1,0,0);
	var grounded = false;
	var wantY = 0.0;
	var gravity = 20;

	var oldPos = new Vector3();
	var newPos = new Vector3();
	var oldRot = new Vector3();
	var newRot = new Vector3();

	function FPSCamComponent(){
		this.type = "FPSCamComponent";
		//entity = entityRef;
		entityTransform = Game.userEntity.transformComponent.transform;
		cam = EntityUtils.createTypicalEntity(Game.goo.world, new Camera(45, 1, 0.1, 100));
		Game.viewCam = cam;
		camTransform = cam.transformComponent.transform;
		cam.addToWorld();
		Game.userEntity.transformComponent.attachChild(cam.transformComponent);
		Game.userEntity.transformComponent.setUpdated();
		Game.register("MouseMove", this, mouseMove);
		Game.register("MouseButton1", this, mouseDown1);
		Game.register("FixedUpdate", this, fixedUpdate);
		Game.register("Update", this, update);
		Game.register("RenderUpdate", this, renderUpdate);
	};

	FPSCamComponent.prototype = Object.create(Component.prototype);
	FPSCamComponent.prototype.setHeight = function(n0){
		cam.transformComponent.transform.translation.y = n0;
		cam.transformComponent.setUpdated();
	};
		
	function mouseMove() {
		if(!document.pointerLockElement){return;}

		camTransform.rotation.toAngles(oldRot);
		newRot.x = oldRot.x - Input.movement.y * 0.005;
		newRot.x = Math.min(newRot.x, Math.PI*0.5);
		newRot.x = Math.max(newRot.x, -Math.PI*0.5);

		newRot.y = oldRot.y - Input.movement.x * 0.005;

		camTransform.rotation.fromAngles(newRot.x, newRot.y, newRot.z);
		cam.transformComponent.setUpdated();
	};

	function mouseDown1(t) {
		if(true == t){
			if(!document.pointerLockElement) {
				GameUtils.requestPointerLock();
			}
		}
	};

	function update(){
		if(room != Game.userEntity.room){
			if(room != -1){
				//Game.raiseEvent("PlayerMoved", room, entityTransform.translation);
				Game.userEntity.room = room;
			}
		}
	}

	function fixedUpdate(){
		grounded = false;
		oldPos.copy(newPos);
		newPos.y -= (gravity * Time.fixedDT);
		Vector3.add(newPos, Vector3.UP, ray.origin);
		ray.direction = Vector3.DOWN;
		Game.picking.castRay(ray, function(hit){
			if(null != hit){
				room = hit.entity.navID;
				if(hit.distance <= 1.0){
					grounded = true;
				}
				if(true == grounded){
					newPos.y = hit.point.y;
				}
			}
		}, 1);
		
		camTransform.applyForwardVector( fwdBase, direction); // get the direction the camera is looking
		camTransform.applyForwardVector( leftBase, left); // get the direction to the left of the camera

		movement.copy(Vector3.ZERO);

		if (true == Input.keys[87]) // W
			movement.add(direction);
		if (true == Input.keys[83]) // S
			movement.sub(direction);
		if (true == Input.keys[65]) // A
			movement.add(left);
		if (true == Input.keys[68]) // D
			movement.sub(left);
		if (true == Input.keys[32] && true == grounded) { // space bar
		}

		movement.y = 0;
		movement.normalize(); // move the same amount regardless of where we look-
		newPos.add(movement.scale(Time.fixedDT * speed));
	}

	function renderUpdate(){
		entityTransform.translation.x = (newPos.x * Time.alpha) + (oldPos.x * (1 - Time.alpha));
		entityTransform.translation.y = (newPos.y * Time.alpha) + (oldPos.y * (1 - Time.alpha));
		entityTransform.translation.z = (newPos.z * Time.alpha) + (oldPos.z * (1 - Time.alpha));
		Game.userEntity.transformComponent.setUpdated();
	}

	return FPSCamComponent;
});