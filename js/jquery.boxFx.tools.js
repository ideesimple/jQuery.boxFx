/*
    // jQuery tools
    // GPL/MIT License - @molokoloco 2011 - http://b2bweb.fr
    // Dependancy to moderniz.js for $.fn.crossCss
*/

// I use this for debuging ^^
var db  = function() { 'console' in window && console.log.call(console, arguments); };

(function($, window) {

    $.toolsLoaded = true; // Declare tools.js as loaded...

    // Beziers equation approximations from Matthew Lein's Ceaser: http://matthewlein.com/ceaser/
    // Remixed for this use : "transition:'all 3000ms '+$.cubicBeziers.easeInOutQuad;"
    // If values outside range 0>=X=<1 can produce a bug, in chrome for example
    var qbo = 'cubic-bezier(', qbc = ')';
    $.cubicBeziers = {
        bounce:         qbo+'0.000,0.350,0.500,1.300'+qbc, // !
        snap:           qbo+'0.000,1.000,0.500,1.000'+qbc,
        easeInQuad:     qbo+'0.550,0.085,0.680,0.530'+qbc,
        easeInCubic:    qbo+'0.550,0.055,0.675,0.190'+qbc,
        easeInQuart:    qbo+'0.895,0.030,0.685,0.220'+qbc,
        easeInQuint:    qbo+'0.755,0.050,0.855,0.060'+qbc,
        easeInSine:     qbo+'0.470,0.000,0.745,0.715'+qbc,
        easeInExpo:     qbo+'0.950,0.050,0.795,0.035'+qbc,
        easeInCirc:     qbo+'0.600,0.040,0.980,0.335'+qbc,
        easeOutQuad:    qbo+'0.250,0.460,0.450,0.940'+qbc,
        easeOutCubic:   qbo+'0.215,0.610,0.355,1.000'+qbc,
        easeOutQuart:   qbo+'0.165,0.840,0.440,1.000'+qbc,
        easeOutQuint:   qbo+'0.230,1.000,0.320,1.000'+qbc,
        easeOutSine:    qbo+'0.390,0.575,0.565,1.000'+qbc,
        easeOutExpo:    qbo+'0.190,1.000,0.220,1.000'+qbc,
        easeOutCirc:    qbo+'0.075,0.820,0.165,1.000'+qbc,
        easeInOutQuad:  qbo+'0.455,0.030,0.515,0.955'+qbc,
        easeInOutCubic: qbo+'0.645,0.045,0.355,1.000'+qbc,
        easeInOutQuart: qbo+'0.770,0.000,0.175,1.000'+qbc,
        easeInOutQuint: qbo+'0.860,0.000,0.070,1.000'+qbc,
        easeInOutSine:  qbo+'0.445,0.050,0.550,0.950'+qbc,
        easeInOutExpo:  qbo+'1.000,0.000,0.000,1.000'+qbc,
        easeInOutCirc:  qbo+'0.785,0.135,0.150,0.860'+qbc
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Somes prototyping utilities...
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // "border-radius" -> "borderRadius"
    String.prototype.toCamel = function() {
        return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
    };

    // "borderRadius" -> "border-radius"
    String.prototype.toDash = function(){
        return this.replace(/([A-Z])/g, function($1){return '-'+$1.toLowerCase();});
    };

    // Cross-browsers requestAnimationFrame
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimFrame = (function() {
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(/* function */ callback, /* DOMElement */ element){
                  window.setTimeout(callback, 1000 / 60);
              };
    })();

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Somes utilities, setted as public through the jQuery obj
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Generate random numbers...
    $.getRand = function(miin, maax) {
        return parseInt(miin + (Math.random() * (maax - miin)), 10);
    };

    // Lightest TPL // $.getTpl('<div>#title#</div>', {title:'toto'}) // '<div>toto</div>'
    $.getTpl = function(tpl, val) {
        for (var p in val)
            tpl = tpl.replace(new RegExp('#'+p+'#', 'gi'), val[p] || ''); // jQuery Bug  for "{" into attributes, so now i use #name#
        return tpl;
    };

    var uniqueId = null;
    $.getUniqueName = function(prefix) {
        if (!uniqueId) uniqueId = (new Date()).getTime();
        return (prefix ? prefix : 'id_') + uniqueId++;
    };

    // Deep clean obj keys when set with "null" or empty values (config/CSS/...)
    $.removeObjEmptyValue = function(obj) {
        $.each(obj, function(i, val) {
            if (!val && val !== 0 && val !== false) delete obj[i];
            else if (typeof obj[i] == 'object')     $.removeObjEmptyValue(obj[i]);
        });
    };

    $.getJs = function(jsPath, async) { // getJS('http://other.com/new.js'); // External link
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = jsPath;
        if (async) script.async = true;
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    // jQuery come with :
    // $.getScript('./test.js', function(data, textStatus){});
    // But i need something more flexy
    /* $.loadJs = function(src, async, callback) { // loadJs('./new.js', function() { ok(); }); // On-demand same domain JS
        return $.ajax({
            url:src, async:async || 0, dataType:'script', cache:1,
            error:function(){ alert('Sorry, some JS file not found : '+src); },
            success:function() { if (callback && typeof callback == 'function') callback(); }
        });
    }; */ // Commented : Already in index.html

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CROSS-BROWSERS
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Inspired by my old work here http://goo.gl/hL3om
    $.browserPrefix = (function(browser) { // Closure for putting result in cache
        var browsers = {firefox:'moz', applewebkit:'webkit', webkit:'webkit', opera:'o', msie:'ms'};
        for (var p in browsers)
            if (browser.indexOf(p) !== -1)
                return browsers[p];
        return false;
    })(navigator.userAgent.toLowerCase());

    // Cf Modernizr doc // "Static" fct
    // Waiting some crazy guy to implements this
    var setEventPrefix = function() { // Todo : add support for animationstart, animationend, animationiteration
        switch(Modernizr.prefixed('transition')) {
            case 'WebkitTransition' :
                $.transitionEnd  = 'webkitTransitionEnd'; // Set in accessible jQuery obj
                $.animationStart = 'webkitAnimationStart';
                $.animationEnd   = 'webkitAnimationEnd';
                break;
            case 'MozTransition' :
                $.transitionEnd  = 'transitionend';
                $.animationStart = 'animationstart';
                $.animationEnd   = 'animationend';
                break;
            case 'OTransition' :
                $.transitionEnd  = 'oTransitionEnd';
                $.animationStart = 'oAnimationStart';
                $.animationEnd   = 'oAnimationEnd';
                break;
            case 'msTransition' :
                $.transitionEnd  = 'msTransitionEnd';
                $.animationStart = 'msAnimationStart';
                $.animationEnd   = 'msAnimationEnd';
                break;
            case 'transition' :
                $.transitionEnd  = 'transitionEnd';
                $.animationStart = 'animationStart';
                $.animationEnd   = 'animationEnd';
                break; 
        }
    };
    setEventPrefix();
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // jQuery "plugins"
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Fix and apply styles on element with correct browsers prefix
    // $(e).crossCss({borderRadius:'10px'}) >>> $(e).css({WebkitBorderRadius:'10px'})
    // Use Modernizr : https://github.com/Modernizr/Modernizr/blob/master/modernizr.js
    // Modernizr.prefixed("borderRadius"); // e.g FF3.6 'MozBorderRadius', FF4 'borderRadius'
    $.fn.crossCss = function(css) {
        return this.each(function() {
            var $this = $(this);
            if (typeof css != 'object') return $this;
            for (var p in css) {
                if (Modernizr.prefixed(p))
                    css[Modernizr.prefixed(p)] = css[p]; // Add prefix ?
            }
            return $this.css(css);
         });
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // boxFx config and CSS manipulations
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Time with unit : 'ms' | 's' // return int(ms)
    $.getMsDuration = function(val) {
        var ms = parseFloat(val, 10);
        if (val.substr(-2) != 'ms')
            ms = (ms * 1000); // convert s in ms
        return ms;
    };

    // Here somes (css) properties units that can be related to a % of parent box
    // The plugin deal with "px" and "%" units. They are converted and all units are stripped
    // 10, '10px' or '0.5%' >>> (int/float)10 (px)
    $.getSize = function(size, sizeContainer) {
        if (size && String(size).substr(-1) == '%') // /\%/.test(size))
            size = (parseFloat(size) / 100) * sizeContainer;
        return parseInt(size, 10); // int for starting/ending positions (better pixel alias affect)
    };

    // Measurement properties workables by the plugin : convert settings unit in px
    var cssWidthPropsWithPix  = 'width minWidth maxWidth left right marginLeft marginRight maxSize'.split(' '),
        cssHeightPropsWithPix = 'height minHeight maxHeight top bottom marginTop marginBottom'.split(' ');

    $.fixCssUnit = function(css, parentW, parentH) { // Work by reference on the orignal obj (no values return)
        $.each(cssWidthPropsWithPix, function(i, key) {
            if (key in css && css[key]) css[key] = $.getSize(css[key], parentW);
        });
        $.each(cssHeightPropsWithPix, function(i, key) {
            if (key in css && css[key]) css[key] = $.getSize(css[key], parentH);
        });
    };

    $.addCssUnit = function(css) {
        $.each(cssWidthPropsWithPix, function(i, key) {
            if (key in css && css[key] && typeof css[key] == 'number') css[key] = css[key]+'px';
        });
        $.each(cssHeightPropsWithPix, function(i, key) {
            if (key in css && css[key] && typeof css[key] == 'number') css[key] = css[key]+'px';
        });
    };

    // Set or update a new CSS style in <head> // TODO - BETTER !!!
    var $cssAnimation = $('style#cssAnimation');
    $.setCssClass = function(clss) {
        if (!$cssAnimation || $cssAnimation.length < 1)
            $cssAnimation = $('<style type="text/css" id="cssAnimation"></style>').appendTo('head');
        // var currentStyle = ($cssOveride.html()).replace(new RegExp('('+clss+'{'+p+'})', 'g'), val[p] || ''); // TODO
        // div#sprite > div { background-color:'+value+'; }\
        $cssAnimation.html($cssAnimation.html() + clss);
    };

    // Building CSS animation(s) from 'options.keyframes' OBJ (cf. ./jquery.boxFx.presets.js)
    // Convert JS obj to cross-browsers CSS3 keyframes anim
    // Inject keyframes class in <head> stylesheet
    // Return "obj" with 'animation' et 'animationFillMode' (to apply on a element)
    // http://jsfiddle.net/molokoloco/rf8zt/
    $.buildKeyframeClass = function(keyframes) {
        var cssKeyframes = [], cssAnimations = [], cssAnimationsFillMode = [];
        $.each(keyframes, function(i, animation) {
            if (!animation.name) animation.name = $.getUniqueName('boxFxAnim');
            if (!animation.delay || parseInt(animation.delay, 10) < 1) animation.delay = '';
            cssAnimations.push(animation.name+' '+animation.duration+' '+animation.timingFunction+' '+animation.delay+' '+animation.iterationCount+' '+animation.direction);
            cssAnimationsFillMode.push(animation.fillMode); // http://www.w3.org/TR/css3-animations/#the-animation-shorthand-property-
            var cssSteps = [];
            $.each(animation.steps, function(j, stepObj) {
                var stepObjPropsString = (typeof stepObj.step == 'number' ? stepObj.step+'%' : stepObj.step)+' { '; // stepObj.step == 0 | '0%' | '0%, 100%'
                $.each(stepObj, function(k, step) {
                    if (k == 'step') return; // continue : only non CSS properties
                        stepObjPropsString += String(Modernizr.prefixed(k) || k).toDash()+': '+step+'; ';
                });
                stepObjPropsString += ' } ';
                cssSteps.push(stepObjPropsString );
            });
            cssKeyframes.push('@-'+$.browserPrefix+'-keyframes '+animation.name+' { '+cssSteps.join(' ')+' }');
        });
        $.setCssClass(cssKeyframes.join('\n')); // addCssClass ?
        return {animation:cssAnimations.join(','), animationFillMode: cssAnimationsFillMode.join(',')}; // apply this to element, with 'crossCss()', to trigger keyframe
    };

})(jQuery, window);