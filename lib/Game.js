define([
	"lib/NodeList"
], function(
	NodeList
){
	"use strict";
	var _self = {};

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