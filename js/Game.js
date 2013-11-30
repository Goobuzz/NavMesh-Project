define([
	"js/NodeList",
	'goo/entities/systems/PickingSystem',
	'goo/picking/PrimitivePickLogic',
	'goo/math/Vector3'
], function(
	NodeList,
	PickingSystem,
	PrimitivePickLogic,
	Vector3
){
	"use strict";
	var _self = {};

	_self.init = function(goo){
		_self.goo = goo;
		_self.goo.world.setSystem(picking);
	}

	var picking = new PickingSystem({pickLogic: new PrimitivePickLogic()});
    var v1 = new Vector3();
    var v2 = new Vector3();
    var cross = new Vector3();
    
    _self.castRay = function(ray, callback, mask){
    	picking.pickRay = ray;
    	picking.onPick = function(result){
    		var hit = null;
    		if(null != result){
    			if(result.length > 0){
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
    		}
    		callback(hit);
    	};
    	picking._process();
    }

	_self._listeners = {};

	// @param String: name
	// @param Function: callback
	// @param Number: priority
	_self.register = function(e, o, c, priority){
		if(null == _self._listeners[e]){
			_self._listeners[e] = new NodeList();
		}
		else{
			var n = _self._listeners[e].first;
			while(n != null){
				if(n.object === o){
					console.log("Callback already exists for this object!");
					return;
				}
				n = n.next;
			}
		}
		var node = {
			next:null,
			previous:null,
			callback:c,
			object:o
		};
		if(null == priority){
			_self._listeners[e].addFirst(node);
		}
		else{
			node.priority = priority;
			_self._listeners[e].addSorted(node);
		}
		return _self;
	};
	// @param String: name
	// @param Function: callback
	_self.unregister = function(e, o){
		if(null == _self._listeners[e]){
			return;
		}
		var n = _self._listeners[e].first;
		while(n != null){
			if(n.object === o){
				_self._listeners[e].remove(n);
			}
			n = n.next;
		}
		return _self;
	};
	// @param String: name
	// @param mixed
	_self.raiseEvent = function(){
		var e = [].shift.apply(arguments);
		if(null == e){return;}
		if(null == _self._listeners[e]){
			return;
		}
		var n = _self._listeners[e].first;
		while(n != null){
			n.callback.apply(n.object, arguments);
			n = n.next;
		}
		return _self;
	}
	return _self;
});