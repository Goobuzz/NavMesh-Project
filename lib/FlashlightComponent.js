define([
	'goo/entities/components/Component',
	'goo/entities/components/LightComponent',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/light/SpotLight',
	'goo/noise/ValueNoise',
	'lib/Game'
], function(
	Component,
	LightComponent,
	ScriptComponent,
	SpotLight,
	ValueNoise,
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
		spotLight.color.setd(1.0, 0.6, 0.3);

		var spotLightEntity = Game.goo.world.createEntity('FlashLight');
		spotLightEntity.setComponent(new LightComponent(spotLight));
		var script = new ScriptComponent();
		var time = 0;
		script.run = function(entity, tpf, environment) {
			time += tpf;
			var rotY = (ValueNoise.evaluate1d(time, 1.1) - .5) * .15;
			var rotX = (ValueNoise.evaluate1d(time, 1.3) - .5) * .13;
			var posX = (ValueNoise.evaluate1d(time + 11919, 1.3) - .5) * .2;
			var posY = (ValueNoise.evaluate1d(time + 31900, 1.3) - .5) * .2;
			spotLightEntity.transformComponent.transform.translation.setd(posX, posY, 0);
			spotLightEntity.transformComponent.setRotation(rotX, rotY, 0);
			spotLightEntity.transformComponent.setUpdated();

			spotLight.intensity = (ValueNoise.evaluate1d(time, 2.3) - .5) * .2;;
		}
		spotLightEntity.setComponent(script);

		spotLightEntity.addToWorld();

		Game.viewCam.transformComponent.attachChild( spotLightEntity.transformComponent);
	}
	FlashlightComponent.prototype = Object.create(Component.prototype);
	return FlashlightComponent;
});