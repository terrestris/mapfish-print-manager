import OlMap from 'ol/Map';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceVector from 'ol/source/Vector';
import OlFeature from 'ol/Feature';
import OlRenderEvent from 'ol/render/Event';
import OlLayer from 'ol/layer/Layer';
import {containsExtent, getCenter, getSize} from 'ol/extent';
import OlPolygon, {fromExtent} from 'ol/geom/Polygon';

import OlStyleStyle from 'ol/style/Style';
import OlStyleFill from 'ol/style/Fill';

import BaseSerializer from '../serializer/BaseSerializer';
import InteractionTransform from '../interaction/InteractionTransform';
import Shared from '../util/Shared';
import Logger from '../util/Logger';

import Observable from '../observable/Observable';

import type { Extent } from 'ol/extent';

/**
 * The BaseMapFishPrintManager.
 *
 * @fires {change:layout | change:outputformat | change:dpi | change:scale}
 * @class
 */
export class BaseMapFishPrintManager extends Observable {
  /**
   * The name of the vector layer configured and created by the print manager.
   *
   * @type {string}
   */
  static EXTENT_LAYER_NAME = 'PrintManager Vector Layer';

  /**
   * The name of the transform interaction configured and created by the
   * print manager.
   *
   * @type {string}
   */
  static TRANSFORM_INTERACTION_NAME = 'PrintManager Transform Interaction';

  /**
   * The key in the layer properties to lookup for custom serializer options.
   *
   * @type {string}
   */
  static CUSTOM_PRINT_SERIALIZER_OPTS_KEY = 'customPrintSerializerOpts';

  /**
   * The map this PrintManager is bound to. Required.
   *
   * @type {OlMap}
   */
  map = null;

  /**
   * Base url of the print service.
   *
   * @type {string}
   */
  url = null;

  /**
   * The capabilities of the print service. Either filled automatically out of
   * the the given print service or given manually.
   *
   * @type {Object}
   */
  capabilities = null;

  /**
   * Method to use when sending print requests to the servlet. Either `POST` or
   * `GET` (case-sensitive). Default is to `POST`.
   *
   * @type {string}
   */
  method = 'POST';

  /**
   * Additional headers to be send to the print servlet.
   *
   * @type {Object}
   */
  headers = {};

  /**
   * The authentication credentials mode. Default is to 'same-origin'.
   *
   * @type {RequestCredentials}
   */
  credentialsMode: RequestCredentials = 'same-origin';

  /**
   * Key-value pairs of custom data to be sent to the print service. This is
   * e.g. useful for complex layout definitions on the server side that
   * require additional parameters. Optional.
   *
   * @type {Object}
   */
  customParams = {};

  /**
   * The layer to show the actual print extent on. If not provided, a default
   * one will be created.
   *
   * @type {OlLayerVector}
   */
  extentLayer = null;

  /**
   * The color to apply to the mask around the extent feature. Will be applied
   * to the default extentLayer only. If you don't want the mask to be shown on
   * the map, provide a custom extentLayer.
   *
   * @type {string}
   */
  maskColor = 'rgba(130, 130, 130, 0.5)';

  /**
   * Custom options to apply to the transform interaction. See
   * http://viglino.github.io/ol-ext/doc/doc-pages/ol.interaction.Transform.html
   * for valid options.
   *
   * @type {Object}
   */
  transformOpts = {};

  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a layer for print or not.
   *
   * @type {(layer: OlLayer) => boolean}
   */
  layerFilter = layer => true;

  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a legend of a layer for print or not.
   *
   * @type {(layer: OlLayer) => boolean}
   */
  legendFilter = layer => true;

  /**
   * An array determining custom print scales. If provided, these will override
   * the scales retrieved from print capabilities.
   *
   * @type {number[]}
   */
  customPrintScales = [];

  /**
   * Default timeout in ms after which print job polling will be canceled. The
   * default is set to 30 seconds.
   *
   * @type {number}
   */
  timeout = 30000;

  /**
   * @type {BaseSerializer[]}
   */
  serializers = [];

  /**
   * The supported layouts by the print service.
   *
   * @type {Array}
   * @protected
   */
  _layouts = [];

