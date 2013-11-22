require([
	'goo/entities/GooRunner',
	'goo/statemachine/FSMSystem',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/addons/howler/components/HowlerComponent',
	'goo/loaders/DynamicLoader',
	'goo/math/Vector3',

	//'goo/entities/components/ScriptComponent',

	//'goo/renderer/light/DirectionalLight',
	//'goo/entities/components/LightComponent',
	'goo/entities/EntityUtils',
	'lib/Input',
	'lib/Game',
	'lib/Time',
	'lib/AIComponent',
	'lib/NodeList',
	'goo/math/Ray',
	'goo/entities/systems/PickingSystem',
	'goo/picking/PrimitivePickLogic',
	'lib/FPSCamComponent',

	'goo/util/rsvp',
	'lib/ShotgunComponent',
	'lib/FlashlightComponent',
	'goo/math/Plane'

], function (
	GooRunner,
	FSMSystem,
	HowlerSystem,
	HowlerComponent,
	DynamicLoader,
	Vector3,

	//ScriptComponent,

	//DirectionalLight,
	//LightComponent,
	EntityUtils,
	Input,
	Game,
	Time,
	AIComponent,
	NodeList,
	Ray,
	PickingSystem,
	PrimitivePickLogic,
	FPSCamComponent,

	//SpotLight,
	RSVP,
	ShotgunComponent,
	FlashlightComponent,
	Plane

) {
	'use strict';

	function init() {

		// If you try to load a scene without a server, you're gonna have a bad time
		if (window.location.protocol==='file:') {
			alert('You need to run this webpage on a server. Check the code for links and details.');
			return;
		}


		// Create typical goo application
		var goo = new GooRunner({
			manuallyStartGameLoop: true,
			tpfSmoothingCount:3,
			showStats:true
		});
		Game.goo = goo;
		goo.world.setSystem(new Time(goo));
		Input.init(goo);

		goo.world.setSystem(new HowlerSystem());

		var navMesh;
		//var point;
		// The Loader takes care of loading data from a URL...
		var loader = new DynamicLoader({world: goo.world, rootPath: 'res'});
		var promises = [];
		promises.push(loader.loadFromBundle('project.project', 'root.bundle'));
		promises.push(loader.loadFromBundle('project.project', 'zombie.bundle'));
		promises.push(loader.loadFromBundle('project.project', 'Point.bundle'));
		RSVP.all(promises)
		.then(function(){
			initGoobers(goo);
		})
		.then(null, function(e){
			alert (e);
		});

		function initGoobers(goo){
			console.log(loader._configs);
			var point = loader.getCachedObjectForRef("Point/entities/RootNode.entity");
			point.transformComponent.setScale(0.01, 0.01, 0.01);
			point.removeFromWorld();

			navMesh = generateRoomsFromMesh(loader.getCachedObjectForRef("NavMesh/entities/RootNode.entity"));
			/*for(var i in navMesh.vert){
				var p = EntityUtils.clone(goo.world, point);
				p.transformComponent.setTranslation(navMesh.vert[i]);
				p.addToWorld();
			}*/

			generateDoors(navMesh);

			var physHull = loader.getCachedObjectForRef("PhysicsHull/entities/RootNode.entity");
			for(var i = 0, ilen = physHull.transformComponent.children.length; i < ilen; i++){
				physHull.transformComponent.children[i].entity.hitMask = 2;
				//physHull.transformComponent.children[i].entity.skip = true;
			}

			var groundPhys = loader.getCachedObjectForRef("GroundPhys/entities/RootNode.entity");
			//groundPhys.transformComponent.transform.translation.y = -0.3;
			//groundPhys.transformComponent.setUpdated();
			for(var i = 0, ilen = groundPhys.transformComponent.children.length; i < ilen; i++){
				groundPhys.transformComponent.children[i].entity.hitMask = 4;
				//groundPhys.transformComponent.children[i].entity.skip = true;
			}

			Game.userEntity = goo.world.createEntity("User");
			Game.userEntity.transformComponent.transform.translation.y = 1;
			Game.userEntity.addToWorld();
			Game.userEntity.setComponent(new FPSCamComponent());
			Game.userEntity.fPSCamComponent.setHeight(2.9);

			Game.currentGun = new ShotgunComponent();
			Game.userEntity.setComponent(Game.currentGun);

			Game.userEntity.setComponent(new FlashlightComponent());

			var zombie = loader.getCachedObjectForRef("zombie_idle/entities/Zombie_Geo_0.entity");
			//zombie.removeFromWorld(); // this breaks the parent child relationship, the parent has the animation that I need...
			var z2 = zombie; // EntityUtils.clone(goo.world, zombie);
			z2.transformComponent.setTranslation(-2,0,2);
			z2.setComponent(new AIComponent(z2));
			z2.aIComponent.addBehavior({name:"Zombie-Idle", update:ZombieIdle}, 0);
			z2.aIComponent.addBehavior({name:"Zombie-PathFind", update:ZombiePathFind}, 1);
			// z2.addToWorld();

			//console.log(navRef);

			goo.renderer.domElement.id = 'goo';
			document.body.appendChild(goo.renderer.domElement);
			goo.startGameLoop();
		}

		var goal;
		var viewCam;
		var ray = new Ray();
		var v1 = new Vector3();
		var v2 = new Vector3();
		var cross = new Vector3();
		//var localPos = new Vector3();
		// Add PickingSystem
        var picking = new PickingSystem({pickLogic: new PrimitivePickLogic()});
        picking.castRay = function(ray, callback, mask){
        	this.pickRay = ray;
        	this.onPick = function(result){
        		//console.log(result);
        		var hit = null;
        		if(null != result && result.length > 0){
        			var distance = Infinity;
        			for(var i = 0, ilen = result.length; i < ilen; i++){
        				if(null != result[i].entity.hitMask){
        					if((result[i].entity.hitMask & mask) != 0){
        						for(var j = 0, jlen = result[i].intersection.distances.length; j < jlen; j++){
        							if(result[i].intersection.distances[j] < distance){

        							
										v1.x = result[i].intersection.vertices[j][0].x - result[i].intersection.vertices[j][1].x;
										v1.y = result[i].intersection.vertices[j][0].y - result[i].intersection.vertices[j][1].y;
										v1.z = result[i].intersection.vertices[j][0].z - result[i].intersection.vertices[j][1].z;

									
										v2.x = result[i].intersection.vertices[j][2].x - result[i].intersection.vertices[j][0].x;
										v2.y = result[i].intersection.vertices[j][2].y - result[i].intersection.vertices[j][0].y;
										v2.z = result[i].intersection.vertices[j][2].z - result[i].intersection.vertices[j][0].z;

										cross.x = (v1.y * v2.z) - (v1.z * v2.y);
										cross.y = (v1.z * v2.x) - (v1.x * v2.z);
										cross.z = (v1.x * v2.y) - (v1.y * v2.x);
										cross.normalize();

										//if(dp <=0){
											
		        							distance = result[i].intersection.distances[j];
		        							hit = hit || {entity:null,point:null,vertex:null,distance:null};
		        							hit.entity = result[i].entity;
		        							hit.point =result[i].intersection.points[j];
		        							hit.normal = cross;
		        							hit.distance = result[i].intersection.distances[j];
	        							//}
	        						}
        						}
        					}
        				}
        			}
        		}
        		callback(hit);
        	};
        	this._process();
        }
        goo.world.setSystem(picking);
        Game.picking = picking;

		Game.getRoomID = function(pos){
			//console.log(pos.x+","+pos.y+","+pos.z);
			//var p = new Vector3(pos.x, pos.y, pos.z);
			for(var i = 0, ilen = navMesh.room.length; i < ilen; i++){
				if(true == getPosInPoly(pos, navMesh.room[i].vert)){
					return i;
				}
			}
			console.log("Not on nav map");
			return -1;
		}
		function getPosInPoly(pos, poly){
			var i = 0;
			var j = 0;
			var c = false;
			for(var i = 0, j = poly.length-1, nvert = poly.length; i < nvert; j = i++){
				if( ((poly[i].z > pos.z) != (poly[j].z > pos.z)) &&
					(pos.x < (poly[j].x - poly[i].x) * (pos.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x) ){
						c =! c;
				}
			}
			return c;
		}

		// array of room IDS
		var openList = [];
		// list of door nodes
		var closedList = {};
		// 
		var currentRoom;
		function getPathRoomToRoom(roomStart, roomGoal){
			if(null == roomStart || null == roomGoal){return null;}
			console.log("start:"+roomStart+" goal:"+roomGoal);
			openList.push({room:roomStart, parent:null});
			var pathFound = false;
			while(openList.length > 0 && false == pathFound){
				currentRoom = openList.shift();
				if(currentRoom.room == roomGoal){
					pathFound = true;
					break;
				}
				else{
					for(var i = 0, ilen = navMesh.room[currentRoom.room].door.length; i < ilen; i++){
						if(null == closedList[navMesh.room[currentRoom.room].door[i].to]){
							openList.push({room:navMesh.room[currentRoom.room].door[i].to, door:i, parent:currentRoom});
						}
					}
					closedList[currentRoom.room] = currentRoom;
				}
			}
			if(false == pathFound){
				openList.length = 0;
				closedList = {};
				return null;
			}
			else{
				openList.length = 0;
				closedList = {};
				var path = new NodeList();
				var node = currentRoom;
				while(node.parent != null){
					path.addFirst(node);
					node = node.parent;
				}
				return path;
			}
		}
		Vector3.UP = Object.freeze(new Vector3(0,1,0));
		Vector3.DOWN = Object.freeze(new Vector3(0,-1,0));
		Vector3.FORWARD = Object.freeze(new Vector3(0,0,1));
		
		function ZombieIdle(entity, node){
			switch(node.state){
				case 0:
				case null:
				case undefined:
					Vector3.add(entity.transformComponent.transform.translation, Vector3.UP, ray.origin);
					ray.direction = Vector3.DOWN;
					picking.castRay(ray, function(hit){
						if(null != hit){
							entity.room = hit.entity.navID;
							console.log("I am in room "+entity.room);
							//console.log(hit);
						}
					}, 1);
					node.state = 1;
					break;
				case 1:
					// if player near...
					break;
			}
		}
		function ZombiePathFind(entity, node){
			switch(node.state){
				case -1:
				case null:
				case undefined:
					Game.register("PlayerMoved", this, playerMoved);
					node.dir = new Vector3();
					node.state = 0;
					node.speed = 100;
					break;
				case 0:
					break;
				case 1:
					Vector3.add(entity.transformComponent.transform.translation, Vector3.UP, ray.origin);
					ray.direction = Vector3.DOWN;
					picking.castRay(ray, function(hit){
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
						console.log("got to room "+node.curNode.room);
						entity.room = node.curNode.room;
						node.curNode = node.curNode.next;
						if(node.curNode != null){
							console.log("going to room "+node.curNode.room+" from room "+node.curNode.previous.room);
							node.doorPos = navMesh.room[entity.room].door[node.curNode.door].center;
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
					console.log("I am not in "+node.goalRoom+" getting path.");
					node.path = getPathRoomToRoom(entity.room, node.goalRoom);
					if(node.path != null){
						node.curNode = node.path.first;
						node.doorPos = navMesh.room[entity.room].door[node.curNode.door].center;
						entity.aIComponent.setActiveByName("Zombie-Idle", false);
						node.state = 1;
						var eac = entity.transformComponent.parent.entity.animationComponent;
						eac.transitionTo( eac.getStates()[1]);
					}
					break;
			}
			function playerMoved(room, pos){
				console.log("playerMoved:"+room+","+pos);
				node.goalRoom = room;

				if(node.goalRoom == entity.room){
					console.log("I am already in "+node.goalRoom);
					node.state = 2;
					return;
				}
				console.log("I am not in "+node.goalRoom+" getting path.");
				node.path = getPathRoomToRoom(entity.room, node.goalRoom);
				if(node.path != null){
					node.curNode = node.path.first;
					node.doorPos = navMesh.room[entity.room].door[node.curNode.door].center;
					entity.aIComponent.setActiveByName("Zombie-Idle", false);
					node.state = 1;
					var eac = entity.transformComponent.parent.entity.animationComponent;
					eac.transitionTo( eac.getStates()[1]);
				}
				else{
					node.state = 4;
				}
			}
		}

		function generateRoomsFromMesh(navRootEntity){
			var nav = {room:[], vert:{}}
			for(var i = 0, ilen = navRootEntity.transformComponent.children.length; i < ilen; i++){
				// create a new 'room'(convex polygon)
				var room = {id:i, center:new Vector3(), vert:[], door:[]};

				var entity = navRootEntity.transformComponent.children[i].entity;
				entity.navID = i;
				entity.hitMask = 1;
				entity.skip = true;

				
				// track which vertices we have already used
				var roomVert = {};
				// flattened RAW mesh vertex data
				var verts = entity.meshDataComponent.meshData.dataViews.POSITION;

				for(var v = 0, vlen = verts.length; v < vlen; v+=3){
					var x = verts[v];
					var y = verts[v+2];
					var z = -verts[v+1];
					
					room.center.x += x;
					room.center.y += y;
					room.center.z += z;

					// see if we have already added this vert or not
					if(null == roomVert[x+"_"+y+"_"+z]){
						if(null == nav.vert[x+"_"+y+"_"+z]){
							nav.vert[x+"_"+y+"_"+z] = new Vector3(x, y, z);
						}
						// if not, add it ot the room.point array
						room.vert.push(nav.vert[x+"_"+y+"_"+z]);
						// add a key to the usedVerts
						roomVert[x+"_"+y+"_"+z] = true;
					}
				}

				// get the center of the room, to sort vertices
				room.center.x /= room.vert.length;
				room.center.y /= room.vert.length;
				room.center.z /= room.vert.length;

				room.vert.sort(function (v1, v2){
					var rad1 = Math.atan2(room.center.z - v1.z, room.center.x - v1.x);
					var rad2 = Math.atan2(room.center.z - v2.z, room.center.x - v2.x);
					// if you want ccw, swap 1 and -1
					if(rad1 > rad2){return 1;}
					if(rad2 > rad1){return -1;}
					return 0;
				});

				// add the room to the 'nav' array.
				nav.room.push(room);
			}
			return nav;
		}
		function generateDoors(nav){
			for(var i = 0, ilen = nav.room.length; i < ilen; i++){
				for(var j = i+1, jlen = nav.room.length; j < jlen; j++){
					var room1 = nav.room[i];
					var room2 = nav.room[j];

					for(var l1 = 0, l1Max = room1.vert.length; l1 < l1Max; l1++){
						for(var r2 = 0, r2Max = room2.vert.length; r2 < r2Max; r2++){
							if(room1.vert[l1].x === room2.vert[r2].x){
								if(room1.vert[l1].y === room2.vert[r2].y){
									if(room1.vert[l1].z === room2.vert[r2].z){

										var r1 = -1;
										var l2 = -1;

										if(l1 == room1.vert.length-1){
											r1 = 0;
										}
										else{
											r1 = l1+1;
										}
										if(r2 == 0){
											l2 = room2.vert.length-1;
										}
										else{
											l2 = r2-1;
										}
										if(room1.vert[r1].x === room2.vert[l2].x){
											if(room1.vert[r1].y === room2.vert[l2].y){
												if(room1.vert[r1].z === room2.vert[l2].z){
													
													var dir = Vector3.sub(room1.vert[l1], room1.vert[r1]);
													var radius = room1.vert[l1].distance(room1.vert[r1]) * 0.5;
													dir.scale(0.5);
													var center = new Vector3();
													Vector3.add(room1.vert[r1], dir, center);
													var door1 = {center:center, left:room1.vert[l1], right:room1.vert[r1], to:room2.id, radius:radius};
													var door2 = {center:center, left:room2.vert[l2], right:room2.vert[r2], to:room1.id, radius:radius};

													room1.door.push(door1);
													room2.door.push(door2);


												//	var p = EntityUtils.clone(goo.world, point);
												//	p.transformComponent.setTranslation(door1.center);
												//	p.transformComponent.setScale(0.5, 0.3, 0.5);
												//	p.addToWorld();
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	init();
});
