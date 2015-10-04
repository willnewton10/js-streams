function Stream(type, func, other) {
	this.type = type;
	this.f = func;
	this.other = other;
	this.subscribers = []; 
};

Stream.prototype.addSubscriber = function (subscriber) { 
	this.subscribers.push(subscriber); 
};
Stream.prototype.subscribeTo = function (source) { 
	source.addSubscriber(this); 
	return this; 
};

// types of streams
var types = {
	FILTER: "filter",
	TRANSFORM: "transform",
	SIDE_EFFECT: "sideEffect",
	AGGREGATOR: "aggregator",
	BUFFER: "buffer",
	CONTROLLER: "controller",
	DELAY: "delay",
	INTERVAL: "interval"
};

Object.keys(types).forEach(function (key) {
	var type = types[key];
	Stream.prototype[type] = function (func, other) {
		return this.create(type, func, other);
	}
});

Stream.prototype.event = function (e) { //receiving an event that it might send off	
	if (this.type) {
		this["_"+this.type](e, this.other);
	} else {
		this.send(e);
	}
};
Stream.prototype.create = function (type, func, other) {
	return new Stream(type, func, other).subscribeTo(this);
};
Stream.prototype.send = function (event) {
	this.subscribers.forEach(function (subscriber) {
		subscriber.event(event);
	});
};
Stream.prototype["_"+types.SIDE_EFFECT] = function (e) {
	this.f(e);
	this.send(e);
}
Stream.prototype["_"+types.FILTER] = function (e) {
	if (this.f(e)) this.send(e);
}
Stream.prototype["_"+types.TRANSFORM] = function (e) {
	this.send(this.f(e));
}
Stream.prototype["_"+types.AGGREGATOR] = function (e) {
	this.other = this.f(this.other, e);
	this.send(this.other);
}
Stream.prototype["_"+types.BUFFER] = function (e) {
	// buffer function should return true if it should send the buffer now without the new event,
	// false if it should add the event to the buffer and not send the event yet.
	if (this._buf == undefined) { this._buf = []; }
	
	var insertBefore = this.other && this.other.insertBefore;
	
	if (insertBefore) {
		this._buf.push(e);
	}
	
	var send = this.f(this._buf, e, this);
	
	if (send) {
		event = this._buf;
		this._buf = [];
		this.send(event);
	}
	
	if (!insertBefore) {
		this._buf.push(e);
	}
}
Stream.prototype["_"+types.CONTROLLER] = function (e) {
	var which = this.f(e);
	this.other[which].event(e);
};
Stream.prototype["_"+types.DELAY] = function (e) {
	var secondsToWait = (typeof this.f == "number") ? this.f : this.f(e);
	var self = this;
	setTimeout(function () {
		self.send(e);
	}, secondsToWait * 1000); // milliseconds
}
Stream.prototype["_"+types.INTERVAL] = function (e) {
	/*
	Timed Queue:
	
		This stream collects input into a Q and releases it
		after a given interval of time (or greater) has elapsed
		since the last element was released to subscribers.
	
	We receive an event:
								Waiting
		Q						Yes				No
		no elements				+q (t. exists)	send e, start t.waiting=true
		already has elements    +q (t. exists)	-
	
	A timer finishes?
	
		Q has elements?			-q, send e, start t.
		Q no elements?			waiting = false;
	*/
	var secondsToWait = (typeof this.f == "number") ? this.f : this.f(e);
	this.q = this.q || [];
	var q = this.q;
	this.waiting = this.waiting || false;
	
	var self = this;
	function startTimer() {
		setTimeout(function () {
			console.log("waited " + (secondsToWait) + " seconds");
			if (q.length > 0) {
				var e = q.splice(0,1);
				console.log("q", q);
				self.send(e);
				startTimer();
			} else {
				self.waiting = false;
			}
		}, secondsToWait * 1000);
	}
	
	if (this.waiting) {
		q.push(e);
	} else {
		this.send(e);
		this.waiting = true;
		startTimer();
	}
}
Stream.prototype.start = function () {
	var array = this.other;
	var self = this;
	array.forEach(function (element) {
		self.send(element);
	});
}

function createStreamFromArray(array) {
	var stream = new Stream();
	stream.other = array;
	return stream;
}
