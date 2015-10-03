function Stream(type, func, other) {
	this.type = type;
	this.f = func;
	this.other = other;
	this.subscribers = []; 
};

Stream.prototype.subscribe = function (subscriber) { this.subscribers.push(subscriber); };
Stream.prototype.subscribeTo = function (source) { source.subscribe(this); return this; };

var FILTER = "filter",
	TRANSFORM = "transform",
	SIDE_EFFECT = "sideEffect",
	AGGREGATOR = "aggregator",
	BUFFER = "buffer";

Stream.prototype.send = function (event) {
	this.subscribers.forEach(function (subscriber) {
		subscriber.event(event);
	});
};
Stream.prototype[SIDE_EFFECT] = function (e) {
	this.f(e);
	this.send(e);
}
Stream.prototype[FILTER] = function (e) {
	if (this.f(e)) this.send(e);
}
Stream.prototype[TRANSFORM] = function (e) {
	this.send(this.f(e));
}
Stream.prototype[AGGREGATOR] = function (e) {
	this.other = this.f(this.other, e);
	this.send(this.other);
}
Stream.prototype[BUFFER] = function (e) {
	// buffer function should return true if it should send the buffer now without the new event,
	// false if it should add the event to the buffer and not send the event yet.
	if (this._buf == undefined) { this._buf = []; }
	
	var send = this.f(this._buf, e, this);
	
	if (send) {
		event = this._buf;
		this._buf = [ e ];
		this.send(event);
	} else {
		this._buf.push(e);
	}
}
Stream.prototype.event = function (e) { //receiving an event that it might send off	
	if (this.type) {
		this[this.type](e, this.other);
	} else {
		this.send(e);
	}
};
Stream.prototype.create = function (type, func, other) {
	return new Stream(type, func, other).subscribeTo(this);
};