  /**
   * The supported output formats by the print service.
   *
   * @type {Array}
   * @protected
   */
  _outputFormats = [];

  /**
   * The supported DPIs by the print service.
   *
   * @type {Array}
   * @protected
   */
  _dpis = [];

  /**
   * The supported scales by the print service.
   *
   * @type {Array}
   * @protected
   */
  _scales = [];

  /**
   * The currently selected layout.
   *
   * @type {Object}
   * @protected
   */
  _layout: any = {};

  /**
   * The currently selected output format.
   *
   * @type {Object}
   * @protected
   */
  _outputFormat: any = {};

  /**
   * The currently selected dpi.
   *
   * @type {Object}
   * @protected
   */
  _dpi: any = {};

  /**
   * The currently selected scale.
   *
   * @type {Object}
   * @protected
   */
  _scale: any = {};

  /**
   * The currently set map size defined with its width and height.
   *
   * @type {Object}
   * @protected
   */
  _printMapSize = {};

  /**
   * Whether this manger has been initiated or not.
   *
   * @type {boolean}
   * @protected
   */
  _initiated = false;

  /**
   * Feature representing the page extent.
   *
   * @type {OlFeature<OlPolygon>}
   * @protected
   */
  _extentFeature = null;

  /**
   * The constructor
   */
  constructor(opts) {
    super();

    Object.assign(this, ...opts);

    if (!(this.map instanceof OlMap)) {
      Logger.warn(
        'Invalid value given to config option `map`. You need to ' +
          'provide an ol.Map to use the PrintManager.'
      );
    }

    if (!this.url && !this.capabilities) {
      Logger.warn(
        'Invalid init options given. Please provide either an `url` ' +
          'or `capabilities`.'
      );
    }

    if (this.url && this.url.split('/').pop()) {
      this.url += '/';
    }
  }

  /**
   * Shuts down the manager.
   */
  shutdownManager() {
    // Remove print layer from map. But only if not given by user.
    const layerCandidates = Shared.getLayersByName(
      this.map,
      BaseMapFishPrintManager.EXTENT_LAYER_NAME
    );

    layerCandidates.forEach(layer => this.map.removeLayer(layer));

    // Remove transform interaction from map.
    const interactionCandidates = Shared.getInteractionsByName(
      this.map,
      BaseMapFishPrintManager.TRANSFORM_INTERACTION_NAME
    );

    interactionCandidates.forEach(interaction =>
      this.map.removeInteraction(interaction)
    );
  }

