require([
	'goo/entities/GooRunner',
	'goo/statemachine/FSMSystem',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/addons/howler/components/HowlerComponent',
	'goo/loaders/DynamicLoader',
	'goo/math/Vector3',

	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',

	'goo/entities/components/ScriptComponent',
	'goo/scripts/OrbitCamControlScript',

	'goo/renderer/light/DirectionalLight',
	'goo/entities/components/LightComponent',
	'goo/entities/EntityUtils',
	'lib/Input',
	'lib/Game',
	'lib/Time',
	'lib/AIComponent',
	'lib/NodeList',
	'goo/math/Ray',
	'goo/entities/systems/PickingSystem',
	'goo/picking/PrimitivePickLogic',
	'lib/FPSCamControlScript',

	'goo/renderer/light/SpotLight',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/TextureCreator',
	'goo/shapes/ShapeCreator',
	'goo/renderer/Material'

], function (
	GooRunner,
	FSMSystem,
	HowlerSystem,
	HowlerComponent,
	DynamicLoader,
	Vector3,

	Camera,
	CameraComponent,

	ScriptComponent,
	OrbitCamControlScript,

	DirectionalLight,
	LightComponent,
	EntityUtils,
	Input,
	Game,
	Time,
	AIComponent,
	NodeList,
	Ray,
	PickingSystem,
	PrimitivePickLogic,
	FPSCamControlScript,

	SpotLight,
	ShaderLib,
	TextureCreator,
	ShapeCreator,
	Material

) {
	'use strict';

	function init() {

		// If you try to load a scene without a server, you're gonna have a bad time
		if (window.location.protocol==='file:') {
			alert('You need to run this webpage on a server. Check the code for links and details.');
			return;

			/*

			Loading scenes uses AJAX requests, which require that the webpage is accessed via http. Setting up 
			a web server is not very complicated, and there are lots of free options. Here are some suggestions 
			that will do the job and do it well, but there are lots of other options.

			- Windows

			There's Apache (http://httpd.apache.org/docs/current/platform/windows.html)
			There's nginx (http://nginx.org/en/docs/windows.html)
			And for the truly lightweight, there's mongoose (https://code.google.com/p/mongoose/)

			- Linux
			Most distributions have neat packages for Apache (http://httpd.apache.org/) and nginx
			(http://nginx.org/en/docs/windows.html) and about a gazillion other options that didn't 
			fit in here. 
			One option is calling 'python -m SimpleHTTPServer' inside the unpacked folder if you have python installed.


			- Mac OS X

			Most Mac users will have Apache web server bundled with the OS. 
			Read this to get started: http://osxdaily.com/2012/09/02/start-apache-web-server-mac-os-x/

			*/
		}


		// Create typical goo application
		var goo = new GooRunner({
			antialias: true,
			manuallyStartGameLoop: true,
			tpfSmoothingCount:1
		});
		goo.world.setSystem(new Time(goo));
		Input.init(goo);

		goo.world.setSystem(new HowlerSystem());

		var navMesh;
		//var goal;
		var point;
		// The Loader takes care of loading data from a URL...
		var loader = new DynamicLoader({world: goo.world, rootPath: 'res'});

		loader.loadFromBundle('project.project', 'root.bundle')
		.then(function(result) {
			// This function is called when the project has finished loading.
			loader.loadFromBundle('project.project', 'zombie.bundle')
			.then(function(result){
				console.log(result);

				initGoobers(goo);

				goo.renderer.domElement.id = 'goo';
				document.body.appendChild(goo.renderer.domElement);
				goo.startGameLoop();
			})
			.then(null, function(e){});
		})
		.then(null, function(e) {
			// The second parameter of 'then' is an error handling function.
			// We just pop up an error message in case the scene fails to load.
			alert('Failed to load scene: ' + e);
		});

		//var zombie;

		

		function initGoobers(goo){
			//goo.world.entityManager.getEntityByName
			//entities/DefaultToolCamera.entity
			viewCam = loader.getCachedObjectForRef("entities/DefaultToolCamera.entity");
			viewCam.transformComponent.transform.translation.y = 2.8;

			//goal = loader.getCachedObjectForRef("diamond/entities/RootNode.entity");
			point = loader.getCachedObjectForRef("Point/entities/RootNode.entity");
			point.removeFromWorld();

			navMesh = generateRoomsFromMesh(loader.getCachedObjectForRef("NavMesh/entities/RootNode.entity"));
			for(var i in navMesh.vert){
				var p = EntityUtils.clone(goo.world, point);
				p.transformComponent.setTranslation(navMesh.vert[i]);
				p.transformComponent.setScale(0.1, 0.2, 0.1);
				p.addToWorld();
			}

			generateDoors(navMesh);
			var zombie = loader.getCachedObjectForRef("zombie_injured_walk/entities/RootNode.entity");
			zombie.transformComponent.setScale(0.02, 0.02, 0.02);
			zombie.removeFromWorld();
			var z2 = EntityUtils.clone(goo.world, zombie);

			z2.transformComponent.setTranslation(15,0,0);
			z2.setComponent(new AIComponent(z2));
			z2.aIComponent.addBehavior({name:"Zombie-Idle", update:ZombieIdle}, 0);
			z2.aIComponent.addBehavior({name:"Zombie-PathFind", update:ZombiePathFind}, 1);
			z2.addToWorld();

			var sound = new Howl({urls: ["res/sounds/ssg.ogg", "res/sounds/ssg.mp3"], volume:1.0});

			// make a cheap shotgun
			function createShotgun() {
				var mesh = ShapeCreator.createCylinder( 30, 2);
				var mat = Material.createMaterial( ShaderLib.simpleLit, 'BoxMaterial');
				var barrelLeft = EntityUtils.createTypicalEntity( goo.world, mesh, mat);
				barrelLeft.addToWorld();
				barrelLeft.transformComponent.setTranslation( 1.5, 0, 0);

				var barrelRight = EntityUtils.createTypicalEntity( goo.world, mesh, mat);
				barrelRight.addToWorld();
				barrelRight.transformComponent.setTranslation( -1.5, 0, 0 );

				var shotgun = EntityUtils.createTypicalEntity( goo.world);
				shotgun.addToWorld();

				shotgun.transformComponent.attachChild( barrelLeft.transformComponent);
				shotgun.transformComponent.attachChild( barrelRight.transformComponent);

				shotgun.transformComponent.setTranslation( .2, -.23, -.55 );
				shotgun.transformComponent.setScale( .01, .01, .55); // make the barrels long

				shotgun.transformComponent.setRotation( 0.15, 0.1, 0); // rotate the shotty a bit.
				
				//var howlerComponent = new HowlerComponent(); // results in an exception...
				//howlerComponent.addSound('shotx', sound);
				//shotgun.setComponent(howlerComponent);

				
				return shotgun;
			}

			var shotgun = createShotgun();
			viewCam.transformComponent.attachChild( shotgun.transformComponent);
			
			var spotLight = new SpotLight();
			spotLight.angle = 25;
			//spotLight.range = 10;
			spotLight.penumbra = 5;
			spotLight.intensity = 1;

			var spotLightEntity = goo.world.createEntity('spotLight');
			spotLightEntity.setComponent(new LightComponent(spotLight));
			spotLightEntity.addToWorld();

			viewCam.transformComponent.attachChild( spotLightEntity.transformComponent);

			
			function resetSSG() {
				shotgun.transformComponent.setRotation( 0.15, 0.1, 0);
			}
			function mouseButton1(bool0){
				//console.log(bool0);
				if(true == bool0){
					//console.log("bam");
					if(document.pointerLockElement) {
						sound.play();
						shotgun.transformComponent.setRotation( 0.35, 0.1, 0);
						setTimeout( resetSSG, 250);
						var w = goo.renderer.viewportWidth;
						var h = goo.renderer.viewportHeight;
						var x = w / 2;
						var y = h / 2;
						goo.pick( x, y, function( id, depth){
							if( id < 0)
								return;
							console.log( depth);
							var pos = viewCam.cameraComponent.camera.getWorldCoordinates( x, y, w, h, depth);
							//blood.spawn([pos.x,pos.y,pos.z]);
							var entity = goo.world.entityManager.getEntityById(id);
						});
					}
				}
			}
			viewCam.getComponent('ScriptComponent').scripts = [new FPSCamControlScript(viewCam)];
			Game.register("MouseButton1", Game, mouseButton1);
		}

		var goal;
		var viewCam;
		var ray = new Ray();
		// Add PickingSystem
        var picking = new PickingSystem({pickLogic: new PrimitivePickLogic()});
        picking.castRay = function(ray, callback, mask){
        	this.pickRay = ray;
        	this.onPick = function(result){
        		if(null != result && result.length > 0){
        			for(var i = 0, ilen = result.length; i < ilen; i++){
        				if(null != result[i].entity.hitMask){
        					if((result[i].entity.hitMask & mask) != 0){
    							callback({
    								entity:result[i].entity,
    								point:result[i].intersection.points[0],
    								distance:result[i].intersection.distances[0]
    							});
    							return;
        					}
        				}
        			}
        		}
        		callback(null);
        	};
        	this._process();
        }
        goo.world.setSystem(picking);


/*viewCam.cameraComponent.camera.getPickRay(
	Input.mousePosition.x,
	Input.mousePosition.y,
	goo.renderer.viewportWidth,
	goo.renderer.viewportHeight,
	ray);
picking.castRay(ray, function(hit){
	if(null != hit){
		var hitPos = Game.getRoomID(hit.point);
		if(hitPos != -1){
			Game.raiseEvent("DiamondMoved", hitPos, hit.point);
			goal.transformComponent.setTranslation(hit.point);
			goal.transformComponent.setUpdated();
		}
	}
},1);*/
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

		function ZombieIdle(entity, node){
			switch(node.state){
				case 0:
				case null:
				case undefined:
					//console.log(entity.transformComponent.transform.translation);
					entity.room = Game.getRoomID(entity.transformComponent.transform.translation);
					//console.log("zombie in room:"+entity.room);
					//console.log(entity.transformComponent.transform.translation);
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

					Vector3.sub(node.doorPos, entity.transformComponent.transform.translation, node.dir);
					node.dir.normalize();
					entity.transformComponent.transform.rotation.lookAt(node.dir, Vector3.UNIT_Y);
					entity.transformComponent.setUpdated();
					entity.transformComponent.transform.applyForwardVector(Vector3.UNIT_Z, node.dir);
					entity.transformComponent.addTranslation(Vector3.mul(node.dir, node.speed * Time.dt ));
					
					if(entity.transformComponent.transform.translation.distance(node.doorPos) <= 0.25){
						entity.room = node.curNode.room;
						if(entity.room == node.goalRoom){
							// go to goalPos, not room
							node.state = 2;
							return;
						}
						node.curNode = node.curNode.next;
						if(node.curNode != null){
							node.doorPos = navMesh.room[entity.room].door[node.curNode.door].center;
						}
					}
					break;
				case 2:

					Vector3.sub(viewCam.transformComponent.transform.translation, entity.transformComponent.transform.translation, node.dir);
					node.dir.normalize();
					node.dir.y = 0;
					entity.transformComponent.transform.rotation.lookAt(node.dir, Vector3.UNIT_Y);

					entity.transformComponent.setUpdated();
					entity.transformComponent.transform.applyForwardVector(Vector3.UNIT_Z, node.dir);
					entity.transformComponent.addTranslation(Vector3.mul(node.dir, node.speed * Time.dt ));

					if(entity.transformComponent.transform.translation.distance(viewCam.transformComponent.transform.translation) <= 3.5){
						node.state = 3;
					}
					break;
				case 3:
					entity.aIComponent.setActiveByName("Zombie-Idle", true);
					break;
			}
			function playerMoved(room, pos){
				node.goalRoom = room;
				//node.goalPos = pos;


				if(node.goalRoom == entity.room){
					node.state = 2;
					return;
				}
				node.path = getPathRoomToRoom(entity.room, node.goalRoom);
				//console.log(node.path);
				node.curNode = node.path.first;
				node.doorPos = navMesh.room[entity.room].door[node.curNode.door].center;
				entity.aIComponent.setActiveByName("Zombie-Idle", false);
				node.state = 1;
			}
		}

		function generateRoomsFromMesh(navRootEntity){
			var nav = {room:[], vert:{}}
			//var navArr = [];
			for(var i = 0, ilen = navRootEntity.transformComponent.children.length; i < ilen; i++){
				// create a new 'room'(convex polygon)
				var room = {id:i, center:new Vector3(), vert:[], door:[]};

				var entity = navRootEntity.transformComponent.children[i].entity;
				entity.hitMask = 1;

				
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


													var p = EntityUtils.clone(goo.world, point);
													p.transformComponent.setTranslation(door1.center);
													p.transformComponent.setScale(0.5, 0.3, 0.5);
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
			}
		}
	}

	init();
});
