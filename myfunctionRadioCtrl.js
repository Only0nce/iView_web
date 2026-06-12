// JavaScript Document
var wsUri;
var ws;
var current_tmp = 0;
var busy = false
var vswr = 0
var ampActive = 0;
var rssi = -130
WebSocketTest();
window.onload = function(){
	myCanvasfwd(0)
	myCanvasrwd(0)
	vswr = (vswr*1.0).toFixed(0)
	animateResultCount(document.getElementById("fwd").innerHTML,0,document.getElementById("rwd").innerHTML,0)
}
function WebSocketTest() {

if ("WebSocket" in window) {
   // Let us open a web socket
   wsUri = "ws://" + location.host + ":1234";
   ws = new WebSocket(wsUri);

   ws.onopen = function() {
	  // Web Socket is connected, send data using send()
	  ws.send("web:home");
	  myProgressCircle(50, 10, 0, 50, 0, 10, 0, -130);
   };

   ws.onmessage = function (evt) { 
	  var received_msg = evt.data;
	  processMsg(received_msg);
   };

   ws.onclose = function() { 
	  // websocket is closed.
	  alert("Connection is closed..."); 
   };
} else {

   // The browser doesn't support WebSocket
   alert("WebSocket NOT supported by your Browser!");
}
}
function processMsg(message){
	
 var obj = JSON.parse(message);
 // console.log(message)
 if (obj.menuID == "CTRLRSSI")
 {
	 rssi = obj.CTRLrssi
 }
 else if (obj.menuID == "SETMSQLLV")
 {
	 document.getElementById("sqlLevel").value = obj.SETMSqllv
 }
 else if (obj.menuID == "MCHSEL")
 {
    var dummyEl = document.getElementById("chSel");
    if (document.activeElement === dummyEl)
    {

    }
    else
    {
	   document.getElementById("chSel").value = obj.MCHsel
    }
    
 }
else if (obj.menuID == "MCHRFPWR")
 {
	 document.getElementById("rfPower").value = obj.MCHrfpwr
 }
 else if(obj.menuID == "broadcastLocalTime")
 {
	// document.getElementById("currentTime").value = obj.currentTime;
	// document.getElementById("currentDate").value = obj.currentDate;
 }
 else if(obj.menuID == "powerMgs")
 {
	var fwd = (obj.fwdWatt/1000.0).toFixed(2)
	var rwd = (obj.rwdWatt/1000.0).toFixed(2)
	vswr = obj.vswr
	myCanvasfwd(fwd)
	myCanvasrwd(rwd)
	animateResultCount(document.getElementById("fwd").innerHTML,fwd,document.getElementById("rwd").innerHTML,rwd)
//	 console.log(message)
 }
 else if(obj.menuID == "update")
 {
	 var updateStatus = obj.updateStatus;
	 if (updateStatus == 2){
		 alert("System updated, Please restart your system.");
	 }
 }
 else
{
//		console.debug(message);
}
}
function updateRFPwr(){
	var rfPower = document.getElementById("rfPower").value ;
	var setRFPWR = "L1"
	if (rfPower == "LOW2") setRFPWR = "L2"
	else if (rfPower == "HIGH") setRFPWR = "H"
	var jsonMessage = '{"menuID":"MCHRFPWR", "setTxOutputLevel":"' + setRFPWR +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function updateSQLLevel(){
	var sqlLevelCmmd = document.getElementById("sqlLevel").value ;
	var jsonMessage = '{"menuID":"SETMSQLLV", "sqlLevelCmmd":"' + sqlLevelCmmd +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function updateCHSel(){
	var setMemChSel = document.getElementById("chSel").value ;
	var jsonMessage = '{"menuID":"MCHSEL", "setMemChSel":"' + setMemChSel +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function animateResultCount(numberfwd, targetfwd, numberrwd, targetrwd) {
	if(!busy){
		busy = true
		if(numberfwd != targetfwd) {
			var interval = setInterval(function() {
				if (numberfwd == targetfwd) {
					clearInterval(interval);
					return;
				}
				numberfwd = document.getElementById("fwd").innerHTML;
				myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, 50, 0, 10, vswr,rssi)
//				console.log(numberfwd, targetfwd)
			}, 10);
		}
		if(numberrwd != targetrwd) {
			var interval = setInterval(function() {
				if (numberrwd == targetrwd) {
					clearInterval(interval);
					return;
				}
				numberrwd = document.getElementById("rwd").innerHTML;
				myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, 50, 0, 10, vswr,rssi)
//				console.log("numberrwd")
			}, 10);
		}

		myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, 50, 0, 10, vswr,rssi)
	busy = false
	}
}
function myCanvasfwd(fwd)
{
	const options = {
		startVal: document.getElementById("fwd").innerHTML,
		decimalPlaces: 2,
		useGrouping: false,
		duration: 1
	};
	var c = new CountUp('fwd',fwd,options);
	c.start();
}
function myCanvasrwd(rwd)
{
	const options = {
		startVal: document.getElementById("rwd").innerHTML,
		decimalPlaces: 2,
		useGrouping: false,
		duration: 1
	};
	var c = new CountUp('rwd',rwd,options)
	c.start();
}
function myProgressCircle(fwd, rwd, fwdMin, fwdMax, rwdMin, rwdMax, vswr_val, rssi_val)
{
	var gradient
	var arcBegin = 0
	var arcEnd = 180
	var arcBgEnd = 360
	var size = 300
	var lineWidth = 2
	var x = size / 2
	var y = size / 2
	var start = Math.PI * (arcBegin / 180)
	var end = Math.PI * (arcEnd / 180)
	var end_bg = Math.PI * (arcBgEnd / 180)
	var start_bg = Math.PI * (arcBegin / 180)
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	var strvswr = "1:" + (vswr_val*1.0).toFixed(2)
		
	ctx.clearRect(0,0,size,size)
	// outline
	ctx.beginPath();
	ctx.arc(x, y, (size / 2) - lineWidth / 2 ,start_bg, end_bg, false);
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = "#ffffff"
	ctx.stroke(); 
	
	//Input Level
	arcBegin = 180+270
	if (fwd > fwdMax) fwd = fwdMax
	arcEnd = (((fwd-fwdMin)/(fwdMax-fwdMin))*180)+90;
	if (arcEnd < 90) 
		arcEnd = 90
	arcBgEnd = arcEnd
	size = 280
	lineWidth = 10
	x = size / 2
	y = size / 2
	start = Math.PI * (arcBegin / 180)
	end = Math.PI * (arcEnd / 180)
	
	//background
	ctx.beginPath();
	ctx.arc(x + lineWidth, y + lineWidth,(size / 2) - lineWidth / 2 ,start_bg, end_bg, false);
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = "gray"
	ctx.stroke(); 
	
	ctx.beginPath();
	ctx.arc(x + lineWidth, y + lineWidth,(size / 2) - lineWidth / 2 ,start, end, false);
	ctx.lineWidth = lineWidth
	gradient = ctx.createLinearGradient(0,0,size/2,size)
	gradient.addColorStop(0,'#1DE9B6')
	gradient.addColorStop(0.3,'#1DE9B6')
	gradient.addColorStop(0.5,'#FFFF00')
	gradient.addColorStop(0.8,'#FF0000')
	gradient.addColorStop(1,'#FF0000')
	ctx.strokeStyle = gradient
	ctx.stroke(); 
	
	arcBegin = 180+90
	if (rwd > rwdMax) rwd = rwdMax
	arcEnd = (((rwd-rwdMin)/(rwdMax-rwdMin))*180)+270;
	if (arcEnd < 270)
		arcEnd = 270
	start = Math.PI * (arcBegin / 180)
	end = Math.PI * (arcEnd / 180)
	
	ctx.beginPath();
	ctx.arc(x + lineWidth, y + lineWidth,(size / 2) - lineWidth / 2 ,start, end, false);
	ctx.lineWidth = lineWidth
	gradient = ctx.createLinearGradient(0,0,size/3,size)
	gradient.addColorStop(0,'#1DE9B6')
	gradient.addColorStop(0.4,'#FFFF00')
	gradient.addColorStop(0.6,'#FFFF00')
	gradient.addColorStop(0.8,'#FF0000')
	gradient.addColorStop(1,'#FF0000')
	ctx.strokeStyle = gradient
	ctx.stroke(); 
	
	ctx.fillStyle = "#FA057E";
	ctx.font = "60px sans-serif";
	drawCenteredText(rssi_val, x, y + lineWidth);
	
	ctx.fillStyle = "#FA057E";
	ctx.font = "24px sans-serif";
	drawCenteredText(strvswr, x, y + lineWidth-50);
	
	ctx.fillStyle = "gray";
	ctx.font = "20px sans-serif";
	drawCenteredText("RSSI (dB)", x, y + lineWidth+45);
	
	function drawCenteredText(text,centerX,centerY){
        // save the unaltered context
        ctx.save();

        // approximate the font height
        var approxFontHeight=parseInt(ctx.font);

        // alter the context to center-align the text
        ctx.textAlign="center";

        // draw the text centered at [centerX,centerY]
        ctx.fillText(text,centerX,centerY+approxFontHeight/4);

    }
	
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// playground: stackblitz.com/edit/countup-typescript
var CountUp = /** @class */ (function () {
    function CountUp(target, endVal, options) {
        var _this = this;
        this.target = target;
        this.endVal = endVal;
        this.options = options;
        this.version = '2.0.4';
        this.defaults = {
            startVal: 0,
            decimalPlaces: 0,
            duration: 2,
            useEasing: true,
            useGrouping: true,
            smartEasingThreshold: 999,
            smartEasingAmount: 333,
            separator: ',',
            decimal: '.',
            prefix: '',
            suffix: ''
        };
        this.finalEndVal = null; // for smart easing
        this.useEasing = true;
        this.countDown = false;
        this.error = '';
        this.startVal = 0;
        this.paused = true;
        this.count = function (timestamp) {
            if (!_this.startTime) {
                _this.startTime = timestamp;
            }
            var progress = timestamp - _this.startTime;
            _this.remaining = _this.duration - progress;
            // to ease or not to ease
            if (_this.useEasing) {
                if (_this.countDown) {
                    _this.frameVal = _this.startVal - _this.easingFn(progress, 0, _this.startVal - _this.endVal, _this.duration);
                }
                else {
                    _this.frameVal = _this.easingFn(progress, _this.startVal, _this.endVal - _this.startVal, _this.duration);
                }
            }
            else {
                if (_this.countDown) {
                    _this.frameVal = _this.startVal - ((_this.startVal - _this.endVal) * (progress / _this.duration));
                }
                else {
                    _this.frameVal = _this.startVal + (_this.endVal - _this.startVal) * (progress / _this.duration);
                }
            }
            // don't go past endVal since progress can exceed duration in the last frame
            if (_this.countDown) {
                _this.frameVal = (_this.frameVal < _this.endVal) ? _this.endVal : _this.frameVal;
            }
            else {
                _this.frameVal = (_this.frameVal > _this.endVal) ? _this.endVal : _this.frameVal;
            }
            // decimal
            _this.frameVal = Math.round(_this.frameVal * _this.decimalMult) / _this.decimalMult;
            // format and print value
            _this.printValue(_this.frameVal);
            // whether to continue
            if (progress < _this.duration) {
                _this.rAF = requestAnimationFrame(_this.count);
            }
            else if (_this.finalEndVal !== null) {
                // smart easing
                _this.update(_this.finalEndVal);
            }
            else {
                if (_this.callback) {
                    _this.callback();
                }
            }
        };
        // default format and easing functions
        this.formatNumber = function (num) {
            var neg = (num < 0) ? '-' : '';
            var result, x, x1, x2, x3;
            result = Math.abs(num).toFixed(_this.options.decimalPlaces);
            result += '';
            x = result.split('.');
            x1 = x[0];
            x2 = x.length > 1 ? _this.options.decimal + x[1] : '';
            if (_this.options.useGrouping) {
                x3 = '';
                for (var i = 0, len = x1.length; i < len; ++i) {
                    if (i !== 0 && (i % 3) === 0) {
                        x3 = _this.options.separator + x3;
                    }
                    x3 = x1[len - i - 1] + x3;
                }
                x1 = x3;
            }
            // optional numeral substitution
            if (_this.options.numerals && _this.options.numerals.length) {
                x1 = x1.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
                x2 = x2.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
            }
            return neg + _this.options.prefix + x1 + x2 + _this.options.suffix;
        };
        this.easeOutExpo = function (t, b, c, d) {
            return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
        };
        this.options = __assign({}, this.defaults, options);
        this.formattingFn = (this.options.formattingFn) ?
            this.options.formattingFn : this.formatNumber;
        this.easingFn = (this.options.easingFn) ?
            this.options.easingFn : this.easeOutExpo;
        this.startVal = this.validateValue(this.options.startVal);
        this.frameVal = this.startVal;
        this.endVal = this.validateValue(endVal);
        this.options.decimalPlaces = Math.max(0 || this.options.decimalPlaces);
        this.decimalMult = Math.pow(10, this.options.decimalPlaces);
        this.resetDuration();
        this.options.separator = String(this.options.separator);
        this.useEasing = this.options.useEasing;
        if (this.options.separator === '') {
            this.options.useGrouping = false;
        }
        this.el = (typeof target === 'string') ? document.getElementById(target) : target;
        if (this.el) {
            this.printValue(this.startVal);
        }
        else {
            this.error = '[CountUp] target is null or undefined';
        }
    }
    // determines where easing starts and whether to count down or up
    CountUp.prototype.determineDirectionAndSmartEasing = function () {
        var end = (this.finalEndVal) ? this.finalEndVal : this.endVal;
        this.countDown = (this.startVal > end);
        var animateAmount = end - this.startVal;
        if (Math.abs(animateAmount) > this.options.smartEasingThreshold) {
            this.finalEndVal = end;
            var up = (this.countDown) ? 1 : -1;
            this.endVal = end + (up * this.options.smartEasingAmount);
            this.duration = this.duration / 2;
        }
        else {
            this.endVal = end;
            this.finalEndVal = null;
        }
        if (this.finalEndVal) {
            this.useEasing = false;
        }
        else {
            this.useEasing = this.options.useEasing;
        }
    };
    // start animation
    CountUp.prototype.start = function (callback) {
        if (this.error) {
            return;
        }
        this.callback = callback;
        if (this.duration > 0) {
            this.determineDirectionAndSmartEasing();
            this.paused = false;
            this.rAF = requestAnimationFrame(this.count);
        }
        else {
            this.printValue(this.endVal);
        }
    };
    // pause/resume animation
    CountUp.prototype.pauseResume = function () {
        if (!this.paused) {
            cancelAnimationFrame(this.rAF);
        }
        else {
            this.startTime = null;
            this.duration = this.remaining;
            this.startVal = this.frameVal;
            this.determineDirectionAndSmartEasing();
            this.rAF = requestAnimationFrame(this.count);
        }
        this.paused = !this.paused;
    };
    // reset to startVal so animation can be run again
    CountUp.prototype.reset = function () {
        cancelAnimationFrame(this.rAF);
        this.paused = true;
        this.resetDuration();
        this.startVal = this.validateValue(this.options.startVal);
        this.frameVal = this.startVal;
        this.printValue(this.startVal);
    };
    // pass a new endVal and start animation
    CountUp.prototype.update = function (newEndVal) {
        cancelAnimationFrame(this.rAF);
        this.startTime = null;
        this.endVal = this.validateValue(newEndVal);
        if (this.endVal === this.frameVal) {
            return;
        }
        this.startVal = this.frameVal;
        if (!this.finalEndVal) {
            this.resetDuration();
        }
        this.determineDirectionAndSmartEasing();
        this.rAF = requestAnimationFrame(this.count);
    };
    CountUp.prototype.printValue = function (val) {
        var result = this.formattingFn(val);
        if (this.el.tagName === 'INPUT') {
            var input = this.el;
            input.value = result;
        }
        else if (this.el.tagName === 'text' || this.el.tagName === 'tspan') {
            this.el.textContent = result;
        }
        else {
            this.el.innerHTML = result;
        }
    };
    CountUp.prototype.ensureNumber = function (n) {
        return (typeof n === 'number' && !isNaN(n));
    };
    CountUp.prototype.validateValue = function (value) {
        var newValue = Number(value);
        if (!this.ensureNumber(newValue)) {
            this.error = "[CountUp] invalid start or end value: " + value;
            return null;
        }
        else {
            return newValue;
        }
    };
    CountUp.prototype.resetDuration = function () {
        this.startTime = null;
        this.duration = Number(this.options.duration) * 1000;
        this.remaining = this.duration;
    };
    return CountUp;
}());
//export { CountUp };
