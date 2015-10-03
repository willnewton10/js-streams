// some side-effect functions:
function print(message) {
	document.getElementById("a").innerHTML += message + "<br />";
}
function colorPrinter(color, append) {
	append = append || "";
	return function (message) {
		print("<span style='color:"+color+";'>"+ append + "[" +message+"]</span>");
	}
};
function clear() {
	document.getElementById("a").innerHTML = "";
}



var A = new Stream();
function clicked() { 
	console.log('clicked'); 
	A.event(Math.random()); 
}

var B = A.create(SIDE_EFFECT, clear)
	.create(TRANSFORM, function (event) { 
		return (event + "").slice(0,5);
	});
	
var D = B.create(AGGREGATOR, function (current, event) {
		return current + "::" + event;
	}, "INITIAL VALUE")
	.create(SIDE_EFFECT, colorPrinter("yellow"))

var filter = function (event) {
	return event.indexOf("4") > 2; 
};

var C = B.create(FILTER, filter)
	.create(SIDE_EFFECT, print);

var E = B.create(FILTER, inverse(filter))
	.create(SIDE_EFFECT, colorPrinter("pink"));
	
var F = B.create(AGGREGATOR, function (a, b) { return a + 1; }, 0)
	.create(SIDE_EFFECT, colorPrinter("green", "count: "));

var G = A.create(BUFFER, function (buf, e) {
		return buf.length == 3;
	}, { insertBefore: true })
	.create(SIDE_EFFECT, colorPrinter("red", "group of 3: "));

var F = A.create(BUFFER, function (buf, e) {
		if (buf.length == 0) return false;
		var last = buf[buf.length - 1];
		return last > e; // send if new event is lower than prev. Should produce an increasing collection. 
	});
F.create(SIDE_EFFECT, colorPrinter("blue", "all increasing:"));

A.create(BUFFER, function (buf, evt, stream) {
	var prev = stream.lastEventTime;
	var now = Date.now();
	stream.lastEventTime = now;
	if (!prev) return false;
	return now - prev > 5000; // returns buffer if last event was longer than 5 seconds ago
	
}).create(SIDE_EFFECT, colorPrinter("orange", "it has been 5 seconds: "));

A.create(BUFFER, function (buf, evt, stream) {
	var prev = stream.lastEventTime;
	var now = Date.now();
	stream.lastEventTime = now;
	return now - prev < 250;
}, { insertBefore: true })
.create(TRANSFORM, function (b) {
	return [b[b.length - 2], b[b.length - 1]];
})
.create(SIDE_EFFECT, colorPrinter("black;background-color:green", "less than 250ms"));

var Z = A.create(CONTROLLER, function (event) {
	return event > 0.5 ? "X": "Y";
}, {
	"X": new Stream(SIDE_EFFECT, colorPrinter("blue;background-color:white", "x > .5  ")),
	"Y": new Stream(SIDE_EFFECT, colorPrinter("red;background-color:white", "x <= .5 "))
});

var Q = A
	.create(TRANSFORM, function (d) { return d * 10; })
	.create(DELAY, function (d) { return d; })
	.create(SIDE_EFFECT, colorPrinter("black;background-color:yellow;", "waited seconds: "));

function inverse(f) {
	return function (arg) {
		return !f(arg);
	};
}