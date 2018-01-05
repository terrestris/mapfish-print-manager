'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OlInteractionTransform = undefined;

var _collection = require('ol/collection');

var _collection2 = _interopRequireDefault(_collection);

var _vector = require('ol/layer/vector');

var _vector2 = _interopRequireDefault(_vector);

var _vector3 = require('ol/source/vector');

var _vector4 = _interopRequireDefault(_vector3);

var _pointer = require('ol/interaction/pointer');

var _pointer2 = _interopRequireDefault(_pointer);

var _style = require('ol/style/style');

var _style2 = _interopRequireDefault(_style);

var _stroke = require('ol/style/stroke');

var _stroke2 = _interopRequireDefault(_stroke);

var _fill = require('ol/style/fill');

var _fill2 = _interopRequireDefault(_fill);

var _regularshape = require('ol/style/regularshape');

var _regularshape2 = _interopRequireDefault(_regularshape);

var _feature = require('ol/feature');

var _feature2 = _interopRequireDefault(_feature);

var _point = require('ol/geom/point');

var _point2 = _interopRequireDefault(_point);

var _polygon = require('ol/geom/polygon');

var _polygon2 = _interopRequireDefault(_polygon);

var _extent = require('ol/extent');

var _extent2 = _interopRequireDefault(_extent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The transform interaction.
 *
 * The following class is based on the great work done by https://github.com/Viglino
 * at http://viglino.github.io/ol-ext/interaction/transforminteraction.js
 *
 * This is just a port to use it in an es6 module environment.
 *
 * @extends {ol.interaction.Pointer}
 * @fires select | rotatestart | rotating | rotateend | translatestart | translating | translateend | scalestart | scaling | scaleend
 * @param {olx.interaction.TransformOptions}
 *  - layers {Array<ol.Layer>} array of layers to transform,
 *  - features {ol.Collection<ol.Feature>} collection of feature to transform,
 *  - translateFeature {bool} Translate when click on feature
 *  - translate {bool} Can translate the feature
 *  - stretch {bool} can stretch the feature
 *  - scale {bool} can scale the feature
 *  - rotate {bool} can rotate the feature
 *  - keepAspectRatio { ol.events.ConditionType | undefined } A function that takes an ol.MapBrowserEvent and returns a boolean to keep aspect ratio, default ol.events.condition.shiftKeyOnly.
 *  - style {} list of ol.style for handles
 */
var OlInteractionTransform = exports.OlInteractionTransform = function (_OlInteractionPointer) {
  _inherits(OlInteractionTransform, _OlInteractionPointer);

  /**
   * The constructor.
   *
   * @param {Object} options The options to apply.
   */
  function OlInteractionTransform(options) {
    _classCallCheck(this, OlInteractionTransform);

    if (!options) {
      options = {};
    }

    // Create a new overlay layer for the sketch.
    var _this = _possibleConstructorReturn(this, (OlInteractionTransform.__proto__ || Object.getPrototypeOf(OlInteractionTransform)).call(this));

    _this.Cursors = {
      'default': 'auto',
      'select': 'pointer',
      'translate': 'move',
      'rotate': 'move',
      'scale': 'ne-resize',
      'scale1': 'nw-resize',
      'scale2': 'ne-resize',
      'scale3': 'nw-resize',
      'scalev': 'e-resize',
      'scaleh1': 'n-resize',
      'scalev2': 'e-resize',
      'scaleh3': 'n-resize'
    };

    _this.setMap = function (map) {
      if (this.getMap()) {
        this.getMap().removeLayer(this.overlayLayer_);
      }

      _pointer2.default.prototype.setMap.call(this, map);
      this.overlayLayer_.setMap(map);

      if (map !== null) {
        this.isTouch = /touch/.test(map.getViewport().className);
        this.setDefaultStyle();
      }
    };

    _this.setActive = function (b) {
      this.select(null);
      this.overlayLayer_.setVisible(b);
      _pointer2.default.prototype.setActive.call(this, b);
    };

    _this.setDefaultStyle = function () {
      // Style
      var stroke = new _stroke2.default({
        color: 'rgba(255, 0, 0, 1)',
        width: 1
      });
      var strokedash = new _stroke2.default({
        color: 'rgba(255, 0, 0, 1)',
        width: 1,
        lineDash: [4, 4]
      });
      var fill0 = new _fill2.default({
        color: 'rgba(255, 0, 0, 0.01)'
      });
      var fill = new _fill2.default({
        color: 'rgba(255, 255, 255, 0.8)'
      });
      var circle = new _regularshape2.default({
        fill: fill,
        stroke: stroke,
        radius: this.isTouch ? 12 : 6,
        points: 15
      });

      circle.getAnchor()[0] = this.isTouch ? -10 : -5;

      var bigpt = new _regularshape2.default({
        fill: fill,
        stroke: stroke,
        radius: this.isTouch ? 16 : 8,
        points: 4,
        angle: Math.PI / 4
      });

      var smallpt = new _regularshape2.default({
        fill: fill,
        stroke: stroke,
        radius: this.isTouch ? 12 : 6,
        points: 4,
        angle: Math.PI / 4
      });

      /**
       * [createStyle description]
       * @method createStyle
       * @param  {[type]}    img    [description]
       * @param  {[type]}    stroke [description]
       * @param  {[type]}    fill   [description]
       * @return {[type]}           [description]
       */
      function createStyle(img, stroke, fill) {
        return [new _style2.default({
          image: img,
          stroke: stroke,
          fill: fill
        })];
      }

      /** Style for handles */
      this.style = {
        'default': createStyle(bigpt, strokedash, fill0),
        'translate': createStyle(bigpt, stroke, fill),
        'rotate': createStyle(circle, stroke, fill),
        'rotate0': createStyle(bigpt, stroke, fill),
        'scale': createStyle(bigpt, stroke, fill),
        'scale1': createStyle(bigpt, stroke, fill),
        'scale2': createStyle(bigpt, stroke, fill),
        'scale3': createStyle(bigpt, stroke, fill),
        'scalev': createStyle(smallpt, stroke, fill),
        'scaleh1': createStyle(smallpt, stroke, fill),
        'scalev2': createStyle(smallpt, stroke, fill),
        'scaleh3': createStyle(smallpt, stroke, fill)
      };

      this.drawSketch_();
    };

    _this.setStyle = function (style, olstyle) {
      if (!olstyle) {
        return;
      }

      if (olstyle instanceof Array) {
        this.style[style] = olstyle;
      } else {
        this.style[style] = [olstyle];
      }

      for (var i = 0; i < this.style[style].length; i++) {
        var im = this.style[style][i].getImage();
        if (im) {
          if (style == 'rotate') {
            im.getAnchor()[0] = -5;
          }
          if (this.isTouch) {
            im.setScale(1.8);
          }
        }
        var tx = this.style[style][i].getText();
        if (tx) {
          if (style == 'rotate') {
            tx.setOffsetX(this.isTouch ? 14 : 7);
          }
          if (this.isTouch) {
            tx.setScale(1.8);
          }
        }
      }
      this.drawSketch_();
    };

    _this.getFeatureAtPixel_ = function (pixel) {
      var self = this;
      return this.getMap().forEachFeatureAtPixel(pixel, function (feature, layer) {
        var found = false;
        // Overlay ?
        if (!layer) {
          if (feature === self.bbox_) {
            return false;
          }
          self.handles_.forEach(function (f) {
            if (f === feature) {
              found = true;
            }
          });
          if (found) {
            return {
              feature: feature,
              handle: feature.get('handle'),
              constraint: feature.get('constraint'),
              option: feature.get('option')
            };
          }
        }
        // feature belong to a layer
        if (self.layers_) {
          for (var i = 0; i < self.layers_.length; i++) {
            if (self.layers_[i] === layer) {
              return { feature: feature };
            }
          }
          return null;
        } else if (self.features_) {
          // feature in the collection
          self.features_.forEach(function (f) {
            if (f === feature) {
              found = true;
            }
          });
          if (found) {
            return {
              feature: feature
            };
          } else {
            return null;
          }
        } else {
          // Others
          return { feature: feature };
        }
      }) || {};
    };

    _this.drawSketch_ = function (center) {
      this.overlayLayer_.getSource().clear();

      if (!this.feature_) {
        return;
      }

      var ext;
      var geom;
      var f;

      if (center === true) {
        if (!this.ispt_) {
          this.overlayLayer_.getSource().addFeature(new _feature2.default({
            geometry: new _point2.default(this.center_),
            handle: 'rotate0'
          }));
          ext = this.feature_.getGeometry().getExtent();
          geom = _polygon2.default.fromExtent(ext);
          f = this.bbox_ = new _feature2.default(geom);
          this.overlayLayer_.getSource().addFeature(f);
        }
      } else {
        ext = this.feature_.getGeometry().getExtent();
        if (this.ispt_) {
          var p = this.getMap().getPixelFromCoordinate([ext[0], ext[1]]);
          ext = _extent2.default.boundingExtent([this.getMap().getCoordinateFromPixel([p[0] - 10, p[1] - 10]), this.getMap().getCoordinateFromPixel([p[0] + 10, p[1] + 10])]);
        }
        geom = _polygon2.default.fromExtent(ext);
        f = this.bbox_ = new _feature2.default(geom);
        var features = [];
        var g = geom.getCoordinates()[0];

        if (!this.ispt_) {
          features.push(f);

          // Middle
          if (this.get('stretch') && this.get('scale')) for (var i = 0; i < g.length - 1; i++) {
            f = new _feature2.default({
              geometry: new _point2.default([(g[i][0] + g[i + 1][0]) / 2, (g[i][1] + g[i + 1][1]) / 2]),
              handle: 'scale',
              constraint: i % 2 ? 'h' : 'v',
              option: i
            });
            features.push(f);
          }

          // Handles
          if (this.get('scale')) for (var j = 0; j < g.length - 1; j++) {
            f = new _feature2.default({
              geometry: new _point2.default(g[j]),
              handle: 'scale',
              option: j
            });
            features.push(f);
          }

          // Center
          if (this.get('translate') && !this.get('translateFeature')) {
            f = new _feature2.default({
              geometry: new _point2.default([(g[0][0] + g[2][0]) / 2, (g[0][1] + g[2][1]) / 2]),
              handle: 'translate'
            });
            features.push(f);
          }
        }

        // Rotate
        if (this.get('rotate')) {
          f = new _feature2.default({
            geometry: new _point2.default(g[3]),
            handle: 'rotate'
          });
          features.push(f);
        }

        // Add sketch
        this.overlayLayer_.getSource().addFeatures(features);
      }
    };

    _this.select = function (feature) {
      this.feature_ = feature;
      this.ispt_ = this.feature_ ? this.feature_.getGeometry().getType() == 'Point' : false;
      this.drawSketch_();
      this.dispatchEvent({
        type: 'select',
        feature: this.feature_
      });
    };

    _this.handleDownEvent_ = function (evt) {
      var sel = this.getFeatureAtPixel_(evt.pixel);
      var feature = sel.feature;

      if (this.feature_ && this.feature_ == feature && (this.ispt_ && this.get('translate') || this.get('translateFeature'))) {
        sel.handle = 'translate';
      }

      if (sel.handle) {
        this.mode_ = sel.handle;
        this.opt_ = sel.option;
        this.constraint_ = sel.constraint;
        // Save info
        this.coordinate_ = evt.coordinate;
        this.pixel_ = evt.pixel;
        this.geom_ = this.feature_.getGeometry().clone();
        this.extent_ = _polygon2.default.fromExtent(this.geom_.getExtent()).getCoordinates()[0];
        this.center_ = _extent2.default.getCenter(this.geom_.getExtent());
        this.angle_ = Math.atan2(this.center_[1] - evt.coordinate[1], this.center_[0] - evt.coordinate[0]);

        this.dispatchEvent({
          type: this.mode_ + 'start',
          feature: this.feature_,
          pixel: evt.pixel,
          coordinate: evt.coordinate
        });

        return true;
      } else {
        this.feature_ = feature;
        this.ispt_ = this.feature_ ? this.feature_.getGeometry().getType() == 'Point' : false;
        this.drawSketch_();
        this.dispatchEvent({
          type: 'select',
          feature: this.feature_,
          pixel: evt.pixel,
          coordinate: evt.coordinate
        });
        return false;
      }
    };

    _this.handleDragEvent_ = function (evt) {
      var geometry;

      switch (this.mode_) {
        case 'rotate':
          {
            var a = Math.atan2(this.center_[1] - evt.coordinate[1], this.center_[0] - evt.coordinate[0]);
            if (!this.ispt) {
              geometry = this.geom_.clone();
              geometry.rotate(a - this.angle_, this.center_);

              this.feature_.setGeometry(geometry);
            }
            this.drawSketch_(true);
            this.dispatchEvent({
              type: 'rotating',
              feature: this.feature_,
              angle: a - this.angle_,
              pixel: evt.pixel,
              coordinate: evt.coordinate
            });
            break;
          }
        case 'translate':
          {
            var deltaX = evt.coordinate[0] - this.coordinate_[0];
            var deltaY = evt.coordinate[1] - this.coordinate_[1];

            this.feature_.getGeometry().translate(deltaX, deltaY);
            this.handles_.forEach(function (f) {
              f.getGeometry().translate(deltaX, deltaY);
            });

            this.coordinate_ = evt.coordinate;
            this.dispatchEvent({
              type: 'translating',
              feature: this.feature_,
              delta: [deltaX, deltaY],
              pixel: evt.pixel,
              coordinate: evt.coordinate
            });
            break;
          }
        case 'scale':
          {
            var center = this.center_;
            if (evt.originalEvent.metaKey || evt.originalEvent.ctrlKey) {
              center = this.extent_[(Number(this.opt_) + 2) % 4];
            }

            var scx = (evt.coordinate[0] - center[0]) / (this.coordinate_[0] - center[0]);
            var scy = (evt.coordinate[1] - center[1]) / (this.coordinate_[1] - center[1]);

            if (this.constraint_) {
              if (this.constraint_ == 'h') {
                scx = 1;
              } else {
                scy = 1;
              }
            } else {
              var keepAspectRatio = this.get('keepAspectRatio');
              if (keepAspectRatio || keepAspectRatio(evt)) {
                scx = scy = Math.min(scx, scy);
              }
            }

            geometry = this.geom_.clone();
            geometry.applyTransform(function (g1, g2, dim) {
              if (dim < 2) {
                return g2;
              }

              for (var i = 0; i < g1.length; i += dim) {
                if (scx != 1) {
                  g2[i] = center[0] + (g1[i] - center[0]) * scx;
                }
                if (scy != 1) {
                  g2[i + 1] = center[1] + (g1[i + 1] - center[1]) * scy;
                }
              }
              return g2;
            });
            this.feature_.setGeometry(geometry);
            this.drawSketch_();
            this.dispatchEvent({
              type: 'scaling',
              feature: this.feature_,
              scale: [scx, scy],
              pixel: evt.pixel,
              coordinate: evt.coordinate
            });
            break;
          }
        default:
          break;
      }
    };

    _this.handleMoveEvent_ = function (evt) {
      if (!this.mode_) {
        var sel = this.getFeatureAtPixel_(evt.pixel);
        var element = evt.map.getTargetElement();
        if (sel.feature) {
          var c = sel.handle ? this.Cursors[(sel.handle || 'default') + (sel.constraint || '') + (sel.option || '')] : this.Cursors.select;

          if (this.previousCursor_ === undefined) {
            this.previousCursor_ = element.style.cursor;
          }
          element.style.cursor = c;
        } else {
          if (this.previousCursor_ !== undefined) {
            element.style.cursor = this.previousCursor_;
          }
          this.previousCursor_ = undefined;
        }
      }
    };

    _this.handleUpEvent_ = function () {
      this.dispatchEvent({
        type: this.mode_ + 'end',
        feature: this.feature_,
        oldgeom: this.geom_
      });

      this.drawSketch_();
      this.mode_ = null;
      return false;
    };

    _this.handles_ = new _collection2.default();
    _this.overlayLayer_ = new _vector2.default({
      source: new _vector4.default({
        features: _this.handles_,
        useSpatialIndex: false
      }),
      name: 'Transform overlay',
      // Return the style according to the handle type.
      style: function style(feature) {
        return _this.style[(feature.get('handle') || 'default') + (feature.get('constraint') || '') + (feature.get('option') || '')];
      }
    });

    /** Collection of feature to transform */
    _this.features_ = options.features;

    if (Array.isArray(_this.features_)) {
      _this.features_.forEach(function (feat) {
        feat.on('change:geometry', function () {
          _this.drawSketch_();
        });
      });
    }

    /** List of layers to transform */
    _this.layers_ = options.layers ? options.layers instanceof Array ? options.layers : [options.layers] : null;

    if (Array.isArray(_this.layers_)) {
      _this.layers_.forEach(function (layer) {
        layer.getSource().on('changefeature', function () {
          _this.drawSketch_();
        });
      });
    }

    /** Translate when click on feature */
    _this.set('translateFeature', options.translateFeature !== false);
    /** Can translate the feature */
    _this.set('translate', options.translate !== false);
    /** Can stretch the feature */
    _this.set('stretch', options.stretch !== false);
    /** Can scale the feature */
    _this.set('scale', options.scale !== false);
    /** Can rotate the feature */
    _this.set('rotate', options.rotate !== false);
    /** Keep aspect ratio */
    _this.set('keepAspectRatio', options.keepAspectRatio || function (e) {
      return e.originalEvent.shiftKey;
    });

    // Force redraw when changed.
    _this.on('propertychange', function () {
      _this.drawSketch_();
    });

    // setstyle
    _this.setDefaultStyle();
    return _this;
  }

  /**
   * Cursors for transform
   */


  /**
   * Remove the interaction from its current map, if any,  and attach it to a new
   * map, if any. Pass `null` to just remove the interaction from the current map.
   * @param {ol.Map} map Map.
   * @api stable
   */


  /**
   * Activate/deactivate interaction
   * @param {bool}
   * @api stable
   */


  /**
   * Set default sketch style
   */


  /**
   * Set sketch style.
   * @param {ol.Map} map Map.
   * @api stable
   */


  /** Get Feature at pixel
   * @param {ol.Pixel}
   * @return {ol.feature}
   * @private
   */


  /**
   * Draws the transform sketch.
   *
   * @param {boolean} draw only the center
   */


  /**
   * Selects a feature to transform.
   *
   * @param {ol.Feature} feature The feature to transform.
   */


  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   * @return {boolean} `true` to start the drag sequence.
   */


  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   */


  /**
   * @param {ol.MapBrowserEvent} evt Event.
   */


  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   * @return {boolean} `false` to stop the drag sequence.
   */


  return OlInteractionTransform;
}(_pointer2.default);

exports.default = OlInteractionTransform;