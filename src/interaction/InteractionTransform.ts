import OlCollection from 'ol/Collection';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlInteractionPointer, {
  Options as OlInteractionPointerOpts
} from 'ol/interaction/Pointer';
import {
  Coordinate as OlCoordinate
} from 'ol/coordinate';
import OlStyleStyle from 'ol/style/Style';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleFill from 'ol/style/Fill';
import OlStyleImage from 'ol/style/Image';
import OlStyleRegularShape from 'ol/style/RegularShape';
import OlMap from 'ol/Map';
import {
  Pixel as OlPixel
} from 'ol/pixel';
import OlFeature, {
  FeatureLike as OlFeatureLike
} from 'ol/Feature';
import {
  Geometry as OlGeometry
} from 'ol/geom';
import OlGeomPoint from 'ol/geom/Point';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
import OlBaseEvent from 'ol/events/Event';
import { Condition as OlEventsConditionType } from 'ol/events/condition';
import { fromExtent } from 'ol/geom/Polygon';
import {
  getCenter,
  boundingExtent
} from 'ol/extent';

export type InteractionTransformEventOptions = {
  feature?: OlFeature;
  pixel?: OlPixel;
  coordinate?: OlCoordinate;
  angle?: number;
  delta?: [number, number];
  scale?: [number, number];
  oldgeom?: OlGeometry;
};

export class InteractionTransformEvent extends OlBaseEvent {
  feature?;
  pixel?;
  coordinate?;
  angle?;
  delta?;
  scale?;
  oldgeom?;

