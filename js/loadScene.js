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
	'goo/math/Plane',
	'lib/Zombie'

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
	Plane,
	Zombie

) {
	'use strict';
	Vector3.UP = Object.freeze(new Vector3(0,1,0));
	Vector3.DOWN = Object.freeze(new Vector3(0,-1,0));
	Vector3.FORWARD = Object.freeze(new Vector3(0,0,1));
	function init() {

		// If you try to load a scene without a server, you're gonna have a bad time
		if (window.location.protocol==='file:') {
			alert('You need to run this webpage on a server. Check the code for links and details.');
			return;
		}


		// Create typical goo application
		var goo = new GooRunner({
			manuallyStartGameLoop: true,
			tpfSmoothingCount:1,
			showStats:true
		});
		Game.goo = goo;
		goo.world.setSystem(new Time(goo));
		Input.init(goo);

		goo.world.setSystem(new HowlerSystem());

		var navMesh;
		var point;
		// The Loader takes care of loading data from a URL...
		var loader = new DynamicLoader({world: goo.world, rootPath: 'res'});
		var promises = [];
		promises.push(loader.loadFromBundle('project.project', 'root.bundle'));
		promises.push(loader.loadFromBundle('project.project', 'Point.bundle'));
		Zombie.setupRefs(promises);
		RSVP.all(promises)
		.then(function(){
			initGoobers(goo);
		})
		.then(null, function(e){
			console.log(e.stack);
		});

		function initGoobers(){
			console.log(loader._configs);
			point = loader.getCachedObjectForRef("Point/entities/RootNode.entity");
			point.transformComponent.setScale(0.03, 0.03, 0.03);
			point.removeFromWorld();

			navMesh = generateRoomsFromMesh(loader.getCachedObjectForRef("NavMesh/entities/RootNode.entity"));
			Game.navMesh = navMesh;
			for(var i in navMesh.vert){
				var p = EntityUtils.clone(goo.world, point);
				p.transformComponent.setTranslation(navMesh.vert[i]);
				p.addToWorld();
			}

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

			//console.log(navRef);

			var z1 = Zombie.getRef();
			z1.transformComponent.setTranslation(4,0,4);
			z1.transformComponent.setUpdated();
			z1.aIComponent.getBehaviorByName("Idle").state = 0;
			z1.skip = false;

			var z2 = Zombie.getRef();
			z2.transformComponent.setTranslation(-4,0,-4);
			z2.transformComponent.setUpdated();
			z2.aIComponent.getBehaviorByName("Idle").state = 0;
			z2.skip = false;

			goo.renderer.setClearColor(0, 0, 0, 1); 
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
		Game.getPathRoomToRoom = function(roomStart, roomGoal){
			if(null == roomStart || null == roomGoal){return null;}
		//	console.log("Getting Path from start:"+roomStart+" to goal:"+roomGoal);
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
		
		function generateRoomsFromMesh(navRootEntity){
			var nav = {room:[], vert:{}}
			for(var i = 0, ilen = navRootEntity.transformComponent.children.length; i < ilen; i++){
				// create a new 'room'(convex polygon)
				var room = {id:i, center:new Vector3(), vert:[], door:[]};

				var entity = navRootEntity.transformComponent.children[i].entity;
				entity.navID = i;
				entity.hitMask = 1;
				//entity.skip = true;

				
				// track which vertices we have already used
				var roomVert = {};
				// flattened RAW mesh vertex data
				var verts = entity.meshDataComponent.meshData.dataViews.POSITION;

				for(var v = 0, vlen = verts.length; v < vlen; v+=3){
					var x = ~~(verts[v]*1000000);
					var y = ~~(verts[v+2]*1000000);
					var z = -(~~(verts[v+1]*1000000));

					room.center.x += verts[v];
					room.center.y += verts[v+2];
					room.center.z += -verts[v+1];

					//console.log(x+","+y+","+z);

					// see if we have already added this vert or not
					if(null == roomVert[x+"_"+y+"_"+z]){
						if(null == nav.vert[x+"_"+y+"_"+z]){
							nav.vert[x+"_"+y+"_"+z] = new Vector3(verts[v], verts[v+2], -verts[v+1]);
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

					var cos1 = (Math.atan((v1.z - room.center.z)/(v1.x - room.center.x)) * (180 / Math.PI));
					var cos2 = (Math.atan((v2.z - room.center.z)/(v2.x - room.center.x)) * (180 / Math.PI));

					if(cos1 < 0){cos1 += 360;}

					if(cos2 < 0){cos2 += 360;}


					//console.log("rad1:"+(cos1)+" rad2:"+(cos2));
					// if you want ccw, swap 1 and -1
					if(cos1 > cos2){return 1;}
					if(cos2 > cos1){return -1;}
					return 0;
					return cos1-cos2;
				});
				//console.log(room.vert);

				// add the room to the 'nav' array.
				nav.room.push(room);
			}
			return nav;
		}
		function generateDoors(nav){
			for(var i = 0, ilen = nav.room.length; i < ilen; i++){
				for(var j = i+1, jlen = nav.room.length; j < jlen; j++){
					//if(i == j){continue;}
					var room1 = nav.room[i];
					var room2 = nav.room[j];

					for(var l1 = 0, l1Max = room1.vert.length; l1 < l1Max; l1++){
						for(var r2 = 0, r2Max = room2.vert.length; r2 < r2Max; r2++){
							if(room1.vert[l1] === room2.vert[r2]){

								var r1 = -1;
								//var l2 = -1;



								if(l1 == room1.vert.length-1){
									r1 = 0;
								}
								else{
									r1 = l1+1;
								}

								var l2 = room2.vert.indexOf(room1.vert[r1]);

								if(l2 != -1){
								if(room1.vert[r1] === room2.vert[l2]){
											
									var dir = Vector3.sub(room1.vert[l1], room1.vert[r1]);
									var radius = room1.vert[l1].distance(room1.vert[r1]) * 0.5;
									dir.scale(0.5);
									var center = new Vector3();
									Vector3.add(room1.vert[r1], dir, center);
									var door1 = {center:center, left:room1.vert[l1], right:room1.vert[r1], to:room2.id, radius:radius};
									var door2 = {center:center, left:room2.vert[l2], right:room2.vert[r2], to:room1.id, radius:radius};

									room1.door.push(door1);
									room2.door.push(door2);


									var p = EntityUtils.clone(goo.world, point);
									p.transformComponent.setTranslation(door1.center);
									p.transformComponent.setScale(0.1, 0.2, 0.1);
									p.addToWorld();
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
