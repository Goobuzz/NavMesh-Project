define([], function(){
	"use strict";
	function NodeList(){
		this.first = null;
		this.last = null;
	};
	NodeList.prototype.add = function( _node ){
		if( null == this.first ){
			this.first = _node;
			this.last = _node;
			_node.next = null;
			_node.previous = null;
		}
		else{
			this.last.next = _node;
			_node.previous = this.last;
			_node.next = null;
			this.last = _node;
		}
	}
	NodeList.prototype.addSorted = function( _node ){
		if( null == this.first ){
			this.first = _node;
			this.last = _node;
			_node.next = null;
			_node.previous = null;
		}
		else{
			var n = this.last;
			while(n != null){
				if(n.priority <= _node.priority){
					break;
				}
				n = n.previous;
			}

			if(n == this.last){
				//console.log("n == this.last");
				this.last.next = _node;
				_node.previous = this.last;
				_node.next = null;
				this.last = _node;
			}
			else if(null == n){
				//console.log("null == n");
				_node.next = this.first;
				_node.previous = null;
				this.first.previous = _node;
				this.first = _node;
			}
			else{
				//console.log();
				_node.next = n.next;
				_node.previous = n;
				n.next.previous = _node;
				n.next = _node;
			}
		}
	}

	NodeList.prototype.addFirst = function( _node ){
		if( null == this.first ){
			this.first = _node;
			this.last = _node;
			_node.next = null;
			_node.previous = null;
		}
		else{
			_node.next = this.first;
			this.first.previous = _node;
			this.first = _node;
		}
	}

	NodeList.prototype.remove = function( _node ){
		if( this.first == _node ){
			this.first = this.first.next;
		}
		if( this.last == _node){
			this.last = this.last.previous;
		}
		if( _node.previous != null ){
			_node.previous.next = _node.next;
		}
		if( _node.next != null ){
			_node.next.previous = _node.previous;
		}
	}

	NodeList.prototype.clear = function(){
		while( null != this.first ){
			var node = this.first;
			this.first = node.next;
			node.previous = null;
			node.next = null;
		}
		this.last = null;
	}
	return NodeList;
});

	//NodeList.prototype.insertSort = function(_func){
		/*if(this.first == this.last){
			return;
		}
		var r = this.first.next;
		//var remains : Node = head.next;
		for( var n = r; n; n = r )
		{
			r = n.next;
			for( var o = n.previous; o; o = o.previous ){
				if( _func( n, o ) >= 0 ){
					// move node to after other
					if( n != o.next ){
						// remove from place
						if ( this.last == n){
							this.last = n.previous;
						}
						n.previous.next = n.next;
						if (null != n.next){
							n.next.previous = n.previous;
						}
						// insert after other
						n.next = o.next;
						n.previous = o;
						n.next.previous = n;
						o.next = n;
					}
					break; // exit the inner for loop
				}
			}
			// the node belongs at the start of the list
			if( null == o ){
				// remove from place
				if ( this.last == n){
					this.last = n.previous;
				}
				n.previous.next = n.next;
				if (n.next){
					n.next.previous = n.previous;
				}
				// insert at head
				n.next = this.first;
				this.first.previous = n;
				n.previous = null;
				this.first = n;
			}
		}*/
	//}

	//NodeList.prototype.mergeSort = function(_func){
		/*if( head == tail )
				{
					return;
				}
				var lists : Vector.<Node> = new Vector.<Node>;
				// disassemble the list
				var start : Node = head;
				var end : Node;
				while( start )
				{
					end = start;
					while( end.next && sortFunction( end, end.next ) <= 0 )
					{
						end = end.next;
					}
					var next : Node = end.next;
					start.previous = end.next = null;
					lists.push( start );
					start = next;
				}
				// reassemble it in order
				while( lists.length > 1 )
				{
					lists.push( merge( lists.shift(), lists.shift(), sortFunction ) );
				}
				// find the tail
				tail = head = lists[0];
				while( tail.next )
				{
					tail = tail.next;	
				}
			}

			private function merge( head1 : Node, head2 : Node, sortFunction : Function ) : Node
			{
				var node : Node;
				var head : Node;
				if( sortFunction( head1, head2 ) <= 0 )
				{
					head = node = head1;
					head1 = head1.next;
				}
				else
				{
					head = node = head2;
					head2 = head2.next;
				}
				while( head1 && head2 )
				{
					if( sortFunction( head1, head2 ) <= 0 )
					{
						node.next = head1;
						head1.previous = node;
						node = head1;
						head1 = head1.next;
					}
					else
					{
						node.next = head2;
						head2.previous = node;
						node = head2;
						head2 = head2.next;
					}
				}
				if( head1 )
				{
					node.next = head1;
					head1.previous = node;
				}
				else
				{
					node.next = head2;
					head2.previous = node;
				}
				return head;
			}
		}*/
	//}