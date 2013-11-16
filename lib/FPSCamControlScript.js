
define(['goo/math/Vector3', 'goo/util/GameUtils', 'lib/Input', 'lib/Game', 'lib/Time'], function(Vector3, GameUtils, Input, Game, Time) {
	'use strict';

	function FPSCamControlScript(cam) {
		this.cam = cam;
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
		this.speed = 10;
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
	
	FPSCamControlScript.prototype.update = function() {
			var room = Game.getRoomID(this.cam.transformComponent.transform.translation);
			if(room != this.room){
				if(room != -1){
					console.log("was in room "+this.room+" now in room "+room);
					Game.raiseEvent("PlayerMoved", room, this.cam.transformComponent.transform.translation);
					this.room = room;
				}
			}
	
			this.cam.transformComponent.transform.applyForwardVector( this.fwdBase, this.direction); // get the direction the camera is looking
			this.cam.transformComponent.transform.applyForwardVector( this.leftBase, this.left); // get the direction to the left of the camera
			
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
			this.cam.transformComponent.addTranslation(this.movement.scale(Time.dt*this.speed)); // move
	}

	return FPSCamControlScript;
});
