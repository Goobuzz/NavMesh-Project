define(['js/sphereMovement'],
    function(
        SphereMovement
        ) {
        "use strict";


        function SphereSpatial(sphereEntity) {
            this.torqueVector = new Ammo.btVector3(0, 0, 0);
            this.sphereEntity = sphereEntity;
            this.ammoComponent = this.sphereEntity.ammoComponent;
            this.sphereMovement = new SphereMovement();
            this.timeout;
        }

        SphereSpatial.prototype.applyMovementState = function(selection) {
            switch (selection) {
                case 1:
                    this.sphereMovement.applyForward(Math.round(1-Math.random()*2));
                    break;
                case 2:
                    this.sphereMovement.applyStrafe(Math.round(1-Math.random()*2));
                    break;
                case 3:
                    this.sphereMovement.applyJump(1);
                    break;
                case 4:
                    this.sphereMovement.applyTurn(1-Math.random()*2);
                    break;
            }
        };

        SphereSpatial.prototype.selectMovementState = function() {
            return Math.ceil(Math.random()*4);
        };

        SphereSpatial.prototype.remove = function(){
            clearTimeout(this.timeout);
        }

        SphereSpatial.prototype.walk = function() {
       //     console.log("Walk the sphere: ", this.sphereEntity)

            this.applyMovementState(this.selectMovementState());
            this.sphereMovement.updateTargetVectors();
            var targetVelocity = this.sphereMovement.getTargetVelocity();

            // This torqueVector currently applies arbitrary directional rotation to the sphere. This needs
            // to know the orientation of the gamepiece to roll it in the correct direction.
            this.torqueVector.setValue(0,0,0);
            this.ammoComponent.setAngularVelocity(this.torqueVector);

            this.torqueVector.setValue(targetVelocity.data[0], targetVelocity.data[1],targetVelocity.data[2]);

            this.ammoComponent.clearForces();

            this.ammoComponent.applyTorqueImpulse(this.torqueVector);

            if(targetVelocity.data[1] != 0) {
                this.torqueVector.setValue(0, targetVelocity.data[1], 0);
                this.ammoComponent.applyCentralImpulse(this.torqueVector)
            }
            this.ammoComponent.activate();
            this.update();
        };

        SphereSpatial.prototype.update = function() {

            var instance = this;

            function doWalk() {
                instance.walk()
            };

            this.timeout = setTimeout(function() {
                doWalk();
            }, 2000)


        };

        return SphereSpatial;

    }
)