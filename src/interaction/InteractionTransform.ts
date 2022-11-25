import OlCollection from 'ol/Collection';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlInteractionPointer from 'ol/interaction/Pointer';
import OlStyleStyle from 'ol/style/Style';
import OlStyleImage from 'ol/style/Image';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleFill from 'ol/style/Fill';
import OlStyleRegularShape from 'ol/style/RegularShape';
import OlFeature from 'ol/Feature';
import OlGeomPoint from 'ol/geom/Point';
// eslint-disable-next-line no-unused-vars
import OlGeometry from 'ol/geom/Geometry';
import OlMap from 'ol/Map';
import OlBaseEvent from 'ol/events/Event';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
// eslint-disable-next-line no-unused-vars
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import { Pixel as OlPixel } from 'ol/pixel';
import { fromExtent } from 'ol/geom/Polygon';
import {
  getCenter,
  boundingExtent
} from 'ol/extent';

/**
 * @typedef {Object} InteractionTransformEventOptions
 * @property {OlFeature} feature
 * @property {OlPixel} [pixel]
 * @property {OlCoordinate} [coordinate]
 * @property {number} [angle]
 * @property {[number, number]} [delta]
 * @property {[number, number]} [scale]
 * @property {OlGeometry} [oldgeom]
 */

/**
 * An interaction transform event
 */
class InteractionTransformEvent extends OlBaseEvent {
  feature;
  pixel;
  coordinate;
  angle;
  delta;
  scale;
  oldgeom;


  /**
   * @param {string} type
   * @param {InteractionTransformEventOptions} options
   */

  constructor(type, options) {
    super(type);
    this.feature = options.feature;
    this.pixel = options.pixel;
    this.coordinate = options.coordinate;
    this.angle = options.angle;
    this.delta = options.delta;
    this.scale = options.scale;
    this.oldgeom = options.oldgeom;
  }
}

