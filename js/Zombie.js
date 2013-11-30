define([
	'js/Game',
	'js/HealthComponent',
	'goo/shapes/ShapeCreator',
	'goo/renderer/Material',
	'goo/entities/EntityUtils',
	'goo/math/Quaternion',
	'goo/math/Vector3',
	'js/SphereSpatial',
	'js/SphereMovement',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/shaders/ShaderLib'

], function(
	Game,
	HealthComponent,
	ShapeCreator,
	Material,
	EntityUtils,
	Quaternion,
	Vector3,
	SphereSpatial,
	SphereMovement,
	ScriptComponent,
	ShaderLib
){
	var quaternion = new Quaternion;
	var btVec = new Ammo.btVector3();
	var calcVec = new Vector3();
	var Zombie = function(){};
	Zombie.ref = null;

	var radius = 0.7;
	var count = 0;

	var spawnVerts = [
	28,21,
	33.7,10.7,
	34.7,-9.3,
	15.24,-9.27,
	2.95,-11.32,
	3.8,-23.24,
	-12.72, -22.5,
	-12.89, -13.69,
	-13, 26.54,
	-4.9, 11.68,
	5.3, 16.47,
	3.8, 9.9];

	Zombie.create = function(n0, n1, n2){
		var z = Game.goo.world.createEntity("Zombie:"+(count++));
		z.addToWorld();
		z.ammoComponent = createAmmoJSSphere(n0, n1, n2);
		z.setComponent(createAmmoComponentScript());
		addZombieToMobile(z);
		var spatialControl = new SphereSpatial(z);
		z.spatialControl = spatialControl;
		//var movableSphere = spawnSphere();
       // addZombieToMobile(movableSphere);
        //var spatialControl = new SphereSpatial(movableSphere);
      //  movableSphere.spatialControl = spatialControl;
        spatialControl.walk();
        return z;
	}

	Zombie.spawn = function(){
		var v = Math.floor(Math.random()*12)*2;
		//console.log(v+":"+(v+1));
		Zombie.create(spawnVerts[v], 0, spawnVerts[v+1]);
	};

	function spawnSphere(){
		//var radius = 0.7;
		//var sphereMesh = ShapeCreator.createSphere(16, 16, radius);
		//var material = Material.createMaterial(ShaderLib.simpleLit);
		//var sphereEntity = EntityUtils.createTypicalEntity(Game.goo.world, sphereMesh, material);
		//sphereEntity.ammoComponent = createAmmoJSSphere(radius);
		//sphereEntity.setComponent(createAmmoComponentScript());
		//sphereEntity.addToWorld();
      //  return sphereEntity;
	};

	function addZombieToMobile(sphereEntity) {
        var zombie = spawnZombie();
        var attachToSphereScript = new ScriptComponent();

        var moveParent = EntityUtils.createTypicalEntity(Game.goo.world);
        moveParent.transformComponent.attachChild(zombie.transformComponent);
        moveParent.sphereEntity = sphereEntity;
        zombie.transformComponent.transform.translation.sub_d(0, 0.7, 0);
        moveParent.addToWorld();

        attachToSphereScript.run = function(entity, tpf) {
            var zombieTransform = entity.getComponent("transformComponent");
            var physTransform = sphereEntity.getComponent("transformComponent");

			// TODO: This sphereentity now is different each time , making the velocity wrong.
			// have to fix this somehow...
			var v = sphereEntity.ammoComponent.getLinearVelocity();
			btVec.setValue(v.getX(), 0, v.getZ());
			var vel = btVec.length();

            calcVec.set(physTransform.transform.translation);
            calcVec.sub(zombieTransform.transform.translation);
			calcVec.y=0;
            var speed = Math.sqrt(calcVec.lengthSquared());
            if (speed > 0.01) {
				calcVec.data[1] = 0.0;
                zombieTransform.transform.rotation.lookAt(calcVec, Vector3.UNIT_Y);
				zombie.animationComponent.setTimeScale(vel);
            }

            zombieTransform.transform.translation.set(physTransform.transform.translation);
            zombieTransform.setUpdated();
        };
        moveParent.setComponent(attachToSphereScript);
    };

    function spawnZombie(){
		var z = EntityUtils.clone(Game.goo.world, Zombie.ref);
		z.setComponent(new HealthComponent(z, 50));
		Game.register(z.id+"_Dead", z, destroyZombie);
		z.addToWorld();
		return z;
	}

	function createAmmoJSSphere(n0, n1, n2) {
		n0=n0||0;
		n1=n1||0;
		n2=n2||0;
		var mass = 1 // radius * radius * radius;
		var startTransform = new Ammo.btTransform();
		startTransform.setIdentity();
		startTransform.getOrigin().setX(n0);
		startTransform.getOrigin().setY(n1+radius);
		startTransform.getOrigin().setZ(n2);
	    var localInertia = new Ammo.btVector3(0, 0, 0);
		var shape = new Ammo.btSphereShape(radius);
		shape.calculateLocalInertia( mass, localInertia );
		var motionState = new Ammo.btDefaultMotionState( startTransform );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
		var rBody = new Ammo.btRigidBody( rbInfo );
		Game.ammoWorld.addRigidBody(rBody);
		return rBody;
	};

	function createAmmoComponentScript() {
		var script = new ScriptComponent();
		script.run = function(entity, tpf, environment) {
			var transformComp = entity.getComponent("transformComponent");
			entity.ammoComponent.getMotionState().getWorldTransform(Game.physTransform);
			var origin = Game.physTransform.getOrigin();
			transformComp.setTranslation(origin.x(), origin.y(), origin.z());
			var pquat = Game.physTransform.getRotation();
			quaternion.setd(pquat.x(), pquat.y(), pquat.z(), pquat.w());
			transformComp.transform.rotation.copyQuaternion(quaternion);
		};
		return script
	};

	function destroyZombie(){
		//console.log("Need to destroy zombie here");

    	//var p = this.transformComponent.parent.entity;

    	//Game.ammoWorld.removeRigidBody(p.sphereEntity.ammoComponent);
    	//destroy(p.sphereEntity.ammoComponent);
    	//p.sphereEntity.spatialControl.remove();
    	//delete p.sphereEntity.spatialControl;
    	//p.sphereEntity.removeFromWorld();
    	//p.removeFromWorld();
    	Zombie.setNewSpawn(this.transformComponent.parent.entity);
	};

	Zombie.setNewSpawn = function(ent){
		var v = Math.floor(Math.random()*12)*2;
		//console.log(ent);
		//console.log(v+","+(v+1));
		btVec.x = spawnVerts[v];
		btVec.y = 0;
		btVec.z = spawnVerts[v+1];
		ent.sphereEntity.ammoComponent.getCenterOfMassTransform(Game.physTransform);
		Game.physTransform.setOrigin(new Ammo.btVector3(btVec.x, btVec.y, btVec.z));
		ent.sphereEntity.ammoComponent.setCenterOfMassTransform(Game.physTransform);

		//ent.transformComponent.setTranslation(origin.x(), origin.y(), origin.z());
		ent.transformComponent.setUpdated();
		ent.transformComponent.children[0].entity.transformComponent.setUpdated();

		ent.transformComponent.children[0].entity.healthComponent.resetHealth();
	}
	return Zombie;
});
