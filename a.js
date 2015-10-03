function print(message) {
	document.getElementById("a").innerHTML += message + "<br />";
}
function clear() {
	document.getElementById("a").innerHTML = "";
}

function Stream() { this.subscribers = []; };

Stream.prototype.subscribe = function (subscriber) { this.subscribers.push(subscriber); };
Stream.prototype.subscribeTo = function (source) { source.subscribe(this); return this; };
Stream.prototype.set = function (prop, val) { this[prop] = val; return this; };

var FILTER = "filter",
	TRANSFORM = "transform",
	CALLBACK = "callback",
	AGGREGATOR = "aggregator";
	
Stream.prototype.event = function (e) {
	var event = e; // to tell subscribers
	
	if (this.filter && !this.filter(event)) {
		return;
	}
	if (this.transform) {
		event = this.transform(event);
	}	
    if (this.callback) { 
		this.callback(event);
	}
	if (this.aggregator) {
		this.agg = this.aggregator(this.agg, event);
		event = this.agg;
	}
	this.subscribers.forEach(function (subscriber) {
		subscriber.event(event);
	});
};
Stream.prototype.create = function (type, f, agg) {
	var subscriber = new Stream().subscribeTo(this);
	if (type && f) {
	    if (type == AGGREGATOR) {
			subscriber.agg = agg; //initial value
		}
		subscriber.set(type, f);
	}	
	return subscriber;
};

var A = new Stream();
function clicked() { A.event(Math.random()); }

var B = A.create(TRANSFORM, function (event) { 
	return (event + "").slice(0,5);
});

var filter = function (event) {
	return event.indexOf("4") > 2; 
};

var C = B.create(FILTER, filter)
	.create(CALLBACK, function (data) {
		print(data);
	})
	.create(AGGREGATOR, function (current, event) {
		return current + "::" + event;
	}, "INITIAL VALUE")
	.create(CALLBACK, function (data) {
		clear();
		print(data);
	});

var E = B.create(FILTER, inverse(filter))
	.create(CALLBACK, function (data) {
		print("REJECTED: " + data);
	});

function inverse(f) {
	return function (arg) {
		return !f(arg);
	};
}