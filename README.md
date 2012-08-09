uniTouch
========

A Tuio handler and a simple gesture event detector written in javascript licensed under the [LGPL V3](http://www.gnu.org/licenses/lgpl.html)

It replace the [Magictouch.js](https://github.com/borismus/MagicTouch) handler by Boris Smus and uses some parts of it.

Have a look at the testcase.html file to see how to use it.

With this handler, you don't have to worry about basic touch{start|move|end} events. Those same events wont disturb some scripts like OpenLayers and it generates some gesture events like : 
* pinchzoom
* pinchzoomin
* pinchzoomout
* swipe
* swipeup
* swipedown
* swipeleft
* swiperight
* tap
* doubletap
* press (a finger is hold on screen for a long time)
* hold (a finger is hold, longer than press)
* release (the holded finger is released)
* rotate => not very accurate yet but somehow usable
* rotateleft => not very accurate yet but somehow usable
* rotateright => not very accurate yet but somehow usable

TODO: write a better angle calculator and a better rotate detector
TODO: allow two fingers swipe
TODO: allow multiple gesture to be raised at the same time (by 2 different hands for example)
TODO: allow the use of complex multitouch gestures…
TODO: buy a new brain