/**
 * The transform interaction.
 *
 * The following class is based on the great work done by https://github.com/Viglino
 * at http://viglino.github.io/ol-ext/interaction/transforminteraction.js
 *
 * This is just a port to use it in an es6 module environment.
 *
 * @extends {OlInteractionPointer}
 * @fires select | rotatestart | rotating | rotateend | translatestart | translating | translateend | scalestart | scaling | scaleend
 * @param {Object} options The options to apply.
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
export class OlInteractionTransform extends OlInteractionPointer {
  /**
   * @type {Object.<string, OlStyleStyle[]>}
   */
  style;

  /**
   * @type {OlLayerVector}
   * @private
   */
  overlayLayer_;

  handles_;

  features_;

  feature_;

  layers_;

  isTouch;

  bbox_;

  ispt_;

  center_;

  mode_;

  opt_;

  constraint_;

  ve_info;

  coordinate_;

  pixel_;

  geom_;

  extent_;

  angle_;

  previousCursor_;

  /**
   * Cursors for transform
   */
  Cursors = {
    default: 'auto',
    select: 'pointer',
    translate: 'move',
    rotate: 'move',
    scale: 'ne-resize',
    scale1: 'nw-resize',
    scale2: 'ne-resize',
    scale3: 'nw-resize',
    scalev: 'e-resize',
    scaleh1: 'n-resize',
    scalev2: 'e-resize',
    scaleh3: 'n-resize'
  };

  /**
   * The constructor.
   */
  constructor(options) {
    super();

    if (!options) {
      options = {};
    }

    // Create a new overlay layer for the sketch.
    this.handles_ = new OlCollection();
    this.overlayLayer_ = new OlLayerVector({
      source: new OlSourceVector({
        features: this.handles_,
        useSpatialIndex: false
      }),
      // Return the style according to the handle type.
      style: feature => {
        return this.style[
          (feature.get('handle') || 'default') +
            (feature.get('constraint') || '') +
            (feature.get('option') || '')
        ];
      }
    });

    this.overlayLayer_.set('name', 'Transform overlay');

    /** Collection of feature to transform */
    this.features_ = options.features;

    if (Array.isArray(this.features_)) {
      this.features_.forEach(feat => {
        feat.on('change:geometry', () => {
          this.drawSketch_(false);
        });
      });
    }

    /** List of layers to transform */
    this.layers_ = options.layers
      ? options.layers instanceof Array
        ? options.layers
        : [options.layers]
      : null;

    if (Array.isArray(this.layers_)) {
      this.layers_.forEach(layer => {
        layer.getSource().on('changefeature', () => {
          this.drawSketch_(false);
        });
      });
    }

    // Translate when click on feature
    this.set('translateFeature', options.translateFeature !== false);
    // Can translate the feature
    this.set('translate', options.translate !== false);
    // Can stretch the feature
    this.set('stretch', options.stretch !== false);
    // Can scale the feature
    this.set('scale', options.scale !== false);
    // Can rotate the feature
    this.set('rotate', options.rotate !== false);
    // Keep aspect ratio
    this.set(
      'keepAspectRatio',
      options.keepAspectRatio ||
        function (e) {
          return e.originalEvent.shiftKey;
        }
    );

    // Force redraw when changed.
    this.on('propertychange', () => {
      this.drawSketch_(false);
    });

    // setstyle
    this.setDefaultStyle();
  }

  /**
   * Remove the interaction from its current map, if any,  and attach it to a new
   * map, if any. Pass `null` to just remove the interaction from the current map.
   * @param {OlMap} map Map.
   */
  setMap(map) {
    if (this.getMap()) {
      this.getMap().removeLayer(this.overlayLayer_);
    }

    OlInteractionPointer.prototype.setMap.call(this, map);
    this.overlayLayer_.setMap(map);

    if (map !== null) {
      this.isTouch = /touch/.test(map.getViewport().className);
      this.setDefaultStyle();
    }
  }

  /**
   * Activate/deactivate interaction
   * @param {boolean} b
   */
  setActive(b) {
    if (!this.overlayLayer_) {
      return;
    }
    this.select(null);
    this.overlayLayer_.setVisible(b);
    OlInteractionPointer.prototype.setActive.call(this, b);
  }

  /**
   * Set default sketch style
   */
  setDefaultStyle() {
    // Style
    var stroke = new OlStyleStroke({
      color: 'rgba(255, 0, 0, 1)',
      width: 1
    });
    var strokedash = new OlStyleStroke({
      color: 'rgba(255, 0, 0, 1)',
      width: 1,
      lineDash: [4, 4]
    });
    var fill0 = new OlStyleFill({
      color: 'rgba(255, 0, 0, 0.01)'
    });
    var fill = new OlStyleFill({
      color: 'rgba(255, 255, 255, 0.8)'
    });
    var circle = new OlStyleRegularShape({
      fill: fill,
      stroke: stroke,
      radius: this.isTouch ? 12 : 6,
      points: 15
    });

    circle.getAnchor()[0] = this.isTouch ? -10 : -5;

    var bigpt = new OlStyleRegularShape({
      fill: fill,
      stroke: stroke,
      radius: this.isTouch ? 16 : 8,
      points: 4,
      angle: Math.PI / 4
    });

    var smallpt = new OlStyleRegularShape({
      fill: fill,
      stroke: stroke,
      radius: this.isTouch ? 12 : 6,
      points: 4,
      angle: Math.PI / 4
    });

    /**
     * @param {OlStyleImage} img
     * @param {OlStyleStroke} stroke
     * @param {OlStyleFill} fill
     * @return {OlStyleStyle[]}
     * @ignore
     */
    function createStyle(img, stroke, fill) {
      return [
        new OlStyleStyle({
          image: img,
          stroke: stroke,
          fill: fill
        })
      ];
    }

    // Style for handles.
    this.style = {
      default: createStyle(bigpt, strokedash, fill0),
      translate: createStyle(bigpt, stroke, fill),
      rotate: createStyle(circle, stroke, fill),
      rotate0: createStyle(bigpt, stroke, fill),
      scale: createStyle(bigpt, stroke, fill),
      scale1: createStyle(bigpt, stroke, fill),
      scale2: createStyle(bigpt, stroke, fill),
      scale3: createStyle(bigpt, stroke, fill),
      scalev: createStyle(smallpt, stroke, fill),
      scaleh1: createStyle(smallpt, stroke, fill),
      scalev2: createStyle(smallpt, stroke, fill),
      scaleh3: createStyle(smallpt, stroke, fill)
    };

    this.drawSketch_(false);
  }

  /**
   * Set sketch style.
   * @param {string} style Map.
   * @param {OlStyleStyle[]|OlStyleStyle} olstyle
   */
  setStyle(style, olstyle) {
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
    this.drawSketch_(false);
  }

  /** Get Feature at pixel
   * @param {OlPixel} pixel
   * @return {{
   *   feature?: OlFeature,
   *   handle?: string,
   *   constraint?: *,
   *   option?: *
   * }}
   * @private
   */
  getFeatureAtPixel_(pixel) {
    var self = this;
    var found = {};
    this.getMap().forEachFeatureAtPixel(pixel, function (feature, layer) {
      // Overlay ?
      if (!layer) {
        // eslint-disable-next-line no-underscore-dangle
        if (feature === self.bbox_) {
          return false;
        }
        // eslint-disable-next-line no-underscore-dangle
        self.handles_.forEach(function (f) {
          if (f === feature) {
            found = {
              feature: feature,
              handle: feature.get('handle'),
              constraint: feature.get('constraint'),
              option: feature.get('option')
            };
          }
        });
        if (found) {
          return true;
        }
      }
      // feature belong to a layer
      // eslint-disable-next-line no-underscore-dangle
      if (self.layers_) {
        // eslint-disable-next-line no-underscore-dangle
        for (var i = 0; i < self.layers_.length; i++) {
          // eslint-disable-next-line no-underscore-dangle
          if (self.layers_[i] === layer) {
            found = { feature: feature };
            return true;
          }
        }
        return null;
        // eslint-disable-next-line no-underscore-dangle
      } else if (self.features_) {
        // feature in the collection
        // eslint-disable-next-line no-underscore-dangle
        self.features_.forEach(function (f) {
          if (f === feature) {
            found = {
              feature: feature
            };
          }
        });
        if (found) {
          return true;
        } else {
          return false;
        }
      } else {
        // Others
        found = { feature: feature };
        return true;
      }
    });
    return found;
  }

  /**
   * Draws the transform sketch.
   *
   * @param {boolean} center only the center
   */
  drawSketch_(center) {
    this.overlayLayer_.getSource().clear();

    if (!this.feature_) {
      return;
    }

    var ext;
    var geom;
    var f;

    if (center === true) {
      if (!this.ispt_) {
        this.overlayLayer_.getSource().addFeature(
          new OlFeature({
            geometry: new OlGeomPoint(this.center_),
            handle: 'rotate0'
          })
        );
        ext = this.feature_.getGeometry().getExtent();
        geom = fromExtent(ext);
        f = this.bbox_ = new OlFeature(geom);
        this.overlayLayer_.getSource().addFeature(f);
      }
    } else {
      ext = this.feature_.getGeometry().getExtent();
      if (this.ispt_) {
        var p = this.getMap().getPixelFromCoordinate([ext[0], ext[1]]);
        ext = boundingExtent([
          this.getMap().getCoordinateFromPixel([p[0] - 10, p[1] - 10]),
          this.getMap().getCoordinateFromPixel([p[0] + 10, p[1] + 10])
        ]);
      }
      geom = fromExtent(ext);
      f = this.bbox_ = new OlFeature(geom);
      var features = [];
      var g = geom.getCoordinates()[0];

      if (!this.ispt_) {
        features.push(f);

        // Middle
        if (this.get('stretch') && this.get('scale'))
          for (var i = 0; i < g.length - 1; i++) {
            f = new OlFeature({
              geometry: new OlGeomPoint([
                (g[i][0] + g[i + 1][0]) / 2,
                (g[i][1] + g[i + 1][1]) / 2
              ]),
              handle: 'scale',
              constraint: i % 2 ? 'h' : 'v',
              option: i
            });
            features.push(f);
          }

        // Handles
        if (this.get('scale'))
          for (var j = 0; j < g.length - 1; j++) {
            f = new OlFeature({
              geometry: new OlGeomPoint(g[j]),
              handle: 'scale',
              option: j
            });
            features.push(f);
          }

        // Center
        if (this.get('translate') && !this.get('translateFeature')) {
          f = new OlFeature({
            geometry: new OlGeomPoint([
              (g[0][0] + g[2][0]) / 2,
              (g[0][1] + g[2][1]) / 2
            ]),
            handle: 'translate'
          });
          features.push(f);
        }
      }

      // Rotate
      if (this.get('rotate')) {
        f = new OlFeature({
          geometry: new OlGeomPoint(g[3]),
          handle: 'rotate'
        });
        features.push(f);
      }

      // Add sketch
      this.overlayLayer_.getSource().addFeatures(features);
    }
  }

  /**
   * Selects a feature to transform.
   *
   * @param {OlFeature} feature The feature to transform.
   */
  select(feature) {
    this.feature_ = feature;
    this.ispt_ = this.feature_
      ? this.feature_.getGeometry().getType() == 'Point'
      : false;
    this.drawSketch_(false);
    this.dispatchEvent(
      new InteractionTransformEvent('select', {
        feature: this.feature_
      })
    );
  }

  /**
   * @param {OlMapBrowserEvent} evt Map browser event.
   * @return {boolean} `true` to start the drag sequence.
   */
  handleDownEvent(evt) {
    var sel: any = this.getFeatureAtPixel_(evt.pixel);
    var feature = sel.feature;

    if (
      this.feature_ &&
      this.feature_ == feature &&
      ((this.ispt_ && this.get('translate')) || this.get('translateFeature'))
    ) {
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
      this.extent_ = fromExtent(this.geom_.getExtent()).getCoordinates()[0];
      this.center_ = getCenter(this.geom_.getExtent());
      this.angle_ = Math.atan2(
        this.center_[1] - evt.coordinate[1],
        this.center_[0] - evt.coordinate[0]
      );

      this.dispatchEvent(
        new InteractionTransformEvent(this.mode_ + 'start', {
          feature: this.feature_,
          pixel: evt.pixel,
          coordinate: evt.coordinate
        })
      );

      return true;
    } else {
      this.feature_ = feature;
      this.ispt_ = this.feature_
        ? this.feature_.getGeometry().getType() == 'Point'
        : false;
      this.drawSketch_(false);
      this.dispatchEvent(
        new InteractionTransformEvent('select', {
          feature: this.feature_,
          pixel: evt.pixel,
          coordinate: evt.coordinate
        })
      );
      return false;
    }
  }

  /**
   * @param {OlMapBrowserEvent} evt Map browser event.
   */
  handleDragEvent(evt) {
    var geometry;

    switch (this.mode_) {
      case 'rotate': {
        var a = Math.atan2(
          this.center_[1] - evt.coordinate[1],
          this.center_[0] - evt.coordinate[0]
        );
        if (!this.ispt_) {
          geometry = this.geom_.clone();
          geometry.rotate(a - this.angle_, this.center_);

          this.feature_.setGeometry(geometry);
        }
        this.drawSketch_(true);
        this.dispatchEvent(
          new InteractionTransformEvent('rotating', {
            feature: this.feature_,
            angle: a - this.angle_,
            pixel: evt.pixel,
            coordinate: evt.coordinate
          })
        );
        break;
      }
      case 'translate': {
        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        this.feature_.getGeometry().translate(deltaX, deltaY);
        this.handles_.forEach(function (f) {
          f.getGeometry().translate(deltaX, deltaY);
        });

        this.coordinate_ = evt.coordinate;
        this.dispatchEvent(
          new InteractionTransformEvent('translating', {
            feature: this.feature_,
            delta: [deltaX, deltaY],
            pixel: evt.pixel,
            coordinate: evt.coordinate
          })
        );
        break;
      }
      case 'scale': {
        var center = this.center_;
        var mouseEvent = /** @type {MouseEvent} */ evt.originalEvent;
        if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
          center = this.extent_[(Number(this.opt_) + 2) % 4];
        }

        var scx =
          (evt.coordinate[0] - center[0]) / (this.coordinate_[0] - center[0]);
        var scy =
          (evt.coordinate[1] - center[1]) / (this.coordinate_[1] - center[1]);

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
        this.drawSketch_(false);
        this.dispatchEvent(
          new InteractionTransformEvent('scaling', {
            feature: this.feature_,
            scale: [scx, scy],
            pixel: evt.pixel,
            coordinate: evt.coordinate
          })
        );
        break;
      }
      default:
        break;
    }
  }

  /**
   * @param {OlMapBrowserEvent} evt Event.
   */
  handleMoveEvent(evt) {
    if (!this.mode_) {
      var sel: any = this.getFeatureAtPixel_(evt.pixel);
      var element = evt.map.getTargetElement();
      if (sel.feature) {
        var c = sel.handle
          ? this.Cursors[
              (sel.handle || 'default') +
                (sel.constraint || '') +
                (sel.option || '')
            ]
          : this.Cursors.select;

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
  }

  /**
   * @return {boolean} `false` to stop the drag sequence.
   */
  handleUpEvent() {
    this.dispatchEvent(
      new InteractionTransformEvent(this.mode_ + 'end', {
        feature: this.feature_,
        oldgeom: this.geom_
      })
    );

    this.drawSketch_(false);
    this.mode_ = null;
    return false;
  }
}

export default OlInteractionTransform;
