define([
	'lib/NodeList',
	'goo/entities/components/Component',
	'lib/Game'
],
function(
	NodeList,
	Component,
	Game
){
	function AIComponent(entity){
		this.type = "AIComponent";
		this.behavior = {};
		this.list = {};
		this.entity = entity;
	};
	AIComponent.prototype = Object.create(Component.prototype);
	AIComponent.prototype.addBehavior = function(b, priority){
		if(null != this.list[b.name]){console.error("A name for the behavior:"+b.name+" already exists!");}
		var node = {
			next:null,
			previous:null,
		};
		for(var p in b){
			if(b.hasOwnProperty(p)){
				node[p] = b[p];
			}
		}
		node.active = node.active || true;
		node.blocking = node.blocking || false;
		if(null != node.update){
			if(null == this.behavior.update){
				this.behavior.update = new NodeList();
				Game.register("Update", this, this.update);
			}
			if(null == priority){
				this.behavior.update.addFirst(node);
			}
			else{
				node.priority = priority;
				this.behavior.update.addSorted(node);
			}
		}
		if(null != node.fixedUpdate){
			if(null == this.behavior.fixedUpdate){
				this.behavior.fixedUpdate = new NodeList();
				Game.register("FixedUpdate", this, this.fixedUpdate);
			}
			if(null == priority){
				this.behavior.fixedUpdate.addFirst(node);
			}
			else{
				node.priority = priority;
				this.behavior.fixedUpdate.addSorted(node);
			}
		}
		if(null != node.renderUpdate){
			if(null == this.behavior.renderUpdate){
				this.behavior.renderUpdate = new NodeList();
				Game.register("RenderUpdate", this, this.renderUpdate);
			}
			if(null == priority){
				this.behavior.renderUpdate.addFirst(node);
			}
			else{
				node.priority = priority;
				this.behavior.renderUpdate.addSorted(node);
			}
		}
		if(null != node.lateUpdate){
			if(null == this.behavior.lateUdate){
				this.behavior.lateUpdate = new NodeList();
				Game.register("LateUpdate", this, this.lateUpdate);
			}
			if(null == priority){
				this.behavior.lateUpdate.addFirst(node);
			}
			else{
				node.priority = priority;
				this.behavior.lateUpdate.addSorted(node);
			}
		}
		this.list[b.name] = node;
		return node;
	};
	AIComponent.prototype.removeBehavior = function(b){
		if(null != b.update){
			if(null != this.behavior.update){
				this.behavior.update.remove(b);
			}
		}
		if(null != b.fixedUpdate){
			if(null != this.behavior.fixedUpdate){
				this.behavior.fixedUpdate.remove(b);
			}
		}
		if(null != b.renderUpdate){
			if(null != this.behavior.renderUpdate){
				this.behavior.renderUpdate.remove(b);
			}
		}
		if(null != b.lateUpdate){
			if(null != this.behavior.lateUpdate){
				this.behavior.lateUpdate.remove(b);
			}
		}
		delete this.list[b.name];
	};
	AIComponent.prototype.removeAll = function(){
		if(null != this.behavior.update){
			this.behavior.update.clear();
		}
		if(null != this.behavior.fixedUpdate){
			this.behavior.fixedUpdate.clear();
		}
		if(null != this.behavior.renderUpdate){
			this.behavior.renderUpdate.clear();
		}
		if(null != this.behavior.lateUpdate){
			this.behavior.lateUpdate.clear();
		}
		this.list = {};
	};
	AIComponent.prototype.setActiveByName = function(name, active){
		if(null == this.list[name]){console.error("No behavior with the name: "+name+" exists!");return;}
		this.list[name].active = active;
	};
	AIComponent.prototype.setBlockingByName = function(name, blocking){
		if(null == this.list[name]){console.error("No behavior with the name: "+name+" exists!");return;}
		this.list[name].blocking = blocking;
	};

	AIComponent.prototype.update = function(){
		if(null == this.behavior.update){return;}
		var n = this.behavior.update.first;
		while(n != null){
			if(true == n.active){
				n.update(this.entity, n);
				if(true == n.blocking){
					return;
				}
			}
			n = n.next;
		}
	};
	AIComponent.prototype.fixedUpdate = function(){
		if(null == this.behavior.fixedUpdate){return;}
		var n = this.behavior.fixedUpdate.first;
		while(n != null){
			if(true == n.active){
				n.fixedUpdate(this.entity, n);
				if(true == n.blocking){
					return;
				}
			}
			n = n.next;
		}
	};
	AIComponent.prototype.renderUpdate = function(){
		if(null == this.behavior.renderUpdate){return;}
		var n = this.behavior.renderUpdate.first;
		while(n != null){
			if(true == n.active){
				n.renderUpdate(this.entity, n);
				if(true == n.blocking){
					return;
				}
			}
			n = n.next;
		}
	};
	AIComponent.prototype.lateUpdate = function(){
		if(null == this.behavior.lateUpdate){return;}
		var n = this.behavior.lateUpdate.first;
		while(n != null){
			if(true == n.active){
				n.lateUpdate(this.entity, n);
				if(true == n.blocking){
					return;
				}
			}
			n = n.next;
		}
	};
	return AIComponent;
});