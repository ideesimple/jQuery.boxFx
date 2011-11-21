///////////////////////////////////////////////////////////////////////////////////////////////////////////
// jQuery.boxFx.js (Beta V0.92) is like a "DOM particles emitter" factory
// Clash the DOM with the most optimized jQuery animations framework on earth ^^
// GPL/MIT/Copyleft : @molokoloco 28/10/2011 - http://b2bweb.fr
//
// Infos            : http://goo.gl/P18db
// Plain demo       : http://www.b2bweb.fr/framework/jquery.emitter/jquery.emitter.html
// Cloud9ide        : http://cloud9ide.com/molokoloco/jquery_emitter
// Live demo        : http://jsfiddle.net/molokoloco/aqfsC/
// Sources          : https://github.com/molokoloco/jquery.emitter
// Download         : http://www.b2bweb.fr/framework/jquery.emitter/jquery.emitter.zip (V0.6)
//
// ./README.txt for for infos !!!
///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Ok, i use this for debuging ^^
;var db  = function() { 'console' in window && console.log.call(console, arguments); },
     die = function(mess) { throw(( mess ? mess : "Oh my god, moonWalker is down...")); };

///////////////////////////////////////////////////////////////////////////////
// And here we go !
(function ($, window) {
    
    // JS Dependancy ?
    if (typeof(Modernizr) != 'object')       alert('$.fn.boxFx require "./js/modernizr(.min).js"');    // Moderniz for Cross browser CSS-Prefix support
    if (!$.toolsLoaded)                      alert('$.fn.boxFx require "./js/jquery.tools.js"');       // $tools... Finally moved to independant file

    // Does the current browser support CSS Transitions ? We silently fall back ?
    if (!Modernizr.csstransitions)           db('Sad, your old browser don\'t support CSS transition ^^');
    //if (!(Modernizr.prefixed('transition'))) alert('$.fn.boxFx require a (modern) browser, sorry...'); // Don't you play ?
    if (!Modernizr.csstransforms3d)          db('Sad, your old computer don\'t support CSS 3D... as mine ^^');

    ///////////////////////////////////////////////////////////////////////////////
    // PUBLIC : default plugin properties
    ///////////////////////////////////////////////////////////////////////////////
    // See ./js/jquery.boxFx.presets.js for FULL options arguments list
    // Options above a setted to the minimal, they makes things works when no values are provided
    // Particules seeds are 'options.seeds' or 'options.targets'...
    
    var _db_ = false; // Activate boxFx debug logs ?

    $.boxFxOptions = {                       // $.emitter() defaults params Object
        seeds                 : '<div/>',    // '<tag/>' OR '<div class="test">N°{id} - {title}</div>' // Generated DOM element with or without template...
        targets               : null,        // 'img.thumb' // ... OR existing elements inside this container
                                             // options.seeds OR options.targets can have (dynamic) innerHtml template : {mapped} with some datas
        data                  : null,        // [{id:1, title:'toto'}, {id:2, title:'tutu'}, {}] OR 'callback' : callback(currentIndex) OR $.getJSON('./movies.json')
        styles2Class          : true,        // Convert styles to 'class' in <head> instead of dealing in the DOM, for each elements : Cannot be "live" edited
        clss                  : null,        // Custom CSS static (starting) class, default : null (Cf. $.boxFxOptions.styles)
        //perspective         : null,        // 500px // if seeds 'options.styles.webktiTransformStyle' == 'preserve-3d', apply perspective to seeds container

                                             // Optionnal boxFx TYPE : elements iterator, with or without "dispatching effect"
        effect                : null,        // nebula, artifice, center, '' or null // Add your custom effect !
        emitterRadius         : 0,           // 10, '10px' or '50%' // Radius of the boxFx inside the boxFx
        emitterCenterLeft     : null,        // 10, '10px' or '50%' // Seeder position, default to center (50%)
        emitterCenterTop      : null,
        delay                 : null,        // 1500, 0, null // time (ms) interval between seeds // 0 use requestAnimationFrame (as fast as possible) // 'null' : defaut to slowest anim
        maxSeeds              : null,        // Max "seeds" at one moment // Overrided by 'options.targets.length' if setted // else by default == 'options.transition.duration / options.delays'
        newAtTop              : 'random',    // 'random' OR bolean // New element appear in top of others ?
        stopAtEnd             : null,        // Regenerate elements forever or not, after transitionEnd 

        // Pure CSS3 styles, cross-browser compatibility added when possible with modernizr.js
        // Can be overriden by options.effect && options.transition.stylesTo
        // Every CSS property allowed, see ./js/jquery.boxFx.presets.js for examples
        styles                : null,
        // Nb : You cannot animate both 'options.transition.stylesTo.transform' and 'options.keyframes[0].steps[0].transform'
        // But, for example, you can move 1 times the seed with 'options.transition.stylesTo.left'
        // ...and do an infinite rotation in 'options.keyframes[x].steps[x].transform'
        transition            : null,        // By default no transition
        keyframes             : null         // By default no keyframes animation(s)
    };

    // If no starting class 'options.clss' and no 'options.styles' is given, fallback to these minimal settings...
    $.boxFxOptions.defaultStyles = {
        position              : 'absolute',
        display               : 'block',
        zIndex                : 500,
        width                 : 50,
        height                : 50,
        backgroundColor       : 'rgb(255, 255, 0)' // Something visible by default
    };

    // If 'options.effect' but no 'options.transition' is set... default transition
    $.boxFxOptions.defaultTransition = {     // In 'options.transition' The 3 arguments below must be sets
        properties            : 'all',
        duration              : '2500ms',
        timingFunction        : 'ease',
		stylesTo              : null         // A CSS object
    };

    // If 'options.keyframe' but miss a value... Default keyframes animation properties "boxFxAnim1320799702670 1500ms linear 0 infinite alternate"
    $.boxFxOptions.defaultKeyframes = [{     // The 7 arguments below must be sets
        name                  : null,        // auto-generated
        duration              : '3000ms',
        timingFunction        : 'ease',
        delay                 : 0,
        iterationCount        : 'infinite',
        direction             : 'alternate',
        fillMode              : 'both',
        steps                 : []           // Default 'from'/'to' steps [{step: '0%'}, {step:'100%'}]
    }];

    ///////////////////////////////////////////////////////////////////////////////
    // $.boxFx() jQuery plugin - Each time you read... YOU CAN ENHANCE ^^
    ///////////////////////////////////////////////////////////////////////////////

    $.fn.boxFx = function(options) {
        if (_db_)  db('$.fn.boxFx(options)', options); // Debug with console.log

        // Deep merge options with defaut (ex. options.styles.width)
        options = $.extend(true, {}, $.boxFxOptions, options); // jQuery.extend([deep], target, object1 [, objectN])

        return this.each(function() {

            var $canvas     = $(this),       // This is the BOX element for witch the plugin apply
                FX          = {},            // boxFx properties
                S           = {};            // Seeds properties
            
            var initFx = function() {        // Internals boxFX properties
                FX                    = {};
                S                     = {};
                FX.render             = true; // Continuous requestAnimation ?
                FX.timer              = null; // setInterval ?
                FX.id                 = $.getUniqueName('boxFx'); // boxFx element unique ID
                FX.currentData        = 0;
                FX.targets            = null;
                FX.transitionDuration = 0;
                FX.keyframesDuration  = 0;
                window[FX.id]         = [];   // Global unique nameSpace to stock all seeds $element
            };
            initFx();
            
            ///////////////////////////////////////////////////////////////////////////////
            // boxFx jQuery plugin externals methods
            var publicMethods = {
                start:function() {
                    if (_db_)  db('$.boxFx.trigger.start()');
                    setTimeout(function() {  // Be sure all dom manip is over...
                        privateMethods.configSetupFix();
                        FX.render = true;
                        publicMethods.newSeed();
                    }, 0);
                },
                // Call it to emit one seed at a time (must stop it before)
                newSeed:function() {
                    if (_db_) db('$.boxFx.trigger.newSeed()');
                    addSeed();               // Call factory
                },
                stop:function() {
                    if (_db_) db('$.boxFx.trigger.stop()');
                    FX.render = false;        // if requestAnimFrame
                    if (FX.timer) clearTimeout(FX.timer); // if setTimeout Kill factory
                    FX.timer = null;
                },
                // Stop & clear elements stack
                reset:function() {
                    if (_db_) db('$.boxFx.trigger.reset()'); 
                    publicMethods.stop();
                    var i = window[FX.id].length;
                    while(i--) {
                        if (window[FX.id][i] && window[FX.id][i].length > 0)
                            window[FX.id][i].empty().remove(); // Clean DOM
                        delete window[FX.id][i]; // Clean Obj
                    }
                    delete window[FX.id];
                    initFx();
                },
                // Update somes values in the current options
                update:function(event, newOptions) { // $boxFx1.trigger('update', [{prop:val,...}]);
                    if (_db_) db('$.boxFx.trigger.update()', newOptions);
                    if (!newOptions || $.isEmptyObject(newOptions)) return;
                    // Deep merge options with current (ex. options.styles)
                    options = $.extend(true, {}, options, newOptions);
                    privateMethods.configSetupFix();
                },
                // Regenedelay boxFx : update ALL values, remerge with default
                setOptions:function(event, newOptions) { // $boxFx1.trigger('update', [{prop:val,...}]);
                    if (_db_) db('$.boxFx.trigger.setOptions()', newOptions);
                    if (!newOptions || $.isEmptyObject(newOptions)) return;
                    publicMethods.reset(); // If seed HTML is modified, must clear old ones
                    options = $.extend(true, {}, $.boxFxOptions, newOptions);
                    publicMethods.start();
                }
            };

            ///////////////////////////////////////////////////////////////////////////////
            // PRIVATES
            var privateMethods = {
                
                ///////////////////////////////////////////////////////////////////////////////
                // Some "logics" for DEFAULT SETUP and cleanning of the configurable values...
                configSetupFix: function() {
                    if (_db_) db('configSetupFix() start', options);

                    FX.canvasW = parseInt($canvas.width(), 10);
                    FX.canvasH = parseInt($canvas.height(), 10);

                    // Transform keyframes obj to usable CSS animation(s)
                    // All properties are exported in STATIC CSS class, inside <head>
                    if (options.keyframes) {
                        // Execute functions if we've got some dyn properties in keyframes steps styles
                        $.each(options.keyframes, function(k, val) {
                            $.each(val.steps, function(k2, val2) {
                                if (typeof val2 == 'function') // Execute fct
                                    options.keyframes[k].steps[k2] = options.keyframes[k].steps[k2](S.index);
                            });
                        });
                        // Overwrite some minimal default settings
                        options.keyframes = $.extend(true, {}, options.defaultKeyframes, options.keyframes);
                        // Get css "obj" with 'animation' et 'animationFillMode'
                        options.animationsClss = $.buildKeyframeClass(options.keyframes);
                    }
                    
					// Default styles ? if nothing (no style, no class)
                    if (!options.styles && !options.clss)
                        options.styles = $.extend({}, options.defaultStyles); // Some CSS that print something
                    if (options.styles)
                        $.removeObjEmptyValue(options.styles);
					
                    if (options.effect) {
						if (!options.styles)
							options.styles = {};
						if (!options.styles.zIndex && options.styles.zIndex !== 0)
							options.styles.zIndex = options.defaultStyles.zIndex; // 500...
						if (!options.styles.position)
							options.styles.position = 'absolute';
                    }
					
                    
                    // CSS Transition ?
                    if (options.effect && !options.transition)
                        options.transition = {};
                    if (options.transition) {
                         options.transition = $.extend(true, {}, options.defaultTransition, options.transition); // fill undefined transition properties ?
                         //if (!options.transition.properties) // Fail with boxShadow > mozBoxShadow // So default == 'all'
                             //options.transition.properties = Object.keys(options.transition.stylesTo).join(',');
                         // APPLY TRANSITION to ending CSS
                         if (!options.transition.stylesTo) options.transition.stylesTo = {};
                         // Convert options.transition config to true style definition
                         options.transition.stylesTo.transition = options.transition.properties+' '+options.transition.duration+' '+options.transition.timingFunction;
                    }
                    
                    if (options.transition && !options.effect && options.stopAtEnd !== false) // With transition want to stop at the end, with effect or keyframes, forever...
                        options.stopAtEnd = true;
                    else options.stopAtEnd = false;
					
                    //if (options.styles && options.styles2Class)
                        //options.stylesClss = $.buildStyleClass(options.styles);
                    
                    // Fix some time units, and grad a default duratio
                    if (options.transition && options.transition.duration) {
                        FX.transitionDuration = parseInt(options.transition.duration, 10);
                        if (options.transition.duration.substr(-2) != 'ms') // Time with unit : 'ms' | 's'
                            FX.transitionDuration = (FX.transitionDuration * 1000); // convert in ms
                    }
                    if (options.keyframes && options.keyframes[0].duration) {
                        FX.keyframesDuration = parseInt(options.keyframes[0].duration, 10);
                        if (options.keyframes[0].duration.substr(-2) != 'ms')
                            FX.keyframesDuration = (FX.keyframesDuration * 1000);
                    }
                    // Default delay ? take the slowest effect...
                    if (!options.delay && options.delay !== 0)
                        options.delay = (FX.transitionDuration > FX.keyframesDuration ? FX.transitionDuration : FX.keyframesDuration);
                    
                    // MaxSeeds ?
                    if (options.targets) { // Force options.maxSeeds to be the same
                        FX.targets = $(options.targets).hide(); // Cache and hide targets ...
                        options.maxSeeds = FX.targets.length;
                    }
                    else if (!options.maxSeeds && options.data && typeof options.data != 'function' && options.data.length) {
                        options.maxSeeds = options.data.length;
                    }
                    else if (!options.maxSeeds && options.transition) { // TODO check if duration in 's' or 'ms' !!!
                        if (options.delay < 1) options.maxSeeds = parseFloat(options.transition.duration); // hum.......
                        else options.maxSeeds = parseFloat(options.transition.duration) / options.delay;
                    }
                    
                    if (options.maxSeeds < 1) options.maxSeeds = 1; // If user specify nothing... One seed element...
                    else if (options.maxSeeds > 1000) options.maxSeeds = 1000; // Security : do not do DOM bombing ^^

                    // In 'options.styles', sizes can be setted in "px" or "%"
                    // The plugin deal with numbers (int/float). "px" and "%" units are converted and stripped
                    // options.styles.width = '50%' >>> options.styles.width = '250' // 250 (half parent size, in pixels)

                    if (options.styles)
                        $.fixCssUnit(options.styles, FX.canvasW, FX.canvasH);
                    if (options.transition && options.transition.stylesTo) // !!! So.. before applying back CSS, units must be re-appended
                        $.fixCssUnit(options.transition.stylesTo, FX.canvasW, FX.canvasH);

                    // Convert % or px to (int) - working with this values in effects...
                    if (options.emitterRadius)
                        options.emitterRadius      = $.getSize(options.emitterRadius, FX.canvasW);
                    
                    // and emite from the center of the box by default
                    if (!options.emitterCenterLeft && options.emitterCenterLeft !== 0)
                         options.emitterCenterLeft = FX.canvasW / 2;
                    else options.emitterCenterLeft = $.getSize(options.emitterCenterLeft, FX.canvasW);
                    if (!options.emitterCenterTop && options.emitterCenterTop !== 0)
                         options.emitterCenterTop  = FX.canvasH / 2;
                    else options.emitterCenterTop  = $.getSize(options.emitterCenterTop, FX.canvasH);
                    
                    if (_db_) db('configSetupFix() - end', options);
                },
                // Generate default starting CSS obj
                getCssStart: function() { 
                    // if (_db_) db('getCssStart()');
                    
                    if (FX.targets && FX.targets.length > 0) {
                        if (!options.styles.width && options.styles.width !== 0)
                            options.styles.width  = parseInt(FX.targets.eq(S.index || 0).width(), 10);
                        if (!options.styles.height && options.styles.height !== 0)
                            options.styles.height = parseInt(FX.targets.eq(S.index || 0).height(), 10);
                    }
                    
                     if (!options.effect && options.styles) // Seed minimal CSS object, clone a copy of options.styles for further manips
                        return $.extend({}, options.styles);

                    if (!options.styles.width && options.styles.width !== 0) {
                        db('Config. error, need at least options.styles.width to be setted');
                        options.styles.width = options.styles.height = 0;
                    }

                    // Starting CSS for seed, add element inside (default centered) boxFx radius
                    // options.styles interresting properties are already integer values (cf. "$.fixCssUnit()") : no "px" or "%"
                    var css = {};
                    css.width         = (options.styles.maxSize || options.styles.maxSize === 0 ? // Randomize ?
                                         $.getRand(options.styles.width, options.styles.maxSize) :
                                         options.styles.width);
                    css.height        = (options.styles.height || options.styles.height === 0 ?
                                        (options.styles.maxSize || options.styles.maxSize === 0 ?
                                         $.getRand(options.styles.height , options.styles.maxSize) : // Randomize
                                         options.styles.height) : css.width);
                    // Randomize z-index ?
                    css.zIndex        = (options.newAtTop == 'random' ?
                                         $.getRand(options.styles.zIndex, options.styles.zIndex + options.maxSeeds) :
                                        (options.newAtTop ? options.styles.zIndex++ : options.styles.zIndex--) ); // !!! if < 0 ^^
                    
                    // Seed minimal CSS object
                    return $.extend({}, options.styles, { // Processed params merge with config
                        // No anim
                        zIndex      : css.zIndex,
                        // Animatable
                        width       : css.width,
                        height      : css.height // ...
                    });
                },
                getCssEnd: function(cssStart) {
                    // if (_db_) db('getCssEnd()');
                    if (!options.transition || !options.transition.stylesTo) // Seed minimal ending CSS object ?
                        return {};
                    else if (!options.effect)
                        return $.extend({}, options.transition.stylesTo); // clone a copy
                    
                    // If 'options.effect' used....
                    var css = {};
                    css.width  = cssStart.width;  // Keep same sizes by default
                    css.height = cssStart.height;

                    // Effect endind CSS maxWidth for seed
                    if (options.transition.stylesTo.width || options.transition.stylesTo.width === 0) { // Or let the start size
                        css.width         = (options.transition.stylesTo.maxSize || options.transition.stylesTo.maxSize === 0 ?
                                             $.getRand(options.transition.stylesTo.width, options.transition.stylesTo.maxSize) :
                                             options.transition.stylesTo.width);
                        css.height        = css.width;
                    }
                    if (options.transition.stylesTo.height || options.transition.stylesTo.height === 0) { // Or let the start size
                        css.height        = (options.transition.stylesTo.maxSize || options.transition.stylesTo.maxSize === 0 ?
                                             $.getRand(options.transition.stylesTo.height, options.transition.stylesTo.maxSize) :
                                             options.transition.stylesTo.height);
                    }

                    // Seed minimal CSS object
                    return $.extend({}, options.transition.stylesTo, {
                        width        : css.width,
                        height       : css.height
                   });
                },
                // Apply CSS on the element
                applyCssStart: function(name_, index_, cssStart_) {
                    // if (_db_) db('applyCssStart()');
                    if (window[name_][index_].css('display') == 'none')
                        window[name_][index_].css({display:''}); // Previously hidden ?

                    if (options.clss)
                        window[name_][index_].addClass(options.clss); // User custom Class ?
                    
                    if (cssStart_) {
                        $.addCssUnit(cssStart_); // Set back 'px' units /////////////////////////////////// REDOO ???????????????????
                        window[name_][index_].crossCss(cssStart_); // Custom style // Cross-browsers CSS+
                    }
                    
                    if (options.animationsClss) // && !window[name_][index_].hasClass(options.animationsClss))
                        window[name_][index_].crossCss(options.animationsClss); // APPLY generated CSS keyframe anim ?
                },
                // Apply ending CSS (Apply transition at this moment)
                applyCssEnd: function(name_, index_, cssEnd_) {
                    // if (_db_) db('applyCssEnd()');
                    if (!name_ || !name_ in window || !index_ in window[name_]) return; // When killing app, some events can end after (timeout)

                    if (options.clssTo)
                        window[name_][index_].addClass(options.clssTo); //.removeClass(options.clss)

                    if (cssEnd_) {
                        $.addCssUnit(cssEnd_); // Set back 'px'
                        window[name_][index_].crossCss(cssEnd_);
                    }
					
					// if (!options.transition) return; // ???????????????????????????????????????????

                    // Wait the end event of CSS transition : transitionend || webkitTransitionEnd ...
                    window[name_][index_].bind($.transitionEnd, function animationEnd(e) { // // Whom is the end event for transition ?
                        // if (_db_) db($.transitionEnd, e.elapsedTime, name_, index_, options.stopAtEnd);
                      	if (!name_ || !name_ in window || !index_ in window[name_]) return;
                        window[name_][index_].unbind($.transitionEnd); // $(this) is not the element

                        if (!options.stopAtEnd) {// Hide element until re-use ?
                            $.data(window[name_][index_], 'animated', 0); // Release element
                            window[name_][index_].attr('style', 'display:none;'); // Reset all styles (& transition)
                            if (options.clss)           window[name_][index_].removeClass(options.clss);
                            if (options.clssTo)         window[name_][index_].removeClass(options.clssTo);
                            if (options.animationsClss) window[name_][index_].removeClass(options.animationsClss);
                        }
                    });
                }
            };

            ///////////////////////////////////////////////////////////////////////////////
            // Create new element (private main method)
            var addSeed = function() {
                if (!FX.render) return;

                // Did we got a element that is not in use in our Array ?
                S.index = -1;
                for (var i = 0; i < options.maxSeeds; i++) { // Check elements stack
                    if (!window[FX.id][i] || !$.data(window[FX.id][i], 'animated')) {
                        S.index = i;         // Find an empty place
                        break;
                    }
                }
                
                if (_db_ && options.maxSeeds < 10) db('addSeed() - S.index', S.index); // ! Flood ? ;)

                if (S.index >= 0) {          // Create or manage a seed

                    ///////////////////////////////////////////////////////////////////////////////
                    // SPRITE CORE

                    // Need to CREATE a new seed element ? // window['boxFx78589996'][0] is a $() element
                    if (!window[FX.id][S.index] || window[FX.id][S.index].length < 1) {
                         if (options.targets) window[FX.id][S.index] = $(options.targets).eq(S.index); // Catch existing DOM element
                         else                 window[FX.id][S.index] = $(options.seeds).appendTo($canvas); // .prependTo($canvas);
                         if (!options.template) { // Cache init each seeds/targets html ? (can also be a template)
                             $.data(window[FX.id][S.index], 'template', window[FX.id][S.index].html());
                             window[FX.id][S.index].html('');
                         }
                    }

                    // In use now !
                    $.data(window[FX.id][S.index], 'animated', 1);

                    // Do we have (generated) content to inject in seed innerHtml ?
                    S.template = (options.template ? options.template : $.data(window[FX.id][S.index], 'template') );
                    if (S.template) {
                        if (typeof options.data == 'function') {
                            // Call callback 'options.data' with current index (index is not ordened)
                            // Ex. : http://jsfiddle.net/molokoloco/Ebc27/ and in ./js/jquery.boxFx.presets.js
                            var self = {seed:window[FX.id][S.index], template:S.template};
                            $.when(options.data(self)).done(function updateElement(_self, data) { // Call and wait deferred
                                _self.seed.html($.getTpl(_self.template, data));
                            });
                        }
                        else {
                            if (options.data && options.data.length) { // 'string' is also an object ! (feature ;)
                                S.data = options.data[FX.currentData];
                                if (FX.currentData < (options.data.length - 1)) FX.currentData++; // Iterate data in a loop
                                else FX.currentData = 0;
                            }
                            // Update innerHTML
                            S.template = (S.data ? $.getTpl(S.template, S.data) : S.template); // Inject some content ?
                            window[FX.id][S.index].html(S.template); 
                        }
                    }

                    // SPRITE CSS ///////////////////////////////////////////////////////////////////////
                    // Generate S.cssStart & S.cssEnd CSS obj with default properties
                    // CSS properties relative to size ("px" / "%") are converted to int : Cf. "$.fixCssUnit()"
                    S.cssStart = privateMethods.getCssStart();
                    S.cssEnd   = privateMethods.getCssEnd(S.cssStart);
                    
                    // Execute functions if we've got some dyn properties "per/each/element" in styles
                    if (options.styles) {
                        // Ex. : options.styles.transform = function(index) { return 'rotate('+(20 - (Math.random()*40))+'deg)'; }
                        $.each(options.styles, function(k, val) {
                            if (val && typeof val == 'function')
                                S.cssStart[k] = options.styles[k](S.index);
                        });
                    }
                    if (options.transition && options.transition.stylesTo) {      
                        $.each(options.transition.stylesTo, function(k, val) {
                            if (val && typeof val == 'function')
                                S.cssEnd[k] = options.transition.stylesTo[k](S.index);
                        });
                    }
                    
                    // SPRITE EFFECTS (CSS OVERWRITE) ////////////////////////////////////////////////////
                    // Animate seeds in the pseudo canvas, with the help of CSS transition
                    // Seeds are created within boxFx center radius and 'options.effect' CAN dispatch them - override default CSS

                    switch(options.effect) {
                         case 'center':      // Keep centered, with random elements size, center is not the same for all
                            // For start 
                            S.cssStart.left         = options.emitterCenterLeft;
                            S.cssStart.top          = options.emitterCenterTop;
                            S.cssStart.marginLeft   = (-(S.cssStart.width / 2) + $.getRand(-options.emitterRadius, options.emitterRadius));
                            S.cssStart.marginTop    = (-(S.cssStart.height / 2) + $.getRand(-options.emitterRadius, options.emitterRadius));
                            // For end
                            S.cssEnd.marginLeft     = -S.cssEnd.width / 2;
                            S.cssEnd.marginTop      = -S.cssEnd.height / 2;
                        break;
                        case 'artifice':     // Seeds end Inside the border of the box container
                                             // Seeds are placed with left top on the boxFx and centered / moved with margins
                            S.cssStart.left         = options.emitterCenterLeft;
                            S.cssStart.top          = options.emitterCenterTop;
                            S.cssStart.marginLeft   = (-(parseInt(S.cssStart.width, 10) / 2) + $.getRand(-options.emitterRadius, options.emitterRadius));
                            S.cssStart.marginTop    = (-(parseInt(S.cssStart.height, 10) / 2) + $.getRand(-options.emitterRadius, options.emitterRadius));

                            S.marginLeftMin         = -options.emitterCenterLeft;
                            S.marginTopMin          = -options.emitterCenterTop;
                            S.marginLeftMax         = FX.canvasW - options.emitterCenterLeft - parseInt(S.cssEnd.width, 10);
                            S.marginTopMax          = FX.canvasH - options.emitterCenterTop - parseInt(S.cssEnd.height, 10);

                            if (Math.random() > 0.5) {
                                S.cssEnd.marginLeft = $.getRand(S.marginLeftMin, S.marginLeftMax);
                                S.cssEnd.marginTop  = (Math.random() < 0.5 ? S.marginTopMin : S.marginTopMax);
                            }
                            else {
                                S.cssEnd.marginLeft = (Math.random() < 0.5 ? S.marginLeftMin : S.marginLeftMax);
                                S.cssEnd.marginTop  = $.getRand(S.marginTopMin, S.marginTopMax);
                            }
                        break;
                        case 'nebula':       // Seeds end Outside the border of the box container
                                             // Seeds are placed with left top on the boxFx and centered / moved with margins
                            S.cssStart.left         = options.emitterCenterLeft;
                            S.cssStart.top          = options.emitterCenterTop;
                            S.cssStart.marginLeft   = (-(S.cssStart.width / 2) + $.getRand(-options.emitterRadius, options.emitterRadius));
                            S.cssStart.marginTop    = (-(S.cssStart.height / 2) + $.getRand(-options.emitterRadius, options.emitterRadius));

                            S.marginLeftMin         = -options.emitterCenterLeft - S.cssEnd.width;
                            S.marginTopMin          = -options.emitterCenterTop - S.cssEnd.height;
                            S.marginLeftMax         = FX.canvasW - options.emitterCenterLeft;
                            S.marginTopMax          = FX.canvasH - options.emitterCenterTop;
                            if (Math.random() > 0.5) {
                                S.cssEnd.marginLeft = $.getRand(S.marginLeftMin, S.marginLeftMax);
                                S.cssEnd.marginTop  = (Math.random() < 0.5 ? S.marginTopMin : S.marginTopMax);
                            }
                            else {
                                S.cssEnd.marginLeft = (Math.random() < 0.5 ? S.marginLeftMin : S.marginLeftMax);
                                S.cssEnd.marginTop  = $.getRand(S.marginTopMin, S.marginTopMax);
                            }
                        break;
                        
                        // Rotate ? http://jsfiddle.net/molokoloco/EG8m7/
                        
                                             // Do yours !!! plenty of  properties...
                        default:
                                             // If used with position:relative;/display:inline we just let elements push others, without any positions...
                        break;
                    }

                    ///////////////////////////////////////////////////////////////////////////////
                    // SPRITE READY
                    privateMethods.applyCssStart(FX.id, S.index, S.cssStart);
                    // Wait DOM init with Timeout (even 0), move the element to final location
                    // and wait the magical GPU transition from CSS before removing element
                    setTimeout(privateMethods.applyCssEnd, 0, FX.id, S.index, S.cssEnd); // Pass new css + apply trans
                    // If someone outside want to catch our event particule before it move...
                    $canvas.trigger('emit', [window[FX.id][S.index]]); //> $canvas.bind('emit', function(e, $seed) {});
                    
                    // Debug Styles ?
                    // db('FX', FX, 'S', S); db('S.cssStart', S.cssStart, 'S.cssEnd', S.cssEnd); return;

                } // End if

                // Stoping after reaching the end of the seeds stack ?
                if (options.stopAtEnd && S.index == (options.maxSeeds - 1)) {
                    return; // Stop ?
                }
                
                S = {}; // Reset this seed properties

                // And do it again ?
                if (options.delay) FX.timer = setTimeout(addSeed, options.delay);
                else               window.requestAnimFrame(addSeed); // As fast as possible -> Waiting a "maxSpeed" param :-?

            }; // End addSeed

            ///////////////////////////////////////////////////////////////////////////////
            // INIT
            $canvas.bind(publicMethods);     // Map our methods to the element
            $canvas.trigger('start');        // Init factory

            return $canvas;                  // $this

        }); // End each closure

    }; // End plugin

})(jQuery, window);
