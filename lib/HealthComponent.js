define([
	'goo/entities/components/Component'
], function(
	Component
){

	function HealthComponent(ent, n0){
		this.type = "HealthComponent";
		this.entity = ent;
		this.maxHealth = this.currentHealth = n0;
	}
	HealthComponent.prototype = Object.create(Component.prototype);
	HealthComponent.prototype.applyDamage = function(n0){
		this.currentHealth -= n0;
		console.log("Removing:"+n0+" health.");
		console.log(this.currentHealth+"/"+this.maxHealth+" left.");
		if(this.currentHealth <= 0){

			this.entity.aIComponent.getBehaviorByName("Death").active = true;
		}
	}
	HealthComponent.prototype.resetHealth = function(){
		this.currentHealth = this.maxHealth;
	}
	return HealthComponent;
});