
define(['goo/entities/EntityUtils', 'goo/math/Vector3', 'goo/renderer/TextureCreator', 'goo/renderer/Material', 'goo/renderer/shaders/ShaderLib',
		'goo/particles/ParticleUtils', 'goo/entities/components/ParticleComponent'], function( EntityUtils, Vector3, TextureCreator, Material, ShaderLib, ParticleUtils, ParticleComponent) {
	'use strict';

	function Blood( goo) {
	
		this.goo = goo;
	
		var particleTex = new TextureCreator().loadTexture2D('../res/flare.png');
		particleTex.generateMipmaps = true;
		
		//texture.wrapS = 'EdgeClamp';
		//texture.wrapT = 'EdgeClamp';

		var material = this.material = Material.createMaterial(ShaderLib.particles);
		material.setTexture('DIFFUSE_MAP', particleTex);
		material.blendState.blending = 'AlphaBlending'; // 'AdditiveBlending';
		material.cullState.enabled = false;
		material.depthState.write = false;
		material.renderQueue = 2001;
		
		this.config = {
			//particleCount : 200,
			timeline : [
				{timeOffset: 0.00, color: [1, 0, 0, 0.5], size: 0.3, spin: 0, mass: 0},
				//{timeOffset: 0.25, color: [1, 0, 0, 0.5], size: 50.0},
				//{timeOffset: 0.25, color: [1, 0, 0, 0.5], size: 100.0},
				{timeOffset: 0.25, color: [1, 0, 0, 0], size: 3.0,}
			],
			emitters : [{
				totalParticlesToSpawn : 1,
				releaseRatePerSecond : 5,
				minLifetime : 1.25,
				maxLifetime : 1.25,
				getEmissionVelocity : function (particle/*, particleEntity*/) {
					var vec3 = particle.velocity;
					return ParticleUtils.getRandomVelocityOffY(vec3, 0, Math.PI * 15 / 180, 5);
				}
			}]
		};

	}
	
	Blood.prototype.spawn = function( pos) {
		var particleComponent = new ParticleComponent(this.config);
		//particleComponent.emitters[0].influences.push(ParticleUtils.createConstantForce(new Vector3(0, -20, 0)));

		var entity = EntityUtils.createTypicalEntity( this.goo.world, this.material, particleComponent.meshData, [pos.x,pos.y,pos.z]);
		entity.meshRendererComponent.isPickable = false;
		entity.setComponent(particleComponent);
		entity.addToWorld();
		return entity;
	}

	return Blood;
});
