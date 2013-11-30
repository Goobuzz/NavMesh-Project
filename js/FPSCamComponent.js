define([
	'goo/entities/components/Component',
	'goo/math/Vector3',
	'goo/util/GameUtils',
	'js/Input',
	'js/Game',
	'js/Time',
	'goo/math/Ray',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/EntityUtils',
	'js/sphereMovement'
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
	SphereMovement
) {
	'use strict';
	function FPSCamComponent(userEntity){
		this.type = "FPSCamComponent";

		this.ray = new Ray();
		//var room = -1;

		this.speed = 5;
		//this.fwdBase = new Vector3(-1,0,0);
		//this.leftBase = new Vector3(0,0,1);
		this.fwdBase = new Vector3(0,0,-1);
		this.leftBase = new Vector3(-1,0,0);

		this.direction = new Vector3(0,0,1);
		this.left = new Vector3(1,0,0);
		this.movement = new Vector3(1,0,0);
		this.grounded = false;
		//var wantY = 0.0;
		//var gravity = 20;

		this.oldPos = new Vector3();
		this.newPos = new Vector3();
		this.oldVelocity = new Vector3();
		this.oldYaw = 0;
		this.newYaw = 0;
		this.radRot = 0.0;
		this.oldPitch = 0;
		this.newPitch = 0;

		this.torqueVector = new Ammo.btVector3(0, 0, 0);
        this.ammoComponent = userEntity.ammoComponent;
       // this.sphereMovement = new SphereMovement();

		this.moveEntity = userEntity;
		this.moveTransform = userEntity.transformComponent.transform;

		this.cam = EntityUtils.createTypicalEntity(Game.goo.world, new Camera(45, 1.0, 0.01, 130));
		Game.viewCam = this.cam;
		this.camTransform = this.cam.transformComponent.transform;
		this.cam.addToWorld();
		
		this.moveEntity.transformComponent.attachChild(this.cam.transformComponent);
		this.moveEntity.transformComponent.setUpdated();
		Game.register("MouseMove", this, mouseMove);
		Game.register("MouseButton1", this, mouseDown1);
		Game.register("FixedUpdate", this, fixedUpdate);
		Game.register("Update", this, update);
		Game.register("RenderUpdate", this, renderUpdate);
	};

	FPSCamComponent.prototype = Object.create(Component.prototype);
	FPSCamComponent.prototype.setHeight = function(n0){
		this.cam.transformComponent.transform.translation.y = n0;
		this.cam.transformComponent.setUpdated();
	};
		
	function mouseMove() {
		if(!document.pointerLockElement){return;}
		
		this.newPitch = this.oldPitch - Input.movement.y * 0.005;

		if(this.newPitch > Math.PI*0.5){
			this.newPitch = Math.PI*0.5;
		}
		if(this.newPitch < -Math.PI*0.5){
			this.newPitch = -Math.PI*0.5;
		}

		this.newYaw = this.oldYaw - Input.movement.x * 0.005;
		this.radRot = this.newYaw * (Math.PI/180);
	};

	function mouseDown1(t) {
		if(true == t){
			if(!document.pointerLockElement) {
				GameUtils.requestPointerLock();
			}
		}
	};

	function update(){
		//console.log(this.newPos.x+","+this.newPos.z);
		//if(this.room != Game.userEntity.room){
	//		if(this.room != -1){
			//	console.log("userEntity was in "+Game.userEntity.room+" now it is in "+room);
	//			Game.raiseEvent("PlayerMoved", this.room, this.sphereTransform.translation);
	//			Game.userEntity.room = this.room;
	//		}
		//}
	}
	var calcVec = new Vector3();
	function fixedUpdate(){
           // console.log("Walk the sphere: ", this.sphereEntity)
            var self = this;
            this.grounded = false;
            this.oldYaw = this.newYaw;
            this.oldPitch = this.newPitch; 
			this.oldPos.copy(this.newPos);

            //zombieTransform.transform.translation.set(physTransform.transform.translation);
            //zombieTransform.setUpdated();

			this.moveTransform.applyForwardVector( this.fwdBase, this.direction); // get the direction the camera is looking
			this.moveTransform.applyForwardVector( this.leftBase, this.left); // get the direction to the left of the camera

			this.movement.copy(Vector3.ZERO);

			if (true == Input.keys[87]) // W
				this.movement.add(this.direction);
			if (true == Input.keys[83]) // S
				this.movement.sub(this.direction);
			if (true == Input.keys[65]) // A
				this.movement.add(this.left);
			if (true == Input.keys[68]) // D
				this.movement.sub(this.left);
			
			this.movement.normalize(); // move the same amount regardless of where we look-

			this.movement.y = this.ammoComponent.getLinearVelocity().y();
			this.ray.origin.copy(this.newPos);
			this.ray.origin.y += 1.0;
			this.ray.direction = Vector3.DOWN;
			Game.castRay(this.ray, function(hit){
				if(null != hit){
					//console.log(hit.entity.name);
					//console.log(hit.distance);
					if(hit.distance <= 1.9001){
						self.grounded = true;
					}
				}
			}, 1);
			if (true == Input.keys[32] && true == this.grounded) { // space bar
				// (2 * gravity * height)*mass
				this.movement.y = Math.sqrt(2*12*1.0)*1.5;
			}

          	//this.applyMovementState(this.selectMovementState());
          //	this.sphereMovement.applyForward(this.movement.z * this.speed * Math.cos(this.sphereMovement.controlState.yaw * (Math.PI/180)));
		//	this.sphereMovement.applyStrafe(this.movement.x * this.speed * Math.sin(this.sphereMovement.controlState.yaw * (Math.PI/180)));

         //   this.sphereMovement.updateTargetVectors();
          //  var targetVelocity = this.sphereMovement.getTargetVelocity();
            // This torqueVector currently applies arbitrary directional rotation to the sphere. This needs
            // to know the orientation of the gamepiece to roll it in the correct direction.
          	
          	this.torqueVector.setValue(
          		this.movement.x * this.speed,
          		this.movement.y,
          		this.movement.z * this.speed);

          	this.ammoComponent.setLinearVelocity(this.torqueVector);

          	//this.torqueVector.setValue(0,0,0);
          	//this.ammoComponent.setAngularVelocity(this.torqueVector);
           	
           	//this.torqueVector.setValue(targetVelocity.data[0], targetVelocity.data[1], targetVelocity.data[2]);
          	
			//this.ammoComponent.clearForces();
			//this.ammoComponent.applyTorqueImpulse(this.torqueVector);

          	//if(targetVelocity.data[1] != 0) {
            //    this.torqueVector.setValue(0, targetVelocity.data[1], 0);
             //   this.ammoComponent.applyCentralImpulse(this.torqueVector)
           	//}
            //this.ammoComponent.activate();
            this.ammoComponent.getMotionState().getWorldTransform(Game.physTransform);
            var origin = Game.physTransform.getOrigin();
            this.newPos.x = origin.x();
            this.newPos.y = origin.y();
            this.newPos.z = origin.z();
	};

	function renderUpdate(){
		this.camTransform.rotation.fromAngles(
			(Time.alpha * this.newPitch) + (this.oldPitch * (1-Time.alpha)),
			0,
			0);
		this.cam.transformComponent.setUpdated();

		this.moveTransform.rotation.fromAngles(
			0,
			(Time.alpha * this.newYaw) + (this.oldYaw * (1-Time.alpha)),
			0);

		this.moveEntity.transformComponent.setTranslation(
			(Time.alpha * this.newPos.x) + (this.oldPos.x * (1-Time.alpha)),
			(Time.alpha * this.newPos.y) + (this.oldPos.y * (1-Time.alpha)),
			(Time.alpha * this.newPos.z) + (this.oldPos.z * (1-Time.alpha)));
		this.moveEntity.transformComponent.setUpdated();
	};

	return FPSCamComponent;
});