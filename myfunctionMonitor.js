// JavaScript Document
var wsUri;
var ws;
var current_tmp = 0;
var busy = false
var current = 0
WebSocketTest();

function WebSocketTest() {

if ("WebSocket" in window) {
   // Let us open a web socket
   wsUri = "ws://" + location.host + ":1234";
   ws = new WebSocket(wsUri);

   ws.onopen = function() {
	  // Web Socket is connected, send data using send()
	   ws.send("web:home");
	   myProgressbar("myCanvasCPUUsage",document.getElementById("myCanvasCPUUsage").width,document.getElementById("myCanvasCPUUsage").height,100,100,0);
	   myProgressbar("myCanvasMemUsage",document.getElementById("myCanvasMemUsage").width,document.getElementById("myCanvasMemUsage").height,100,100,0);
	   myProgressbar("myCanvasCpuTemp",document.getElementById("myCanvasCpuTemp").width,document.getElementById("myCanvasCpuTemp").height,100,100,0);
	   myProgressbar("myCanvasHWTemp",document.getElementById("myCanvasHWTemp").width,document.getElementById("myCanvasHWTemp").height,100,100,0);
	   myProgressbar("myCanvasStorageUsed",document.getElementById("myCanvasStorageUsed").width,document.getElementById("myCanvasStorageUsed").height,16,16,0);
	   myProgressbar2("myCanvasfwd",document.getElementById("myCanvasfwd").width,document.getElementById("myCanvasfwd").height,50,50,0);
	   myProgressbar2("myCanvasrssi",document.getElementById("myCanvasrssi").width,document.getElementById("myCanvasrssi").height,0,0,-130);
	   myProgressbar2("myCanvasvInRadio",document.getElementById("myCanvasvInRadio").width,document.getElementById("myCanvasvInRadio").height,20,20,0);
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
	if (obj.menuID == "CTRLRSSI")
	{
		var rssi = obj.CTRLrssi
		myCanvasrssi(rssi);
		animateResultCount_rssi(rssi);
	}
	else if (obj.menuID == "CTRLBATV")
	{
		var battVoltage = obj.CTRLbatv.toFixed(2)
		myCanvasvInRadio(battVoltage);
//		animateResultCount_vInRadio(battVoltage);
		myProgressbar2("myCanvasvInRadio",document.getElementById("myCanvasvInRadio").width,document.getElementById("myCanvasvInRadio").height,battVoltage,20,0);
	}
	else if (obj.menuID == "CTRLTEMP")
	{
		var CTRLtemp = obj.CTRLtemp.toFixed(1)
//		animateResultCount_HWTemp(CTRLtemp);
		myProgressbar("myCanvasHWTemp",document.getElementById("myCanvasHWTemp").width,document.getElementById("myCanvasHWTemp").height,CTRLtemp,100,0);
		myAnimateHWTemp(CTRLtemp);
	}
	else if(obj.menuID == "powerMgs")
	{
		var fwd = (obj.fwdWatt/1000.0).toFixed(2)
		var rwd = (obj.rwdWatt/1000.0).toFixed(2)
		myCanvasfwd(fwd)
		animateResultCount_fwd(fwd);
	}
	else if(obj.menuID == "broadcastLocalTime")
	{
		// document.getElementById("currentTime").value = obj.currentTime;
		// document.getElementById("currentDate").value = obj.currentDate;
	}
	else if(obj.menuID == "systemInfo")
	{
		var cpuUsage = obj.cpuUsage.toFixed(1)
		var cpuTemp = obj.cpuTemp.toFixed(1)
		var memUsage = obj.memUsage.toFixed(1)
		var internalStorage = (obj.internalStorage/(1024*1024)).toFixed(1)
		var internalStorageUsage = (obj.internalStorageUsed/(1024*1024)).toFixed(1)
		
//		console.log(cpuUsage,cpuTemp,memUsage,internalStorage,internalStorageUsage)
		myAnimateCpuUsage(cpuUsage)
		myAnimateCpuTemp(cpuTemp)
		myAnimateMemUsage(memUsage)
		myAnimateStorageUsed(internalStorageUsage)
		
//		animateResultCount_cpu(cpuUsage)
		myProgressbar("myCanvasCPUUsage",document.getElementById("myCanvasCPUUsage").width,document.getElementById("myCanvasCPUUsage").height,cpuUsage,100,0);
		animateResultCount_cpuTemp(cpuTemp)
		animateResultCount_mem(memUsage)
		animateResultCount_StorageUsed(internalStorageUsage,internalStorage)
	}
	else if(obj.menuID == "update")
	{
		var updateStatus = obj.updateStatus;
		if (updateStatus == 2){
			alert("System updated, Please restart your system.");
		}
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
function myCanvasvInRadio(vInRadio)
{
	const options = {
		startVal: document.getElementById("vInRadio").innerHTML,
		decimalPlaces: 2,
		useGrouping: false,
		duration: 1
	};
	var c = new CountUp('vInRadio',vInRadio,options)
	c.start();
}
function myCanvasrssi(rssi)
{
	const options = {
		startVal: document.getElementById("rssi").innerHTML,
		decimalPlaces: 0,
		useGrouping: false,
		duration: 1
	};
	var c = new CountUp('rssi',rssi,options)
	c.start();
}

function animateResultCount_cpu(cpuUsage) {
	var currentCpuUsage = document.getElementById("labelCpuUsage").innerHTML.split(' ',1);
	if(currentCpuUsage != cpuUsage) {
		var interval = setInterval(function() {
			if (currentCpuUsage == cpuUsage) {
				clearInterval(interval);
				return;
			}
//			console.log("animateResultCount_cpu",currentCpuUsage ,cpuUsage)
			currentCpuUsage = document.getElementById("labelCpuUsage").innerHTML.split(' ',1);
			myProgressbar("myCanvasCPUUsage",document.getElementById("myCanvasCPUUsage").width,document.getElementById("myCanvasCPUUsage").height,currentCpuUsage,100,0);
		}, 100);
	}
}
function animateResultCount_fwd(fwd) {
	var currentInput = document.getElementById("fwd").innerHTML;
	if(currentInput != fwd) {
		var interval = setInterval(function() {
			if (currentInput == fwd) {
				clearInterval(interval);
				return;
			}
//			console.log("animateResultCount_fwd")
			currentInput = document.getElementById("fwd").innerHTML.split(' ',1);
			myProgressbar2("myCanvasfwd",document.getElementById("myCanvasfwd").width,document.getElementById("myCanvasfwd").height,currentInput,50,0);
		}, 100);;
	}
}
function animateResultCount_vInRadio(vInRadio) {
	var currentVoltage = document.getElementById("vInRadio").innerHTML;
	if(currentVoltage != vInRadio) {
		var interval = setInterval(function() {
			if (currentVoltage == vInRadio) {
				clearInterval(interval);
				return;
			}
			console.log("animateResultCount_vInRadio",currentVoltage, vInRadio)
			currentVoltage = document.getElementById("vInRadio").innerHTML.split(' ',1);
			myProgressbar2("myCanvasvInRadio",document.getElementById("myCanvasvInRadio").width,document.getElementById("myCanvasvInRadio").height,currentVoltage,20,0);
		}, 100);;
	}
}
function animateResultCount_rssi(rssi) {
	var currentRssi = document.getElementById("rssi").innerHTML;
	if(currentRssi != rssi) {
		var interval = setInterval(function() {
			if (currentRssi == rssi) {
				clearInterval(interval);
				return;
			}
//			console.log("animateResultCount_rssi")
			currentRssi = document.getElementById("rssi").innerHTML.split(' ',1);
			myProgressbar2("myCanvasrssi",document.getElementById("myCanvasrssi").width,document.getElementById("myCanvasrssi").height,currentRssi,0,-130);
		}, 100);;
	}
}
function animateResultCount_mem(memUsage) {
	var currentMemUsage = document.getElementById("labelCpuUsage").innerHTML.split(' ',1);
	if(currentMemUsage != memUsage) {
		var interval = setInterval(function() {
			if (currentMemUsage == memUsage) {
				clearInterval(interval);
				return;
			}
//			console.log("animateResultCount_mem")
			currentMemUsage = document.getElementById("labelMemUsage").innerHTML.split(' ',1);
			myProgressbar("myCanvasMemUsage",document.getElementById("myCanvasMemUsage").width,document.getElementById("myCanvasMemUsage").height,currentMemUsage,100,0);
		}, 100);;
	}
}
function animateResultCount_cpuTemp(cpuTemp) {
	var currentCpuTemp = document.getElementById("labelCpuTemp").innerHTML.split(' ',1);
	if(currentCpuTemp != cpuTemp) {
		var interval = setInterval(function() {
			if (currentCpuTemp == cpuTemp) {
				clearInterval(interval);
				return;
			}
//			console.log("animateResultCount_cpuTemp")
			currentCpuTemp = document.getElementById("labelCpuTemp").innerHTML.split(' ',1);
			myProgressbar("myCanvasCpuTemp",document.getElementById("myCanvasCpuTemp").width,document.getElementById("myCanvasCpuTemp").height,currentCpuTemp,100,0);
		}, 100);;
	}
}
function animateResultCount_HWTemp(hwTemp) {
	var currentHWTemp = document.getElementById("labelHWTemp").innerHTML.split(' ',1);
	if(currentHWTemp != hwTemp) {
		var interval = setInterval(function() {
			if (currentHWTemp == hwTemp) {
				clearInterval(interval);
				return;
			}
			
//			console.log("animateResultCount_HWTemp")
			currentHWTemp = document.getElementById("labelHWTemp").innerHTML.split(' ',1);
			myProgressbar("myCanvasHWTemp",document.getElementById("myCanvasHWTemp").width,document.getElementById("myCanvasHWTemp").height,currentHWTemp,100,0);
		}, 100);;
	}
}

function animateResultCount_StorageUsed(storageUsed, stroage) {
	var currentStorageUsed = document.getElementById("labelStorageUsed").innerHTML.split(' ',1);
	if(currentStorageUsed != storageUsed) {
		var interval = setInterval(function() {
			if (currentStorageUsed == storageUsed) {
				clearInterval(interval);
				return;
			}
//			console.log("animateResultCount_HWTemp")
			currentStorageUsed = document.getElementById("labelStorageUsed").innerHTML.split(' ',1);
			myProgressbar("myCanvasStorageUsed",document.getElementById("myCanvasStorageUsed").width,document.getElementById("myCanvasStorageUsed").height,currentStorageUsed,stroage,0);
		}, 100);;
	}
}


function myAnimateCpuUsage(level)
{
	const options = {
		startVal: document.getElementById("labelCpuUsage").innerHTML.split(' ',1),
		decimalPlaces: 1,
		useGrouping: false,
		duration: 0.5,
		suffix: ' %',
	};
	var c = new CountUp('labelCpuUsage',level,options)
	c.start();
}
function myAnimateMemUsage(level)
{
	const options = {
		startVal: document.getElementById("labelMemUsage").innerHTML.split(' ',1),
		decimalPlaces: 1,
		useGrouping: false,
		duration: 0.5,
		suffix: ' %',
	};
	var c = new CountUp('labelMemUsage',level,options)
	c.start();
}
function myAnimateCpuTemp(level)
{
	const options = {
		startVal: document.getElementById("labelCpuTemp").innerHTML.split(' ',1),
		decimalPlaces: 1,
		useGrouping: false,
		duration: 0.5,
		suffix: ' °C',
	};
	var c = new CountUp('labelCpuTemp',level,options)
	c.start();
}
function myAnimateHWTemp(level)
{
	const options = {
		startVal: document.getElementById("labelHWTemp").innerHTML.split(' ',1),
		decimalPlaces: 1,
		useGrouping: false,
		duration: 0.5,
		suffix: ' °C',
	};
	var c = new CountUp('labelHWTemp',level,options)
	c.start();
}

function myAnimateStorageUsed(level)
{
	const options = {
		startVal: document.getElementById("labelStorageUsed").innerHTML.split(' ',1),
		decimalPlaces: 1,
		useGrouping: false,
		duration: 0.5,
		suffix: ' GB',
	};
	var c = new CountUp('labelStorageUsed',level,options)
	c.start();
}


function myProgressbar(elementID,width, height, level, maxLevel, minLevel)
{
	var gradient;
	var arcBegin = 0;
	var arcEnd = level-minLevel;
	var arcBgEnd = maxLevel-minLevel;
	var x = width / 2;
	var y = height / 2;
	var start = arcBegin;
	var end = arcEnd;
	var end_bg = arcBgEnd;
	var c = document.getElementById(elementID);
	var ctx = c.getContext("2d");
	
	ctx.clearRect(0,0,width,height);
	
	ctx.fillStyle = "gray";
	ctx.beginPath();
	ctx.fillRect(0,0,width,height);
	
	gradient = ctx.createLinearGradient(0,0,width,width/2);
	gradient.addColorStop(0,'#1DE9B6');
	gradient.addColorStop(0.3,'#1DE9B6');
	gradient.addColorStop(0.5,'#FFFF00');
	gradient.addColorStop(0.8,'#FF0000');
	gradient.addColorStop(1,'#FF0000');
	ctx.fillStyle = gradient;
	
	
	var fillVal = Math.min(Math.max(end/end_bg,0),1);
	ctx.fillRect(0,0,fillVal*width,height);
	ctx.stroke();
}
function myProgressbar2(elementID,width, height, level, maxLevel, minLevel)
{
	var arcBegin = 0;
	var arcEnd = level-minLevel;
	var arcBgEnd = maxLevel-minLevel;
	var x = width / 2;
	var y = height / 2;
	var start = arcBegin;
	var end = arcEnd;
	var end_bg = arcBgEnd;
	var c = document.getElementById(elementID);
	var ctx = c.getContext("2d");
	
	ctx.clearRect(0,0,width,height);
	
	ctx.fillStyle = "gray";
	ctx.beginPath();
	ctx.fillRect(0,0,width,height);
	
	ctx.fillStyle = "#FA057E";;
	
	
	var fillVal = Math.min(Math.max(end/end_bg,0),1);
	ctx.fillRect(0,0,fillVal*width,height);
	ctx.stroke();
}

function myProgressCircle(fwd, vInRadio, inputMin, inputMax, outputMin, outputMax, current_val)
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
	var strCurrent
	if (current_val >= 1000){
		strCurrent = (current_val/1000.0).toFixed(2) + " A"
	}
	else{
		strCurrent = (current_val*1.0).toFixed(0) + " mA"
	}
		
	ctx.clearRect(0,0,size,size)
	// outline
	ctx.beginPath();
	ctx.arc(x, y, (size / 2) - lineWidth / 2 ,start_bg, end_bg, false);
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = "#ffffff"
	ctx.stroke(); 
	
	//Input Level
	arcBegin = 180+270
	arcEnd = (((fwd-inputMin)/(inputMax-inputMin))*180)+90;
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
	arcEnd = (((vInRadio-outputMin)/(outputMax-outputMin))*180)+270;
	if (arcEnd < 270)
		arcEnd = 270
	start = Math.PI * (arcBegin / 180)
	end = Math.PI * (arcEnd / 180)
	
	ctx.beginPath();
	ctx.arc(x + lineWidth, y + lineWidth,(size / 2) - lineWidth / 2 ,start, end, false);
	ctx.lineWidth = lineWidth
	gradient = ctx.createLinearGradient(0,0,size/2,size)
	gradient.addColorStop(1,'#1DE9B6')
	gradient.addColorStop(0.8,'#FFFF00')
	gradient.addColorStop(0.6,'#FFFF00')
	gradient.addColorStop(0.4,'#FF0000')
	gradient.addColorStop(0,'#FF0000')
	ctx.strokeStyle = gradient
	ctx.stroke(); 
	
	ctx.fillStyle = "#FA057E";
	ctx.font = "60px sans-serif";
	var strGain = (vInRadio - fwd).toFixed(2)
	drawCenteredText(strGain, x, y + lineWidth);
	
	ctx.fillStyle = "#FA057E";
	ctx.font = "24px sans-serif";
	drawCenteredText(strCurrent, x, y + lineWidth-50);
	
	ctx.fillStyle = "gray";
	ctx.font = "20px sans-serif";
	drawCenteredText("Gain (dB)", x, y + lineWidth+45);
	
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
