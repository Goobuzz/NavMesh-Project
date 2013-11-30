define([
	'goo/entities/components/Component',
	'js/Game'
], function(
	Component,
	Game
){

	function HealthComponent(ent, n0){
		this.type = "HealthComponent";
		this.entity = ent;
		this.maxHealth = this.currentHealth = n0;
		//Game.register(ent.id+"_TakeDamage", this, applyDamage);
	}
	HealthComponent.prototype = Object.create(Component.prototype);
	HealthComponent.prototype.applyDamage = function(n0){
		this.currentHealth -= n0;
		//console.log("Removing:"+n0+" health.");
		if(this.currentHealth <= 0){
			this.currentHealth = 0;
		}
		//console.log(this.currentHealth+"/"+this.maxHealth+" left.");
	}
	HealthComponent.prototype.resetHealth = function(){
		this.currentHealth = this.maxHealth;
	}
	return HealthComponent;
});