  /**
   * Validates the given HTTP fetch response.
   *
   * @param {Response} response The response to validate.
   *
   * @return {Promise} The resolved or rejected promise.
   */
  validateResponse(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(
        new Error(
          'Error while trying to request ' +
            `${response.url} (${response.status}: ${response.statusText})`
        )
      );
    }
  }

  /**
   * Initializes the print extent layer.
   */
  initPrintExtentLayer() {
    if (!(this.extentLayer instanceof OlLayerVector)) {
      const extentLayer = new OlLayerVector({
        source: new OlSourceVector(),
        style: new OlStyleStyle({
          fill: new OlStyleFill({
            color: 'rgba(255, 255, 130, 0)'
          })
        })
      });

      extentLayer.set('name', BaseMapFishPrintManager.EXTENT_LAYER_NAME);

      extentLayer.on('prerender', this.onExtentLayerPreRender.bind(this));
      extentLayer.on('postrender', this.onExtentLayerPostRender.bind(this));

      this.extentLayer = extentLayer;

      if (
        Shared.getLayersByName(
          this.map,
          BaseMapFishPrintManager.EXTENT_LAYER_NAME
        ).length === 0
      ) {
        this.map.addLayer(this.extentLayer);
      }
    }
  }

  /**
   * Called on the extentLayer's `prerender` event.
   *
   * @param {import("ol/render/Event").default} olEvt The ol render event.
   */
  onExtentLayerPreRender(olEvt) {
    const ctx = olEvt.context;
    ctx.save();
  }

  /**
   * Called on the extentLayer's `postrender` event.
   *
   * @param {OlRenderEvent} olEvt The ol render event.
   */
  onExtentLayerPostRender(olEvt) {
    const ctx = olEvt.context;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const coords = olEvt.target
      .getSource()
      .getFeatures()[0]
      .getGeometry()
      .getCoordinates()[0];

    const A = this.map.getPixelFromCoordinate(coords[1]);
    const B = this.map.getPixelFromCoordinate(coords[4]);
    const C = this.map.getPixelFromCoordinate(coords[3]);
    const D = this.map.getPixelFromCoordinate(coords[2]);

    ctx.fillStyle = this.maskColor;

    ctx.beginPath();

    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.lineTo(0, 0);
    ctx.closePath();

    ctx.moveTo(A[0], A[1]);
    ctx.lineTo(B[0], B[1]);
    ctx.lineTo(C[0], C[1]);
    ctx.lineTo(D[0], D[1]);
    ctx.lineTo(A[0], A[1]);
    ctx.closePath();

    ctx.fill();

    ctx.restore();
  }

  /**
   * Initializes the print extent feature.
   *
   * @return {OlFeature} The extent feature.
   */
  initPrintExtentFeature() {
    const printExtent: Extent = this.calculatePrintExtent();
    const extentFeature = new OlFeature(fromExtent(printExtent));
    const extentLayerSource = this.extentLayer.getSource();

    this._extentFeature = extentFeature;

    extentLayerSource.clear();
    extentLayerSource.addFeature(this._extentFeature);

    return this._extentFeature;
  }

  /**
   * Initializes the transform interaction.
   */
  initTransformInteraction() {
    if (
      Shared.getInteractionsByName(
        this.map,
        BaseMapFishPrintManager.TRANSFORM_INTERACTION_NAME
      ).length === 0
    ) {
      const transform = new InteractionTransform({
        features: [this._extentFeature],
        translateFeature: true,
        translate: true,
        stretch: false,
        scale: true,
        rotate: true,
        keepAspectRatio: true,
        ...this.transformOpts
      });

      transform.setActive(true);

      transform.set('name', BaseMapFishPrintManager.TRANSFORM_INTERACTION_NAME);

      // @ts-ignore
      transform.on('scaling', this.onTransformScaling.bind(this));

      this.map.addInteraction(transform);
    }
  }

  /**
   * Called on translate interaction's `scaling` event.
   */
  onTransformScaling() {
    const scale = this.getClosestScaleToFitExtentFeature();
    this.setScale(scale);
  }

  /**
   * Returns the closest scale to current print feature's extent.
   */
  getClosestScaleToFitExtentFeature() {
    const scales = this.getScales();
    const printFeatureExtent = this._extentFeature.getGeometry().getExtent();
    const printFeatureSize = getSize(printFeatureExtent);
    let closest = Number.POSITIVE_INFINITY;
    let fitScale = scales[0];

    scales.forEach(scale => {
      const scaleVal = scale.value ? scale.value : scale;
      const printScaleExtent = this.calculatePrintExtent(scaleVal);
      const printScaleSize = getSize(printScaleExtent);
      const diff =
        Math.abs(printScaleSize[0] - printFeatureSize[0]) +
        Math.abs(printScaleSize[1] - printFeatureSize[1]);

      if (diff < closest) {
        closest = diff;
        fitScale = scale;
      }
    });

    return fitScale;
  }

  /**
   * Returns the closest scale to fit the print feature's extent into the
   * current extent of the map.
   */
  getClosestScaleToFitMap() {
    const mapView = this.map.getView();
    const mapExtent = mapView.calculateExtent();
    const scales = this.getScales();
    let fitScale = scales[0];

    scales.forEach(scale => {
      const scaleVal = scale.value ? scale.value : scale;
      const printExtent = this.calculatePrintExtent(scaleVal);
      const contains = containsExtent(mapExtent, printExtent);

      if (contains) {
        fitScale = scale;
      }
    });

    return fitScale;
  }

  /**
   * Calculates the current rotation of the print extent feature.
   */
  calculateRotation() {
    const extentFeature = this._extentFeature;
    const coords = extentFeature.getGeometry().getCoordinates()[0];
    const p1 = coords[0];
    const p2 = coords[3];
    const rotation = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;

    return -rotation;
  }

  /**
   * Resets the rotation of the print extent feature.
   */
  resetRotation() {
    this.setRotation(this.calculateRotation() * -1);
  }

  /**
   * Rotates the print extent by the amount of the given rotation.
   *
   * @param {number} rotation The amount to rotate.
   */
  setRotation(rotation) {
    const center = getCenter(this._extentFeature.getGeometry().getExtent());
    this._extentFeature.getGeometry().rotate(rotation, center);
  }

  /**
   * Updates the geometry of the print extent feature to match the current scale.
   */
  updatePrintExtent() {
    if (this.isInitiated()) {
      const printExtent = this.calculatePrintExtent();
      if (this._extentFeature) {
        this._extentFeature.setGeometry(fromExtent(printExtent));
      }
    }
  }

  /**
   * Calculates the extent based on a scale.
   *
   * @param {number} [scale] The scale to calculate the extent for. If not given,
   *                       the current scale of the provider will be used.
   *
   * @return {Extent} The extent.
   */
  calculatePrintExtent(scale?: any | undefined): Extent {
    const printMapSize = this.getPrintMapSize();
    const printScale = scale || this.getScale();
    const { width, height } = this.getPrintExtentSize(printMapSize, printScale);

    let center;
    if (this._extentFeature) {
      center = getCenter(this._extentFeature.getGeometry().getExtent());
    } else {
      center = this.map.getView().getCenter();
    }

    return [
      center[0] - width / 2,
      center[1] - height / 2,
      center[0] + width / 2,
      center[1] + height / 2
    ];
  }

  /**
   * Computes size of print extent in pixel depending on dimensions of print map
   * and print scale.
   * @param {Object} printMapSize Print map size containing its width and height.
   * @param {number} printScale Print scale.
   *
   * @return {Object} Print extent size.
   */
  getPrintExtentSize(printMapSize, printScale) {
    const mapUnits = this.map.getView().getProjection().getUnits();
    const inchesPerUnit = {
      degrees: 4374754,
      ft: 12,
      m: 39.37
    };
    return {
      width: (printMapSize.width * printScale) / (72 * inchesPerUnit[mapUnits]),
      height:
        (printMapSize.height * printScale) / (72 * inchesPerUnit[mapUnits])
    };
  }

  /**
   * Opens the given URL in a new browser tab to download the given response
   * (if header are set correctly).
   *
   * @param {string} url The url to open.
   */
  download(url) {
    if (/Opera|OPR\//.test(navigator.userAgent)) {
      window.open(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Checks if a given layer should be printed.
   *
   * @param {OlLayer} layer The layer to check.
   *
   * @return {boolean} Whether the layer should be printed or not.
   */
  filterPrintableLayer(layer) {
    return (
      layer !== this.extentLayer &&
      layer.getVisible() &&
      this.layerFilter(layer)
    );
  }

  /**
   * Checks if the legend of a given legend should be printed.
   *
   * @param {OlLayer} layer The layer to check.
   *
   * @return {boolean} Whether the legend of the layer should be printed or not.
   */
  filterPrintableLegend(layer) {
    return (
      layer !== this.extentLayer &&
      layer.getVisible() &&
      this.legendFilter(layer)
    );
  }

  /**
   * Serializes/encodes the given layer.
   *
   * @param {OlLayer} layer The layer to serialize/encode.
   *
   * @return {Object} The serialized/encoded layer.
   */
  serializeLayer(layer) {
    const viewResolution = this.map.getView().getResolution();
    const layerSource = layer.getSource();

    const serializer = this.serializers.find(serializer => {
      return serializer.canSerialize(layerSource);
    });

    if (serializer) {
      return serializer.serialize(
        layer,
        layer.get(BaseMapFishPrintManager.CUSTOM_PRINT_SERIALIZER_OPTS_KEY),
        viewResolution
      );
    } else {
      Logger.info(
        'No suitable serializer for this layer/source found. ' +
          'Please check the input layer or provide an own serializer capabale ' +
          'of serializing the given layer/source to the manager. Layer ' +
          'candidate is: ',
        layer
      );
    }
  }

  /**
   * Serializes/encodes the legend payload for the given layer.
   *
   * @param {OlLayer} layer The layer to serialize/encode the legend for.
   *
   * @return {Object} The serialized/encoded legend.
   */
  serializeLegend(layer: any): any {
    const source = layer.getSource();
    if (
      source instanceof OlSourceTileWMS ||
      source instanceof OlSourceImageWMS ||
      source instanceof OlSourceWMTS
    ) {
      return {
        name:
          layer.get('name') ||
          (!(source instanceof OlSourceWMTS) && source.getParams().LAYERS) ||
          '',
        icons: [Shared.getLegendGraphicUrl(layer)]
      };
    }
  }

  /**
   * Returns the currently selected layout.
   *
   * @return {Object} The currently selected layout.
   */
  getLayout() {
    return this._layout;
  }

  /**
   * Sets the layout to use. Updates the print extent accordingly.
   *
   * @param {string} name The name of the layout to use.
   */
  setLayout(name) {
    const layout = this.getLayouts().find(layout => layout.name === name);

    if (!layout) {
      Logger.warn(`No layout named '${name}' found.`);
      return;
    }

    this._layout = layout;

    this.updatePrintExtent();

    this.dispatch('change:layout', layout);
  }

  /**
   * Returns the currently selected output format.
   *
   * @return {Object} The currently selected output format.
   */
  getOutputFormat() {
    return this._outputFormat;
  }

  /**
   * Sets the output format to use.
   *
   * @param {string} name The name of the output format to use.
   */
  setOutputFormat(name) {
    const format = this.getOutputFormats().find(format => format === name);

    if (!format) {
      Logger.warn(`No output format named '${name}' found.`);
      return;
    }

    this._outputFormat = format;

    this.dispatch('change:outputformat', format);
  }

  /**
   * Returns the currently selected dpi.
   *
   * @return {Object} The currently selected dpi.
   */
  getDpi() {
    return this._dpi;
  }

  /**
   * Sets the dpi to use.
   *
   * @param {string} name The name of the dpi to use.
   */
  setDpi = name => {
    const dpi = this.getDpis().find(dpi => {
      return dpi.name === name;
    });

    if (!dpi) {
      Logger.warn(`No dpi named '${name}' found.`);
      return;
    }

    this._dpi = dpi;

    this.dispatch('change:dpi', dpi);
  };

  /**
   * Returns the currently selected scale.
   *
   * @return {Object} The currently selected scale.
   */
  getScale() {
    return this._scale;
  }

  /**
   * Sets the scale to use. Updates the print extent accordingly.
   *
   * @param {number|string} value The value of the scale to use.
   */
  setScale(value) {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    const scale = this.getScales().find(scale => scale === value);

    if (!scale) {
      Logger.warn(`No scale '${value}' found.`);
      return;
    }

    this._scale = scale;

    this.updatePrintExtent();

    this.dispatch('change:scale', scale);
  }

  /**
   * Returns all supported layouts.
   *
   * @return {Array} The supported layouts.
   */
  getLayouts() {
    return this._layouts;
  }

  /**
   * Returns all supported output formats.
   *
   * @return {Array} The supported output formats.
   */
  getOutputFormats() {
    return this._outputFormats;
  }

  /**
   * Returns all supported dpis.
   *
   * @return {Array} The supported dpis.
   */
  getDpis() {
    return this._dpis;
  }

  /**
   * Returns all supported scales.
   *
   * @return {Array} The supported scales.
   */
  getScales() {
    return this._scales;
  }

  /**
   * Returns print map size for chosen layout.
   *
   * @return {Object} The map.
   */
  getPrintMapSize() {
    return this._printMapSize;
  }

  /**
   * Sets the map size to use while printing.
   *
   * @param {Object} printMapSize The object containing width and height of
   * printed map.
   */
  setPrintMapSize(printMapSize) {
    this._printMapSize = printMapSize;
  }

  /**
   * Whether this manager has been initiated or not.
   *
   * @return {boolean} Whether this manager has been initiated or not.
   */
  isInitiated() {
    return this._initiated;
  }
}

export default BaseMapFishPrintManager;
