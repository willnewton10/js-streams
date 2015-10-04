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

var B = A.sideEffect(clear)
	.transform(function (event) { 
		return (event + "").slice(0,5);
	});
	
var D = B.aggregator(function (current, event) {
		return current + "::" + event;
	}, "INITIAL VALUE")
	.sideEffect(colorPrinter("yellow"))

var filter = function (event) {
	return event.indexOf("4") > 2; 
};

var C = B.filter(filter)
	.sideEffect(print);

var E = B.filter(inverse(filter))
	.sideEffect(colorPrinter("pink"));
	
var F = B.aggregator(function (a, b) { return a + 1; }, 0)
	.sideEffect(colorPrinter("green", "count: "));

var G = A.buffer(function (buf, e) {
		return buf.length == 3;
	}, { insertBefore: true })
	.sideEffect(colorPrinter("red", "group of 3: "));

var F = A.buffer(function (buf, e) {
		if (buf.length == 0) return false;
		var last = buf[buf.length - 1];
		return last > e; // send if new event is lower than prev. Should produce an increasing collection. 
	})
	.sideEffect(colorPrinter("blue", "all increasing:"));

A.buffer(function (buf, evt, stream) {
	var prev = stream.lastEventTime;
	var now = Date.now();
	stream.lastEventTime = now;
	if (!prev) return false;
	return now - prev > 5000; // returns buffer if last event was longer than 5 seconds ago
	
}).sideEffect(colorPrinter("orange", "it has been 5 seconds: "));

A.buffer(function (buf, evt, stream) {
	var prev = stream.lastEventTime;
	var now = Date.now();
	stream.lastEventTime = now;
	return now - prev < 250;
}, { insertBefore: true })
.transform(function (b) {
	return [b[b.length - 2], b[b.length - 1]];
})
.sideEffect(colorPrinter("black;background-color:green", "less than 250ms"));

var Z = A.controller(function (event) {
	return event > 0.5 ? "X": "Y";
}, {
	"X": new Stream(types.SIDE_EFFECT, colorPrinter("blue;background-color:white", "x > .5  ")),
	"Y": new Stream(types.SIDE_EFFECT, colorPrinter("red;background-color:white", "x <= .5 "))
});

var Q = A
	.transform(function (d) { return d * 10; })
	.delay(function (d) { return d; })
	.sideEffect(colorPrinter("black;background-color:yellow;", "waited seconds: "));

var R = createStreamFromArray(["hello", "how", "are", "you", "doing", "today?"]);
R.interval(2)
	.sideEffect(colorPrinter("white;background-color:red;", "from array: "));
R.start();

var V = new Stream(types.SIDE_EFFECT, colorPrinter("white;background-color:blue;", "from array: "))
var U = A
	.transform(function (a) { return a*10})
	.interval(1)
	.addSubscriber(V);
	
function inverse(f) {
	return function (arg) {
		return !f(arg);
	};
}