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
	'goo/entities/EntityUtils',
	'goo/math/Plane'
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
	EntityUtils,
	Plane
) {
	'use strict';
	var ray = new Ray();
	var room = -1;
	var entityTransform;
	var cam;
	var camTransform;
	var speed = 10;
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

	var stepHeight = new Vector3(0,1.5,0);
	//var wantPos = new Vector3(0,0,0);

	function FPSCamComponent(){
		this.type = "FPSCamComponent";
		//entity = entityRef;
		entityTransform = Game.userEntity.transformComponent.transform;
		cam = EntityUtils.createTypicalEntity(Game.goo.world, new Camera(45, 1.0, 0.01, 130));
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
				console.log("userEntity was in "+Game.userEntity.room+" now it is in "+room);
				Game.raiseEvent("PlayerMoved", room, entityTransform.translation);
				Game.userEntity.room = room;
			}
		}
	}

	function fixedUpdate(){
		grounded = false;
		oldPos.copy(newPos);
		//wantPos.copy(newPos);

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

		//wantPos.add(movement.scale(Time.fixedDT * speed));

		Vector3.add(Game.userEntity.transformComponent.transform.translation, stepHeight, ray.origin);
		ray.direction.copy(movement);
		Game.picking.castRay(ray, function(hit1){
			if(null != hit1){
				if(hit1.distance < 0.5){
					//console.log("1st hit "+hit1.entity.name + " @ "+hit1.distance);
					//var p1 = new Plane();
					//p1.normal.set(hit1.vertex[1]).sub(hit1.vertex[0]);
					//p1.normal.cross(new Vector3(hit1.vertex[2].x - hit1.vertex[0].x, hit1.vertex[2].y - hit1.vertex[0].y, hit1.vertex[2].z - hit1.vertex[0].z)).normalize();
					tmpVec = Vector3.cross(hit1.normal, movement);
					movement = Vector3.cross(tmpVec, hit1.normal);
					var name = hit1.entity.name;

					Vector3.add(newPos, stepHeight, ray.origin);
					ray.direction.copy(movement);
					Game.picking.castRay(ray, function(hit2){
						if(null != hit2){
							if(hit2.distance < 0.5){
								if(hit2.entity.name != hit1.entity.name){
								//console.log("2nd hit "+hit2.entity.name + " @ "+hit2.distance);
								//var p2 = new Plane();
								//p2.normal.set(hit2.vertex[1]).sub(hit2.vertex[0]);
								//p2.normal.cross(new Vector3(hit2.vertex[2].x - hit2.vertex[0].x, hit2.vertex[2].y - hit2.vertex[0].y, hit2.vertex[2].z - hit2.vertex[0].z)).normalize();
								tmpVec = Vector3.cross(hit2.normal, movement);
								movement = Vector3.cross(tmpVec, hit2.normal);
							}}
						}
					}, 2);
				}
			}
		}, 2);
		newPos.add(movement.scale(Time.fixedDT * speed));

		newPos.y -= (gravity * Time.fixedDT);
		Vector3.add(newPos, Vector3.UP, ray.origin);
		ray.direction.copy(Vector3.DOWN);
		Game.picking.castRay(ray, function(hit0){
			if(null != hit0){
				room = hit0.entity.navID;
				if(hit0.distance <= 1.0){
					grounded = true;
				}
				if(true == grounded){
					newPos.y = hit0.point.y;
				}
			}
		}, 1);
	}

	function renderUpdate(){
		entityTransform.translation.x = (newPos.x * Time.alpha) + (oldPos.x * (1 - Time.alpha));
		entityTransform.translation.y = (newPos.y * Time.alpha) + (oldPos.y * (1 - Time.alpha));
		entityTransform.translation.z = (newPos.z * Time.alpha) + (oldPos.z * (1 - Time.alpha));
		Game.userEntity.transformComponent.setUpdated();
	}

	return FPSCamComponent;
});