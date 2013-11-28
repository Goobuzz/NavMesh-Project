define([
	'goo/entities/EntityUtils',
	'lib/Game',
	'goo/math/Vector3',
	'goo/math/Ray',
	'lib/AIComponent',
	'lib/HealthComponent',
	'lib/Time',
	'goo/loaders/DynamicLoader',
	'goo/util/rsvp'
], function(
	EntityUtils,
	Game,
	Vector3,
	Ray,
	AIComponent,
	HealthComponent,
	Time,
	DynamicLoader,
	RSVP
){
	"use strict";
	var zLoader = [];
	
	var zRef = [];
	var ray = new Ray();
	var count = 0;
	var health = 50;
	function Zombie(){}

	//Zombie.zRef = [];
	//Zombie.ray = new Ray();
	//Zombie.count = 0;
	//Zombie.health = 50;

	Zombie.getRef = function(){
		if(zRef.length > 0){
			var z = zRef.shift();

			return z;
		}
	}

	Zombie.setupRefs = function(promises){
		console.log("count at time of creation is "+count);
		var l0 = new DynamicLoader({world: Game.goo.world, rootPath: 'res'});
		promises.push(l0.loadFromBundle('project.project', 'zombie.bundle'));
		zLoader.push(l0);
		
		var l1 = new DynamicLoader({world: Game.goo.world, rootPath: 'res'});
		promises.push(l1.loadFromBundle('project.project', 'zombie.bundle'));
		zLoader.push(l1);

		var l2 = new DynamicLoader({world: Game.goo.world, rootPath: 'res'});
		promises.push(l2.loadFromBundle('project.project', 'zombie.bundle'));
		zLoader.push(l2);

		var l3 = new DynamicLoader({world: Game.goo.world, rootPath: 'res'});
		promises.push(l3.loadFromBundle('project.project', 'zombie.bundle'));
		zLoader.push(l3);

		var l4 = new DynamicLoader({world: Game.goo.world, rootPath: 'res'});
		promises.push(l4.loadFromBundle('project.project', 'zombie.bundle'));
		zLoader.push(l4);

		RSVP.all(promises)
		.then(function(){
			for(var i = 0, ilen = zLoader.length; i < ilen;i++){
				var z = zLoader[i].getCachedObjectForRef("zombie_idle/entities/Zombie_Geo_0.entity");
				z.name = "Zombie:"+(count++);
				z.setComponent(new AIComponent(z));
				z.setComponent(new HealthComponent(z, health));
				z.aIComponent.addBehavior({name:"Death", update:Zombie.Death, blocking:true, active:false}, 0);
				z.aIComponent.addBehavior({name:"Idle", update:Zombie.Idle, blocking:true, active:false}, 10);
				z.aIComponent.addBehavior({name:"PathFind", update:Zombie.PathFind, blocking:true, active:false}, 20);
				z.skip = true;
				zRef.push(z);
				//z.removeFromWorld();
			}
		}).then(null, function(e){});
	}

	Zombie.Death = function(entity, node){
		switch(node.state){
			case -1:
				Game.unregister("PlayerMoved", entity);
				console.log("Starting Death State");
				var eac = entity.transformComponent.parent.entity.animationComponent;
				eac.layers[0]._steadyStates['mixamo_com__']._sourceTree._clipInstance._loopCount=1;
				eac.transitionTo( eac.getStates()[3]); // idle, injured_walk, uppercut_jab, dying
				node.fadeTime = Time.time+5.0;
				node.state = 0;
				break;
			case 0:
				if(node.fadeTime < Time.time){
					entity.skip = true;
					entity.aIComponent.getBehaviorByName("Death").active = false;
					entity.aIComponent.getBehaviorByName("Idle").state = -1;
					entity.aIComponent.getBehaviorByName("Idle").active = true;
					entity.aIComponent.getBehaviorByName("PathFind").active = false;
					entity.healthComponent.resetHealth();
					node.state = null;
					zRef.push(entity);
					var z = Zombie.getRef();
					z.aIComponent.getBehaviorByName("Idle").state = 0;
					z.transformComponent.setTranslation((Math.random()*10)-5,0,(Math.random()*10)-5);
					z.transformComponent.setUpdated();
				}
				break;

			default:
				node.state = -1;
				break;
		}
	};
	Zombie.Idle = function(entity, node){
		switch(node.state){
			case -1:
				// waiting to respawn
				break;
			case 0:
				entity.skip = false;
				Vector3.add(entity.transformComponent.transform.translation, Vector3.UP, ray.origin);
				ray.direction = Vector3.DOWN;
				Game.picking.castRay(ray, function(hit){
					if(null != hit){
						entity.room = hit.entity.navID;
					}
				}, 1);
				var eac = entity.transformComponent.parent.entity.animationComponent;
				eac.layers[0]._steadyStates['mixamo_com__']._sourceTree._clipInstance._loopCount=0;
				eac.transitionTo( eac.getStates()[0]); // idle, injured_walk, uppercut_jab, dying
				node.state = 1;
				break;
			case 1:
				// if player near...
				node.active = false;
				entity.aIComponent.getBehaviorByName("PathFind").active = true;
				break;
			default:
				node.state = 0;
				break;
		}
	};

	Zombie.FollowUser = function(entity, node){

	};

	Zombie.AttackUser = function(entity, node){

	};

	Zombie.PathFind = function(entity, node){
		function playerMoved(room, pos){
			console.log("playerMoved:"+room+","+pos);
			node.goalRoom = room;

			if(node.goalRoom == entity.room){
				console.log("I am already in "+node.goalRoom);
				node.state = 2;
				return;
			}
			//console.log("playerMoved():I am not in "+node.goalRoom+" getting path.");
			node.path = Game.getPathRoomToRoom(entity.room, node.goalRoom);
			if(node.path != null){
				node.curNode = node.path.first;
				node.doorPos = Game.navMesh.room[entity.room].door[node.curNode.door].center;
				entity.aIComponent.getBehaviorByName("Idle").active = false;
				node.state = 1;
				var eac = entity.transformComponent.parent.entity.animationComponent;
				if( !entity.dmg || entity.dmg < 100)
					eac.transitionTo( eac.getStates()[1]);
			}
			else{
				node.state = 4;
			}
		}
		
		switch(node.state){
			case -1:
			case null:
			case undefined:
				Game.register("PlayerMoved", entity, playerMoved);
				node.dir = new Vector3();
				node.state = 0;
				node.speed = 100;
				console.log("now registered for PlayerMoved");
				break;
			case 0:
				break;
			case 1:
				Vector3.add(entity.transformComponent.transform.translation, Vector3.UP, ray.origin);
				ray.direction = Vector3.DOWN;
				Game.picking.castRay(ray, function(hit){
					if(null != hit){
						//console.log("I am in room "+hit.entity.navID+" goal is "+node.curNode.room);
						//entity.room = hit.entity.navID;
						entity.transformComponent.transform.translation.y = hit.point.y;
					}
				}, 1);

				if(entity.room == node.goalRoom){
					node.state = 2;
					console.log("Going to player position...");
					return;
				}
				if(entity.transformComponent.transform.translation.distance(node.doorPos) <= 0.1){
				//if(entity.room == node.curNode.room){
				//	console.log("got to room "+node.curNode.room);
					entity.room = node.curNode.room;
					node.curNode = node.curNode.next;
					if(node.curNode != null){
				//		console.log("going to room "+node.curNode.room+" from room "+node.curNode.previous.room);
						node.doorPos = Game.navMesh.room[entity.room].door[node.curNode.door].center;
					}
				}

				Vector3.sub(node.doorPos, entity.transformComponent.transform.translation, node.dir);
				node.dir.normalize();
				node.dir.y = 0;

				entity.transformComponent.transform.rotation.lookAt(node.dir, Vector3.UP);
				entity.transformComponent.transform.applyForwardVector(Vector3.FORWARD, node.dir);
				entity.transformComponent.addTranslation(Vector3.mul(node.dir, node.speed * Time.dt ));
				entity.transformComponent.setUpdated();

				break;
			case 2:
				if(entity.transformComponent.transform.translation.distance(Game.userEntity.transformComponent.transform.translation) <= 1.0){
					console.log("at player position...");
					node.state = 3;
				}

				Vector3.sub(Game.userEntity.transformComponent.transform.translation, entity.transformComponent.transform.translation, node.dir);
				node.dir.normalize();
				node.dir.y = 0;
		
				entity.transformComponent.transform.rotation.lookAt(node.dir, Vector3.UP);
				entity.transformComponent.transform.applyForwardVector(Vector3.FORWARD, node.dir);
				entity.transformComponent.addTranslation(Vector3.mul(node.dir, node.speed * Time.dt ));
				entity.transformComponent.setUpdated();
				break;
			case 3:
				entity.aIComponent.setActiveByName("Zombie-Idle", true);
				break;
			case 4:
				node.goalRoom = Game.userEntity.room;

				if(node.goalRoom == entity.room){
					console.log("I am already in "+node.goalRoom);
					node.state = 2;
					return;
				}
				//console.log("(case 4)I am not in "+node.goalRoom+" getting path.");
				node.path = Game.getPathRoomToRoom(entity.room, node.goalRoom);
				if(node.path != null){
					node.curNode = node.path.first;
					node.doorPos = Game.navMesh.room[entity.room].door[node.curNode.door].center;
					entity.aIComponent.setActiveByName("Zombie-Idle", false);
					node.state = 1;
					var eac = entity.transformComponent.parent.entity.animationComponent;
					if( !entity.dmg || entity.dmg < 100)
						eac.transitionTo( eac.getStates()[1]);
				}
				break;
		};
	}

	return Zombie;
});