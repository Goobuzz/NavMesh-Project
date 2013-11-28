define([
	'goo/entities/components/Component',
	'lib/Game',
	'goo/entities/EntityUtils',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/TextureCreator',
	'goo/shapes/ShapeCreator',
	'goo/renderer/Material',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/addons/howler/components/HowlerComponent',
	'goo/math/Ray',
	'goo/math/Vector3',
	'lib/Blood'

], function(
	Component,
	Game,
	EntityUtils,
	ShaderLib,
	TextureCreator,
	ShapeCreator,
	Material,
	HowlerSystem,
	HowlerComponent,
	Ray,
	Vector3,
	Blood
) {
	'use strict';
	var shotgun;
	var sound;
	function ShotgunComponent(){
		this.type = "ShotgunComponent";
		sound = new Howl({urls: ["res/sounds/ssg.ogg", "res/sounds/ssg.mp3"], volume:0.3});
		
		var mesh = ShapeCreator.createCylinder( 30, 2);
		var mat = Material.createMaterial( ShaderLib.simpleLit, 'BoxMaterial');
		var barrelLeft = EntityUtils.createTypicalEntity( Game.goo.world, mesh, mat);
		barrelLeft.addToWorld();
		barrelLeft.transformComponent.setTranslation( 1.5, 0, 0);

		var barrelRight = EntityUtils.createTypicalEntity( Game.goo.world, mesh, mat);
		barrelRight.addToWorld();
		barrelRight.transformComponent.setTranslation( -1.5, 0, 0 );

		shotgun = EntityUtils.createTypicalEntity( Game.goo.world);
		shotgun.addToWorld();

		shotgun.transformComponent.attachChild( barrelLeft.transformComponent);
		shotgun.transformComponent.attachChild( barrelRight.transformComponent);

		shotgun.transformComponent.setTranslation( .2, -.23, -.55 );
		shotgun.transformComponent.setScale( .01, .01, .55); // make the barrels long

		shotgun.transformComponent.setRotation( 0.15, 0.1, 0); // rotate the shotty a bit.
		Game.viewCam.transformComponent.attachChild(shotgun.transformComponent);
		Game.viewCam.transformComponent.setUpdated();
		Game.register("MouseButton1", this, mouseButton1);
	}
	ShotgunComponent.prototype = Object.create(Component.prototype);

	function resetSSG() {
		shotgun.transformComponent.setRotation( 0.15, 0.1, 0);
	}
	
	var blood;
	
	var pickingStore = {};
	var md_pos = new Vector3();
	var md_dir = new Vector3();
	var md_ray = new Ray();
	function pellet( camera, x, y, w, h) {
		
		blood = blood || new Blood(Game.goo);
		
		Game.goo.renderer.pick( x, y, pickingStore, camera);
		if( pickingStore.id == -1)
			return;
		camera.getPickRay( x, y, w, h, md_ray);
		md_ray.direction.mul( pickingStore.depth);
		md_ray.origin.add( md_ray.direction);
		
		var entity = Game.goo.world.entityManager.getEntityById(pickingStore.id);
		
		if( ! entity.transformComponent.parent )
			return;

		var p = entity.transformComponent.parent.entity;
		if( ! p.animationComponent )
			return;
		//var eac = p.animationComponent;

		blood.spawn(md_ray.origin);

		console.log(p);

		p.transformComponent.children[0].entity.healthComponent.applyDamage(7);
		
		//if( entity.dmg) entity.dmg += 7; else entity.dmg = 7;
		//if( entity.dmg && entity.dmg == 7) {
			//eac.transitionTo( eac.getStates()[1]); // idle, injured_walk, uppercut_jab, dying
		//}
		//if( entity.dmg && entity.dmg > 100) {
		//	eac.layers[0]._steadyStates['mixamo_com__']._sourceTree._clipInstance._loopCount=1;
		//	eac.transitionTo( eac.getStates()[3]); // idle, injured_walk, uppercut_jab, dying
		//	entity.aIComponent.setActiveByName("Zombie-PathFind", false);
		//}
	}
	
	function randInt(max) {
		return Math.floor(Math.random()*max);
	}
	function randBlood() {
		return randInt(200)-100;
	}

	function mouseButton1(bool0){
		//console.log(bool0);
		if(true == bool0){
			//console.log("bam");
			if(document.pointerLockElement) {
				//console.log( Game.userEntity.transformComponent.transform.translation.data );
				sound.play();
				shotgun.transformComponent.setRotation( 0.35, 0.1, 0);
				setTimeout( resetSSG, 250);
				var w = Game.goo.renderer.viewportWidth;
				var h = Game.goo.renderer.viewportHeight;
				var x = w / 2;
				var y = h / 2;
				Game.goo.pick( x, y, function( id, depth){
					if( id < 0){return;}
					var camera = Game.viewCam.cameraComponent.camera
					for( var i=0; i<10; i++) {
						pellet( camera, x+randBlood(), y+randBlood(), w, h);
					}
				});
			}
		}
	}
	return ShotgunComponent;
});