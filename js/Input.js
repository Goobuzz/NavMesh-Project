define([
	'goo/math/Vector2',
	'js/Game'
], function(
	Vector2,
	Game
){
	"use strict";
	var view = null;
	var _self = {};
	_self.init = function(goo){
		view = goo.renderer.domElement;
		document.documentElement.addEventListener("mousedown", mouseDown, false);
		//goo.renderer.domElement.addEventListener("mousedown", mouseDown, false);
		document.documentElement.addEventListener("mouseup", mouseUp, false);
		document.documentElement.addEventListener("mousemove", mouseMove, false);
		document.body.addEventListener('keyup', keyUp, false);
		document.body.addEventListener('keydown', keyDown, false);
	};

	_self.mousePosition = new Vector2();
	_self.mouseOld = new Vector2();
	_self.mouseDelta = new Vector2();
	_self.mouseButton = {};
	_self.movement = new Vector2();
	_self.keys = {};

	/*
	document.addEventListener("keydown", function(_e){
		_e = _e || window.event;
		
		var key = (typeof _e.which === "undefined") ? _e.keyCode : _e.which;
		if(null == Game._keyAssign[key]){return;}
		if(true == Game.action[Game._keyAssign[key]]){return;}
		Game.action[Game._keyAssign[key]] = true;
		Game.raiseEvent(Game._keyAssign[key], true);
	},false);

	document.addEventListener("keyup", function(_e){
		_e = _e || window.event;

		var key = (typeof _e.which === "undefined") ? _e.keyCode : _e.which;
		if(null == Game._keyAssign[key]){return;}
		if(false == Game.action[Game._keyAssign[key]]){return;}
		Game.action[Game._keyAssign[key]] = false;
		Game.raiseEvent(Game._keyAssign[key], false);
	},false);
	*/

	function keyDown(e){
		e = e || window.event;
		var key = (typeof e.which === "undefined") ? e.keyCode : e.which;
		_self.keys[key] = true;
		Game.raiseEvent("Key"+key, true);
	}
	function keyUp(e){
		e = e || window.event;
		var key = (typeof e.which === "undefined") ? e.keyCode : e.which;
		_self.keys[key] = false;
		Game.raiseEvent("Key"+key, false);
	}

	function mouseDown(e){
		updateMousePos(e);
		var btn = 0;
		if(null == e.which){
			btn = e.button;
		}
		else{
			switch(e.which){
				case 1:
					btn = 1;
					break;
				case 2:
					btn = 4;
					break;
				case 3:
					btn = 2;
					break;
			};
		}
		_self.mouseButton[btn] = true;
		Game.raiseEvent("MouseButton"+btn, true);
	};

	function mouseUp(e){
		updateMousePos(e);
		var btn = 0;
		if(null == e.which){
			btn = e.button;
		}
		else{
			switch(e.which){
				case 1:
					btn = 1;
					break;
				case 2:
					btn = 4;
					break;
				case 3:
					btn = 2;
					break;
			};
		}
		_self.mouseButton[btn] = false;
		Game.raiseEvent("MouseButton"+btn, false);
	};

	function mouseMove(e){
		updateMousePos(e);
		Game.raiseEvent("MouseMove");
	};

	function updateMousePos(e){
		e = e || window.event;
		if (e && e.preventDefault) {e.preventDefault();}
		if (e && e.stopPropagation) {e.stopPropagation();}
		
		_self.mousePosition.x = e.pageX ? e.pageX : e.clientX + (document.documentElement.scrollLeft) ||
			(document.body.scrollLeft - document.documentElement.clientLeft);
			
		_self.mousePosition.y = e.pageY ? e.pageY : e.clientY + (document.documentElement.scrollTop) ||
			(document.body.scrollTop - document.documentElement.scrollTop);

		_self.mousePosition.x -= view.offsetLeft;
		_self.mousePosition.y -= view.offsetTop;
		_self.movement.x = e.movementX;
		_self.movement.y = e.movementY;
		_self.mouseDelta.x = _self.mouseOld.x - _self.mousePosition.x;
		_self.mouseDelta.y = _self.mouseOld.y - _self.mousePosition.y;
		_self.mouseOld.x = _self.mousePosition.x;
		_self.mouseOld.y = _self.mousePosition.y;
	};

	
	return _self;
});