  constructor(type: string, options: InteractionTransformEventOptions) {
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

export type OlInteractionTransformOpts = OlInteractionPointerOpts & {
  // Array of layers to transform
  layers: OlLayerVector<OlSourceVector>[] | OlLayerVector<OlSourceVector>;
  // Collection of feature to transform
  features: OlFeature<OlGeometry>[];
  // Translate when click on feature
  translateFeature?: boolean;
  // Can translate the feature
  translate?: boolean;
  // Can stretch the feature
  stretch?: boolean;
  // Can scale the feature
  scale?: boolean;
  // Can rotate the feature
  rotate?: boolean;
  // A function that takes an ol.MapBrowserEvent and returns a boolean to keep aspect ratio,
  // default ol.events.condition.shiftKeyOnly.
  keepAspectRatio?: OlEventsConditionType;
  // List of ol.style for handles
  style?: any;
};

/**
 * The transform interaction.
 *
 * The following class is based on the great work done by https://github.com/Viglino
 * at http://viglino.github.io/ol-ext/interaction/transforminteraction.js
 *
 * This is just a port to use it in an es6 module environment.
 *
 * @fires select | rotatestart | rotating | rotateend | translatestart | translating |
 *  translateend | scalestart | scaling | scaleend
 */
export class OlInteractionTransform extends OlInteractionPointer {
  style?: {
    [key: string]: OlStyleStyle[];
  };

  overlayLayer_?: OlLayerVector<OlSourceVector>;

  handles_?: OlCollection<OlFeature<OlGeomPoint>>;

  features_?: OlFeature<OlGeometry>[];

  feature_?: OlFeature<OlGeometry>;

  layers_?: OlLayerVector<OlSourceVector>[];

  isTouch?: boolean;

  bbox_?: OlFeature<OlGeometry>;

  ispt_?: boolean;

  center_?: OlCoordinate;

  mode_?: string;

  opt_?: any;

  constraint_?: string;

  coordinate_?: OlCoordinate;

  pixel_?: OlPixel;

  geom_?: OlGeometry;

  extent_?: OlCoordinate[];

  angle_?: number;

  previousCursor_?: string;

  /**
   * Cursors for transform
   */
  Cursors: {
    [key: string]: string;
  } = {
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

  constructor(options: OlInteractionTransformOpts) {
    super(options);

    // Create a new overlay layer for the sketch.
    this.handles_ = new OlCollection();
    this.overlayLayer_ = new OlLayerVector({
      source: new OlSourceVector({
        features: this.handles_,
        useSpatialIndex: false
      }),
      // Return the style according to the handle type.
      style: feature => {
        if (!this.style) {
          return;
        }
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
    this.layers_ = options.layers ?
      options.layers instanceof Array
        ? options.layers
        : [options.layers]
      : undefined;

    if (Array.isArray(this.layers_)) {
      this.layers_.forEach(layer => {
        layer.getSource()?.on('changefeature', () => {
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
        function (e: any) {
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
   */
  setMap(map: OlMap) {
    const m = this.getMap();

    if (m && this.overlayLayer_) {
      m.removeLayer(this.overlayLayer_);
    }

    OlInteractionPointer.prototype.setMap.call(this, map);
    this.overlayLayer_?.setMap(map);

    if (map !== null) {
      this.isTouch = /touch/.test(map.getViewport().className);
      this.setDefaultStyle();
    }
  }

  /**
   * Activate/deactivate interaction
   */
  setActive(b: boolean) {
    if (!this.overlayLayer_) {
      return;
    }
    this.select();
    this.overlayLayer_.setVisible(b);
    OlInteractionPointer.prototype.setActive.call(this, b);
  }

  /**
   * Set default sketch style
   */
  setDefaultStyle() {
    const stroke = new OlStyleStroke({
      color: 'rgba(255, 0, 0, 1)',
      width: 1
    });
    const strokedash = new OlStyleStroke({
      color: 'rgba(255, 0, 0, 1)',
      width: 1,
      lineDash: [4, 4]
    });
    const fill0 = new OlStyleFill({
      color: 'rgba(255, 0, 0, 0.01)'
    });
    const fill = new OlStyleFill({
      color: 'rgba(255, 255, 255, 0.8)'
    });
    const circle = new OlStyleRegularShape({
      fill: fill,
      stroke: stroke,
      radius: this.isTouch ? 12 : 6,
      points: 15
    });

    circle.getAnchor()[0] = this.isTouch ? -10 : -5;

    const bigpt = new OlStyleRegularShape({
      fill: fill,
      stroke: stroke,
      radius: this.isTouch ? 16 : 8,
      points: 4,
      angle: Math.PI / 4
    });

    const smallpt = new OlStyleRegularShape({
      fill: fill,
      stroke: stroke,
      radius: this.isTouch ? 12 : 6,
      points: 4,
      angle: Math.PI / 4
    });

    function createStyle(img: OlStyleImage, str: OlStyleStroke, fll: OlStyleFill) {
      return [
        new OlStyleStyle({
          image: img,
          stroke: str,
          fill: fll
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
   */
  setStyle(style: string, olstyle: OlStyleStyle[] | OlStyleStyle) {
    if (!olstyle) {
      return;
    }

    if (!this.style) {
      return;
    }

    if (olstyle instanceof Array) {
      this.style[style] = olstyle;
    } else {
      this.style[style] = [olstyle];
    }

    for (let i = 0; i < this.style[style].length; i++) {
      const im = this.style[style][i].getImage();
      if (im) {
        if (style === 'rotate') {
          im.getAnchor()[0] = -5;
        }
        if (this.isTouch) {
          im.setScale(1.8);
        }
      }
      const tx = this.style[style][i].getText();
      if (tx) {
        if (style === 'rotate') {
          tx.setOffsetX(this.isTouch ? 14 : 7);
        }
        if (this.isTouch) {
          tx.setScale(1.8);
        }
      }
    }
    this.drawSketch_(false);
  }

  /**
   * Get Feature at pixel
   */
  getFeatureAtPixel_(pixel: OlPixel) {
    const self = this;
    let found: {
      feature?: OlFeatureLike;
      handle?: string;
      constraint?: string;
      option?: any;
    } = {};
    this.getMap()?.forEachFeatureAtPixel(pixel, function (feature, layer) {
      // Overlay ?
      if (!layer) {
        // eslint-disable-next-line no-underscore-dangle
        if (feature === self.bbox_) {
          return false;
        }
        // eslint-disable-next-line no-underscore-dangle
        self.handles_?.forEach(function (f) {
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
        for (let i = 0; i < self.layers_.length; i++) {
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
   * @param center only the center
   */
  drawSketch_(center: boolean) {
    this.overlayLayer_?.getSource()?.clear();

    if (!this.feature_) {
      return;
    }

    let ext;
    let geom;
    let f;

    if (center === true && this.center_) {
      if (!this.ispt_) {
        this.overlayLayer_?.getSource()?.addFeature(
          new OlFeature({
            geometry: new OlGeomPoint(this.center_),
            handle: 'rotate0'
          })
        );
        ext = this.feature_?.getGeometry()?.getExtent();
        if (ext) {
          geom = fromExtent(ext);
          f = this.bbox_ = new OlFeature(geom);
          this.overlayLayer_?.getSource()?.addFeature(f);
        }
      }
    } else {
      ext = this.feature_?.getGeometry()?.getExtent();
      if (!ext) {
        return;
      }
      if (this.ispt_) {
        const map = this.getMap();
        if (map) {
          const p = map.getPixelFromCoordinate([ext[0], ext[1]]);
          ext = boundingExtent([
            map.getCoordinateFromPixel([p[0] - 10, p[1] - 10]),
            map.getCoordinateFromPixel([p[0] + 10, p[1] + 10])
          ]);
        }
      }
      geom = fromExtent(ext);
      f = this.bbox_ = new OlFeature(geom);
      const features = [];
      const g = geom.getCoordinates()[0];

      if (!this.ispt_) {
        features.push(f);

        // Middle
        if (this.get('stretch') && this.get('scale'))
        {for (let i = 0; i < g.length - 1; i++) {
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
        }}

        // Handles
        if (this.get('scale'))
        {for (let j = 0; j < g.length - 1; j++) {
          f = new OlFeature({
            geometry: new OlGeomPoint(g[j]),
            handle: 'scale',
            option: j
          });
          features.push(f);
        }}

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
      this.overlayLayer_?.getSource()?.addFeatures(features);
    }
  }

  /**
   * Selects a feature to transform.
   *
   * @param feature The feature to transform.
   */
  select(feature?: OlFeature) {
    this.feature_ = feature;
    this.ispt_ = this.feature_
      ? this.feature_?.getGeometry()?.getType() === 'Point'
      : false;
    this.drawSketch_(false);
    this.dispatchEvent(
      new InteractionTransformEvent('select', {
        feature: this.feature_
      })
    );
  }

  /**
   * @return `true` to start the drag sequence.
   */
  handleDownEvent(evt: OlMapBrowserEvent<MouseEvent>) {
    const sel = this.getFeatureAtPixel_(evt.pixel);
    const feature = sel.feature;

    if (
      this.feature_ &&
      this.feature_ === feature &&
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
      this.geom_ = this.feature_?.getGeometry()?.clone();
      this.extent_ = this.geom_ ? fromExtent(this.geom_.getExtent()).getCoordinates()[0] : undefined;
      this.center_ = this.geom_ ? getCenter(this.geom_.getExtent()) : undefined;
      this.angle_ = this.center_ ? Math.atan2(
        this.center_[1] - evt.coordinate[1],
        this.center_[0] - evt.coordinate[0]
      ) : undefined;

      this.dispatchEvent(
        new InteractionTransformEvent(this.mode_ + 'start', {
          feature: this.feature_,
          pixel: evt.pixel,
          coordinate: evt.coordinate
        })
      );

      return true;
    } else {
      // @ts-ignore
      this.feature_ = feature;
      this.ispt_ = this.feature_
        ? this.feature_?.getGeometry()?.getType() === 'Point'
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
   * @param evt Map browser event.
   */
  handleDragEvent(evt: OlMapBrowserEvent<MouseEvent>) {
    let geometry;

    if (!this.feature_ || !this.geom_ || !this.center_ || !this.angle_ || !this.coordinate_ || !this.extent_) {
      return;
    }

    switch (this.mode_) {
      case 'rotate': {
        const a = Math.atan2(
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
        const deltaX = evt.coordinate[0] - this.coordinate_[0];
        const deltaY = evt.coordinate[1] - this.coordinate_[1];

        this.feature_?.getGeometry()?.translate(deltaX, deltaY);
        this.handles_?.forEach(function (f: OlFeature<OlGeomPoint>) {
          f.getGeometry()?.translate(deltaX, deltaY);
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
        let center = this.center_;
        const mouseEvent = /** @type {MouseEvent} */ evt.originalEvent;
        if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
          center = this.extent_[(Number(this.opt_) + 2) % 4];
        }

        let scx =
          (evt.coordinate[0] - center[0]) / (this.coordinate_[0] - center[0]);
        let scy =
          (evt.coordinate[1] - center[1]) / (this.coordinate_[1] - center[1]);

        if (this.constraint_) {
          if (this.constraint_ === 'h') {
            scx = 1;
          } else {
            scy = 1;
          }
        } else {
          const keepAspectRatio = this.get('keepAspectRatio');
          if (keepAspectRatio || keepAspectRatio(evt)) {
            scx = scy = Math.min(scx, scy);
          }
        }

        geometry = this.geom_.clone();
        geometry.applyTransform((g1, g2, dim) => {
          if (!g2 || g2.length === 0 || !dim) {
            return [];
          }

          if (dim && dim < 2) {
            return g2;
          }

          for (let i = 0; i < g1.length; i += dim) {
            if (scx !== 1) {
              g2[i] = center[0] + (g1[i] - center[0]) * scx;
            }
            if (scy !== 1) {
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
   * @param evt Event.
   */
  handleMoveEvent(evt: OlMapBrowserEvent<MouseEvent>) {
    if (!this.mode_) {
      const sel = this.getFeatureAtPixel_(evt.pixel);
      const element = evt.map.getTargetElement();
      if (sel.feature) {
        const c = sel.handle
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
   * @return `false` to stop the drag sequence.
   */
  handleUpEvent() {
    this.dispatchEvent(
      new InteractionTransformEvent(this.mode_ + 'end', {
        feature: this.feature_,
        oldgeom: this.geom_
      })
    );

    this.drawSketch_(false);
    this.mode_ = undefined;
    return false;
  }
}

export default OlInteractionTransform;
