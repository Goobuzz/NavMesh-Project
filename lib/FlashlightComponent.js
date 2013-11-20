define([
	'goo/entities/components/Component',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/SpotLight',
	'lib/Game'
], function(
	Component,
	LightComponent,
	SpotLight,
	Game
) {
	'use strict';
	function FlashlightComponent(){
		this.type = "FlashlightComponent";
		var spotLight = new SpotLight();
		spotLight.angle = 25;
		//spotLight.range = 10;
		spotLight.penumbra = 5;
		spotLight.intensity = 1;

		var spotLightEntity = Game.goo.world.createEntity('FlashLight');
		spotLightEntity.setComponent(new LightComponent(spotLight));
		spotLightEntity.addToWorld();

		Game.viewCam.transformComponent.attachChild( spotLightEntity.transformComponent);
	}
	FlashlightComponent.prototype = Object.create(Component.prototype);
	return FlashlightComponent;
});