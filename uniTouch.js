/* uniTouch Tuio and simple gestures handler
 * Author: Jean-François VIAL <http://about.me/Jeff_> for Modulaweb <http://modulaweb.fr>
 * License: LGPL V3 <http://www.gnu.org/licenses/lgpl.html>
 * Please, read the license carefully.
 * This software is free software and provided «As Is» withous any guarantee of
 * any kind.
 */

/******************************************************************************/
// here is the uniTouch object that include a tuio object handler
var uniTouch = {
    // tuio handling inspired from MagicTouch by Boris Smus https://github.com/borismus/MagicTouch
    tuioCursors: [],
    tuioData: {},
    tuioCreateEvent: function(touch) {
	    var date = new Date();
        var event = {}
        event.touches = this.tuioCursors;
        event.targetTouches = this.tuioGetTargetTouches(touch.target);
        event.changedTouches = [touch];
        event.timeStamp = date.getTime();
        return event;
    },
    tuioGetTargetTouches: function(element) {
        var targetTouches = [];
        for (var i = 0; i < this.tuioCursors.length; i++) {
            var touch = this.tuioCursors[i];
            if (touch.target == element) {
                targetTouches.push(touch);
            }
        }
        return targetTouches;
    },
    tuioCallback: function(type, sid, fid, x, y, angle) {
	    var data;
	    if (type !== 3) {
		    data = this.tuioData[sid];
	    } else {
		    data = {sid: sid, fid: fid};
		    this.tuioData[sid] = data;
	    }
        data.identifier = sid;
        data.pageX = window.innerWidth * x;
        data.pageY = window.innerHeight * y;
        data.clientX = x;
        data.clientY = y;
        data.target = document.elementFromPoint(data.pageX, data.pageY);
 	    switch (type) {
		    case 3:
			    this.tuioCursors.push(data);
			    this.touchStart(this.tuioCreateEvent(data));
			    break;
		    case 4:
			    this.touchMove(this.tuioCreateEvent(data));
			    break;
		    case 5:
			    this.tuioCursors.splice(this.tuioCursors.indexOf(data), 1);
			    this.touchEnd(this.tuioCreateEvent(data));
			    break;
		    default:
			    break;
	    }
	    if (type === 5) delete this.tuioData[sid];
    },
    
    // uniTouch really starts here 
    
    // parameters to adjust to your needs (better not change them here but in your own script)
    tolerance: 50,              // tolerance in px
    gracePeriod: 200,           // time (in ms) to stand by before to raise a new event  
    pressTime: 900,             // time (in ms) to stand by before thinking there is a press or hold
    raiseTouchEvents: false,    // whether or not raise classic touch events (touch{start|move|end})

    // do not modify from this line (if you do not want to brake things)
    
    // internal vars
    distance: 0,
    delta: 0,
    direction:0,
    points: [],
    previousPoints: [],
    initialPoints: [],
    initialAngle: 0,
    previousAngle: 0,
    area: 0,
    centroid:{x: null, y: null},
    lastRaisedEvent: 0,
    tapRaised: false,
    pressRaised: false,
    holdRaised: false,
    holdTimer: null,
    holdTouches: null,
    
    // is val in between array's min and max ?
    isInto : function(val,array) {
        array.sort();
        return (val >= array[0] && val <= array[array.length-1]);
    },
    // limit val to array's min and max. return array(min) < val < array(max)
    limit : function(val,array) {
        array.sort();
        if (val > array[array.length-1]) return array[array.length-1];
        if (val < array[0]) return array[0];
        return val;
    },
    // are those a1 and a2 arrays the same ? (not reccursive, we don't need here)
    sameArrays: function(a1,a2) {
        if (a1.length != a2.length) return false;
        if (a1.length == 0 || a2.length == 0) return false;
        for (var i in a1) {
            if (a1[i] !== a2[i]) return false;
        }
        return true;
    },
    // get the touches and format them in a easier way to handle
    getTouches: function(aTouches,timeStamp) {
        var touches = [];
        for (var i in aTouches) {
            var t = {};
            t.timeStamp = timeStamp;
            t.id = aTouches[i].identifier;
            t.x = aTouches[i].pageX;
            t.y = aTouches[i].pageY;
            touches.push(t);
        }
        return touches;
    },
    // compute the area of the polygon made by the touches
    computeArea: function() {
        if (this.points.length > 2) {
            var a=0;
            var pts = this.points;
            var nPts = pts.length;
            var j=nPts-1;
            var p1; var p2;

            for (var i=0;i<nPts;j=i++) {
                p1=pts[i]; p2=pts[j];
                a+=p1.x*p2.y;
                a-=p1.y*p2.x;
            }
            a/=2;
            this.area = a;
        } else {
            this.area = 0;
        }
    },
    // compute the centroid of the polygon made by the touches
    computeCentroid: function () {
        if (this.points.length > 2) {
            var pts = this.points;
            var nPts = pts.length;
            var x=0; var y=0;
            var f;
            var j=nPts-1;
            var p1; var p2;

            for (var i=0;i<nPts;j=i++) {
                p1=pts[i]; p2=pts[j];
                f=p1.x*p2.y-p2.x*p1.y;
                x+=(p1.x+p2.x)*f;
                y+=(p1.y+p2.y)*f;
            }
            f=this.area*6;

            this.centroid = {x: x/f, y: y/f};
        } else if (this.points.length == 2){
            var p0 = this.points[0];
            var p1 = this.points[1]
            if (p1.x > p0.x)
                var x = (p1.x - p0.x) / 2 + p0.x;
            else if (p0.x > p1.x)
                var x = (p0.x - p1.x) / 2 + p1.x;
            else
                var x = p0.x;
            if (p1.y > p0.y)
                var y = (p1.y - p0.y) / 2 + p0.y;
            else if (p0.y > p1.y)
                var y = (p0.y - p1.y) / 2 + p1.y;
            else
                var y = p0.y;
            this.centroid = {x: x, y: y};
            return this.centroid;
        } else {
            this.centroid = {x: this.points[0].x, y: this.points[0].y};
        }
    },
    // get the distance between two arbitrary points, of the first two touches
    getDistance: function(p0,p1) {
        if (p0 === undefined)
            var p0 = this.points[0];
        if (p1 === undefined)
            var p1 = this.points[1];
        var dist = Math.sqrt(
            Math.pow(p0.x - p1.x, 2) +
            Math.pow(p0.y - p1.y, 2)
        );
        return dist;
    },
    // get the angle in degrees between the line made by two points and the horizontal line
    getAngle: function(p0,p1) {
        if (p0 === undefined)
            var p0 = this.points[0];
        if (p1 === undefined)
            var p1 = this.points[1];
        var p2 = {
            x: Math.abs(p0.x - p1.x),
            y: Math.abs(p0.y - p1.y)
        };
        
        var angle = Math.atan2(p2.y,p2.x) * 180 / Math.PI;
        angle = 90 - angle;
        if ( 
            ((p0.x > p1.x) && (p0.y > p1.y))
            ||
            ((p1.x > p0.x) && (p1.y > p0.y))
        ) {
            angle *= -1;
        }
        return angle;
    },
    
    // reset the uniTouch object to its default internal values
    reset : function() {
        this.initialPoints = [];
        this.previousPoints = [];
        this.points = [];
        this.distance =  0;
        this.delta =  0;
        this.direction =  0;
        this.area = 0;
        this.centroid = {x: null, y: null};
        this.initialAngle = 0;
        this.previousAngle = 0;
        this.pressRaised = false;
        this.holdRaised = false;
        this.holdTouches = null;
        window.clearTimeout(this.holdTimer);
    },
    // prepare the uniTouch object to handle gestures
    init: function(touches) {
        if (!this.sameArrays(this.previousPoints,touches)) this.previousPoints = this.points;
        this.points = touches;
        this.computeArea();
        this.computeCentroid();
    },

    // event raising
    raiseEvent: function(name,attributes) {
        var event = document.createEvent('CustomEvent');
        event.initEvent(name, true, true);
        for (var attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) event[attribute] = attributes[attribute];
        }
        document.dispatchEvent(event);
    },

    // gestures testing
    isTap: function(touches) {
        if (
            touches[0].id == this.initialPoints[0].id
            && this.getDistance(touches[0],this.initialPoints[0]) < this.tolerance
            && touches[0].timeStamp < this.initialPoints[0].timeStamp + this.gracePeriod*3
        ) return true;
        return false;
    },
    isPress: function(touches) {
        if (
            touches[0].id == this.initialPoints[0].id
            && this.getDistance(touches[0],this.initialPoints[0]) < this.tolerance
            && touches[0].timeStamp > this.initialPoints[0].timeStamp + this.pressTime
        ) return true;
        return false;
    },
    isSwipe: function(touches) {
        var distance = this.getDistance(touches[0],this.initialPoints[0]);
        if (touches[0].id == this.initialPoints[0].id
            && distance > this.tolerance * 1.5
        ) {
            if (this.isInto(touches[0].x, [this.initialPoints[0].x - this.tolerance * 2,this.initialPoints[0].x + this.tolerance * 2])) {
                if (touches[0].y > this.initialPoints[0].y) {
                    var direction = 'down';
                } else {
                    var direction = 'up';
                }
                distance: Math.abs(touches[0].y - this.initialPoints[0].y);
            } else if (this.isInto(touches[0].y, [this.initialPoints[0].y - this.tolerance * 2,this.initialPoints[0].y + this.tolerance * 2])) {
                if (touches[0].x > this.initialPoints[0].x) {
                    var direction = 'right';
                } else {
                    var direction = 'left';
                }
                distance: Math.abs(touches[0].x - this.initialPoints[0].x);
            }
            var speed = distance / (touches[0].timeStamp - this.initialPoints[0].timeStamp);
            return {direction: direction, speed: speed, distance: distance};
        }
        return false;
    },
    isPinchZoom: function(touches) {
        var cur_distance = this.getDistance(touches[0],touches[1]);
        if (cur_distance != this.distance) {
            var cur_delta = cur_distance - this.distance;
            if (Math.abs(cur_delta - this.delta) > this.tolerance) {
                var dir = 0;
                if ((cur_delta - this.delta) > 0) dir = 1;
                if ((cur_delta - this.delta) < 0) dir = -1;
                if (dir != 0) {
                    this.direction = dir;
                    this.delta = cur_delta;
                    return dir;
                }
            }
        }
        return false;
    },
    isRotate: function(touches) {
        var newAngle = this.getAngle(touches[0],touches[1]);
        if (
            this.getDistance(this.initialPoints[0],touches[0]) < this.tolerance
            &&
            this.getDistance(this.initialPoints[1],touches[1]) < this.tolerance
        ) return false;
        if (this.initialAngle > newAngle) {
            var direction = 'right';
        } else if (this.initialAngle < newAngle) {
            var direction = 'left';
        } else {
            return false;
        }
        return {direction: direction, angle: newAngle};
    },
    
    doHold: function() {
        this.holdTouches[0].timeStamp += this.gracePeriod + 1;
        var press = this.isPress(this.holdTouches);
        if (press) {
            if (!this.pressRaised) {
                this.lastRaisedEvent = this.holdTouches[0].timeStamp;
                this.pressRaised = true;
                var data = {centroid: {x: this.initialPoints[0].x, y: this.initialPoints[0].y}, target: document.elementFromPoint(this.centroid.x, this.centroid.y)};
                this.raiseEvent('press', data);
            } else {
                this.lastRaisedEvent = this.holdTouches[0].timeStamp;
                this.holdRaised = true;
                var data = {centroid: {x: this.initialPoints[0].x, y: this.initialPoints[0].y}, target: document.elementFromPoint(this.centroid.x, this.centroid.y)};
                this.raiseEvent('hold', data); // finger is still at the same place !
            }
        }
        this.holdTimer = window.setTimeout(function(){uniTouch.doHold();},this.gracePeriod+1);
    },

   
    // touch event handling
    touchStart : function(aEvent) {
        if (this.raiseTouchEvents) this.raiseEvent('touchstart', aEvent);
        this.reset();
        var touches = this.getTouches(aEvent.touches,aEvent.timeStamp);
        this.init(touches);
        this.initialPoints = touches;
        if (touches.length > 1) {
            this.distance = this.getDistance();
            if (touches.length == 2) {
                this.initialAngle = this.getAngle(touches[0],touches[1]);
                this.previousAngle = this.initialAngle;
            }
        } else {
            this.holdTouches = this.getTouches(aEvent.touches,aEvent.timeStamp);
            this.holdTimer = window.setTimeout(function(){uniTouch.doHold();},this.gracePeriod+1);        
        }
    }, 

    touchEnd : function(aEvent) {
        if (this.raiseTouchEvents) this.raiseEvent('touchend', aEvent);
        if (this.initialPoints.length == 1) {
            var touches = this.getTouches(aEvent.changedTouches,aEvent.timeStamp);
            window.clearTimeout(this.holdTimer);
            if (this.holdRaised) {
                var data = {centroid: {x: this.initialPoints[0].x, y: this.initialPoints[0].y}, target: document.elementFromPoint(this.initialPoints[0].x, this.initialPoints[0].y)};
                this.raiseEvent('release', data);
            }
            var tap = this.isTap(touches);
            if (tap) {
                this.lastRaisedEvent = aEvent.timeStamp;
                var data = {centroid: {x: this.initialPoints[0].x, y: this.initialPoints[0].y}, target: document.elementFromPoint(this.initialPoints[0].x, this.initialPoints[0].y)};
                if (!this.tapRaised) {
                    this.tapRaised = true;
                    this.raiseEvent('tap', data);
                } else {
                    this.tapRaised = false;
                    this.raiseEvent('doubletap', data);
                }
                return;
            }
            // not a tap, maybe a swipe
            var swipe = this.isSwipe(touches);
            if (swipe) {
                swipe.target = document.elementFromPoint(this.initialPoints[0].x, this.initialPoints[0].y);
                this.raiseEvent('swipe'+swipe.direction, swipe);
                this.raiseEvent('swipe', swipe);
                return;
            }
        }
        
    }, 
    
    touchMove : function(aEvent) {
        if (this.raiseTouchEvents) this.raiseEvent('touchmove', aEvent);
        if (this.lastRaisedEvent + this.gracePeriod < aEvent.timeStamp) {
           var touches = this.getTouches(aEvent.touches,aEvent.timeStamp);
            this.init(touches);
            if (touches.length == 2) {
                // pinchZoom
                var pinchZoom = this.isPinchZoom(touches);
                if (pinchZoom !== false) {
                    var data = {direction: pinchZoom, centroid: this.centroid, target: document.elementFromPoint(this.centroid.x, this.centroid.y)};
                    if (pinchZoom > 0) {
                        this.raiseEvent('pinchzoomin', data);
                        this.raiseEvent('pinch', data);
                    } else if (pinchZoom < 0 ) {
                        this.raiseEvent('pinchzoomout', data);
                        this.raiseEvent('spread', data);
                    }
                    this.lastRaisedEvent = aEvent.timeStamp;
                    this.raiseEvent('pinchzoom', data);
                }
                var rotate = this.isRotate(touches);
                if (rotate !== false) {
                    rotate.centroid = this.centroid;
                    rotate.target = document.elementFromPoint(touches[0].x, touches[0].y);
                    if (rotate.direction == 'right') {
                        this.raiseEvent('rotateright', rotate);
                    } else {
                        this.raiseEvent('rotateleft', rotate);
                    }
                    this.lastRaisedEvent = aEvent.timeStamp;
                    this.raiseEvent('rotate', rotate);
                }
            }
        }
    }    
}
// the classic Tuio Callback Function : just don't remove !
function tuio_callback(type, sid, fid, x, y, angle)	{
	uniTouch.tuioCallback(type, sid, fid, x, y, angle);
}

