import Control from 'ol/control/Control';
import Observable from 'ol/Observable';

var CSS_PREFIX = 'layer-legend-';

/**
 * OpenLayers Layer Switcher Control.
 * See [the examples](./examples) for usage.
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} opt_options Control options, extends olx.control.ControlOptions adding:  
 * **`tipLabel`** `String` - the button tooltip.
 */
export default class LayerLegend extends Control {

    constructor(opt_options) {

        var options = opt_options || {};

        var tipLabel = options.tipLabel ?
            options.tipLabel : 'Legend';

        var element = document.createElement('div');

        super({element: element, target: options.target});

        this.mapListeners = [];

        this.hiddenClassName = 'ol-unselectable ol-control layer-switcher';
        if (LayerLegend.isTouchDevice_()) {
            this.hiddenClassName += ' touch';
        }
        this.shownClassName = 'shown';
        this.legendUrl = options.url;
        element.className = this.hiddenClassName;

        var button = document.createElement('button');
        button.setAttribute('title', tipLabel);
        element.appendChild(button);

        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        element.appendChild(this.panel);
        LayerLegend.enableTouchScroll_(this.panel);
        var this_ = this;

        button.onmouseover = (e)=> {
            this.showPanel();
        };

        button.onclick = (e)=> {
            e = e || window.event;
            this.showPanel();
            e.preventDefault();
        };

        this_.panel.onmouseout =(e)=> {
            e = e || window.event;
            if (!this.panel.contains(e.toElement || e.relatedTarget)) {
                this.hidePanel();
            }
        };

    }

    /**
    * Set the map instance the control is associated with.
    * @param {ol.Map} map The map instance.
    */
    setMap(map) {
        // Clean up listeners associated with the previous map
        for (var i = 0, key; i < this.mapListeners.length; i++) {
            Observable.unByKey(this.mapListeners[i]);
        }
        this.mapListeners.length = 0;
        // Wire up listeners etc. and store reference to new map
        super.setMap(map);
        if (map) {
            var this_ = this;
            this.mapListeners.push(map.on('pointerdown', function() {
                this_.hidePanel();
            }));
            this.renderPanel();
        }
    }

    /**
    * Show the layer panel.
    */
    showPanel() {
        if (!this.element.classList.contains(this.shownClassName)) {
            this.element.classList.add(this.shownClassName);
            this.renderPanel();
        }
    }

    /**
    * Hide the layer panel.
    */
    hidePanel() {
        if (this.element.classList.contains(this.shownClassName)) {
            this.element.classList.remove(this.shownClassName);
        }
    }

    /**
    * Re-draw the layer panel to represent the current state of the layers.
    */
    renderPanel() {
        LayerLegend.renderPanel(this.getMap(), this.panel);
    }

    /**
    * **Static** Re-draw the layer panel to represent the current state of the layers.
    * @param {ol.Map} map The OpenLayers Map instance to render layers for
    * @param {Element} panel The DOM Element into which the layer tree will be rendered
    */
    static renderPanel(map, panel) {

        while(panel.firstChild) {
            panel.removeChild(panel.firstChild);
        }

        var dv = document.createElement('div');
        panel.appendChild(dv);
        // passing two map arguments instead of lyr as we're passing the map as the root of the layers tree
        LayerLegend.renderLegend(map, this.legendUrl, dv);

    }
    /**
    * **Static** Render all layers that are children of a group.
    * @private
    * @param {ol.Map} map The map instance.
    * @param {string} url Group layer whos children will be rendered.
    * @param {Element} elm DOM element that children will be appended to.
    */
    static renderLegend(map,url, elm) {
        elm.appendChild(`<img src=${url} />`);
    }

    /**
    * **Static** Call the supplied function for each layer in the passed layer group
    * recursing nested groups.
    * @param {ol.layer.Group} lyr The layer group to start iterating from.
    * @param {Function} fn Callback which will be called for each `ol.layer.Base`
    * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
    */
    static forEachRecursive(lyr, fn) {
        lyr.getLayers().forEach(function(lyr, idx, a) {
            fn(lyr, idx, a);
            if (lyr.getLayers) {
                LayerLegend.forEachRecursive(lyr, fn);
            }
        });
    }

    /**
    * **Static** Generate a UUID  
    * Adapted from http://stackoverflow.com/a/2117523/526860
    * @returns {String} UUID
    */
    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    /**
    * @private
    * @desc Apply workaround to enable scrolling of overflowing content within an
    * element. Adapted from https://gist.github.com/chrismbarr/4107472
    */
    static enableTouchScroll_(elm) {
        if(LayerLegend.isTouchDevice_()){
            var scrollStartPos = 0;
            elm.addEventListener("touchstart", function(event) {
                scrollStartPos = this.scrollTop + event.touches[0].pageY;
            }, false);
            elm.addEventListener("touchmove", function(event) {
                this.scrollTop = scrollStartPos - event.touches[0].pageY;
            }, false);
        }
    }

    /**
    * @private
    * @desc Determine if the current browser supports touch events. Adapted from
    * https://gist.github.com/chrismbarr/4107472
    */
    static isTouchDevice_() {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch(e) {
            return false;
        }
    }

}


// Expose LayerLegend as ol.control.LayerLegend if using a full build of
// OpenLayers
if (window.ol && window.ol.control) {
    window.ol.control.LayerLegend = LayerLegend;
}