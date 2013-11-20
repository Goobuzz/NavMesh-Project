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
], function(
	Component,
	Game,
	EntityUtils,
	ShaderLib,
	TextureCreator,
	ShapeCreator,
	Material,
	HowlerSystem,
	HowlerComponent
) {
	'use strict';
	var shotgun;
	var sound;
	function ShotgunComponent(){
		this.type = "ShotgunComponent";
		sound = new Howl({urls: ["res/sounds/ssg.ogg", "res/sounds/ssg.mp3"], volume:1.0});
		
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
	};
	function mouseButton1(bool0){
		//console.log(bool0);
		if(true == bool0){
			//console.log("bam");
			if(document.pointerLockElement) {
				sound.play();
				shotgun.transformComponent.setRotation( 0.35, 0.1, 0);
				setTimeout( resetSSG, 250);
				var w = Game.goo.renderer.viewportWidth;
				var h = Game.goo.renderer.viewportHeight;
				var x = w / 2;
				var y = h / 2;
				Game.goo.pick( x, y, function( id, depth){
					if( id < 0)
						return;
					console.log( depth);

					var pos = Game.viewCam.cameraComponent.camera.getWorldCoordinates( x, y, w, h, depth);
					//blood.spawn([pos.x,pos.y,pos.z]);
					var entity = Game.goo.world.entityManager.getEntityById(id);
				});
			}
		}
	};
	return ShotgunComponent;
});