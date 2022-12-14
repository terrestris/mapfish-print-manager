import OlMap from 'ol/Map';
import OlLayer from 'ol/layer/Layer';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceVector from 'ol/source/Vector';
import OlFeature from 'ol/Feature';
import OlGeomPolygon from 'ol/geom/Polygon';
import OlRenderEvent from 'ol/render/Event';
import {containsExtent, getCenter, getSize} from 'ol/extent';
import {fromExtent} from 'ol/geom/Polygon';
import type { Extent } from 'ol/extent';
import OlStyleStyle from 'ol/style/Style';
import OlStyleFill from 'ol/style/Fill';

import InteractionTransform from '../interaction/InteractionTransform';

import Shared from '../util/Shared';
import Logger from '../util/Logger';

import Observable from '../observable/Observable';

import BaseSerializer from '../serializer/BaseSerializer';

export type BaseMapFishPrintManagerOpts = {
  /**
   * The map this PrintManager is bound to. Required.
   */
  map: OlMap;
  /**
   * Base url of the print service.
   */
  url?: string;
  /**
   * The capabilities of the print service. Either filled automatically out of
   * the the given print service or given manually.
   */
  capabilities?: any;
  /**
   * Method to use when sending print requests to the servlet. Either `POST` or
   * `GET` (case-sensitive). Default is to `POST`.
   */
  method?: 'GET' | 'POST';
  /**
   * Additional headers to be send to the print servlet.
   */
  headers?: any;
  /**
   * The authentication credentials mode. Default is to 'same-origin'.
   */
  credentialsMode?: RequestCredentials;
  /**
   * Key-value pairs of custom data to be sent to the print service. This is
   * e.g. useful for complex layout definitions on the server side that
   * require additional parameters. Optional.
   */
  customParams?: any;
  /**
   * The layer to show the actual print extent on. If not provided, a default
   * one will be created.
   */
  extentLayer?: OlLayerVector<OlSourceVector>;
  /**
   * The color to apply to the mask around the extent feature. Will be applied
   * to the default extentLayer only. If you don't want the mask to be shown on
   * the map, provide a custom extentLayer.
   */
  maskColor?: string;
  /**
   * Custom options to apply to the transform interaction. See
   * http://viglino.github.io/ol-ext/doc/doc-pages/ol.interaction.Transform.html
   * for valid options.
   */
  transformOpts?: any;
  /**
   * An array determining custom print scales. If provided, these will override
   * the scales retrieved from print capabilities.
   */
  customPrintScales?: number[];
  /**
   * Default timeout in ms after which print job polling will be canceled. The
   * default is set to 30 seconds.
   */
  timeout?: number;
  /**
   * The layer serializers to use. May be overridden or extented to obtain
   * custom functionality.
   */
  serializers?: BaseSerializer[];
};

/**
 * The BaseMapFishPrintManager.
 *
 * @fires {change:layout | change:outputformat | change:dpi | change:scale}
 * @class
 */
export class BaseMapFishPrintManager extends Observable {
  /**
   * The name of the vector layer configured and created by the print manager.
   */
  static EXTENT_LAYER_NAME: string = 'PrintManager Vector Layer';

  /**
   * The name of the transform interaction configured and created by the
   * print manager.
   */
  static TRANSFORM_INTERACTION_NAME: string = 'PrintManager Transform Interaction';

  /**
   * The key in the layer properties to lookup for custom serializer options.
   */
  static CUSTOM_PRINT_SERIALIZER_OPTS_KEY: string = 'customPrintSerializerOpts';

  map: OlMap;

  url?: string;

  capabilities?: any;

  method: 'GET' | 'POST';

  headers?: any;

  credentialsMode: RequestCredentials;

  customParams?: any;

  extentLayer?: OlLayerVector<OlSourceVector>;

  maskColor: string;

  transformOpts?: any;

  customPrintScales?: number[];

  timeout: number;

  serializers: BaseSerializer[] = [];

  /**
   * The supported layouts by the print service.
   *
   * @private
   */
  _layouts: any[] = [];

  /**
   * The supported output formats by the print service.
   *
   * @private
   */
  _outputFormats: any[] = [];

  /**
   * The supported DPIs by the print service.
   *
   * @private
   */
  _dpis: any[] = [];

  /**
   * The supported scales by the print service.
   *
   * @private
   */
  _scales: any[] = [];

  /**
   * The currently selected layout.
   *
   * @private
   */
  _layout: any = {};

  /**
   * The currently selected output format.
   *
   * @private
   */
  _outputFormat: any = {};

  /**
   * The currently selected dpi.
   *
   * @private
   */
  _dpi: any = {};

  /**
   * The currently selected scale.
   *
   * @private
   */
  _scale: any = {};

  /**
   * The currently set map size defined with its width and height.
   *
   * @private
   */
  _printMapSize: any = {};

  /**
   * Whether this manger has been initiated or not.
   *
   * @private
   */
  _initiated: boolean = false;

  /**
   * Feature representing the page extent.
   *
   * @private
   */
  _extentFeature?: OlFeature<OlGeomPolygon>;

  constructor(opts: BaseMapFishPrintManagerOpts) {
    super();

    this.map = opts.map;
    this.url = opts.url;
    this.capabilities = opts.capabilities;
    this.method = opts.method ? opts.method : 'POST';
    this.headers = opts.headers;
    this.credentialsMode = opts.credentialsMode ? opts.credentialsMode : 'same-origin';
    this.customParams = opts.customParams;
    this.extentLayer = opts.extentLayer;
    this.maskColor = opts.maskColor ? opts.maskColor : 'rgba(130, 130, 130, 0.5)';
    this.transformOpts = opts.transformOpts;
    this.customPrintScales = opts.customPrintScales;
    this.timeout = opts.timeout ? opts.timeout : 30000;
    this.serializers = opts.serializers ? opts.serializers : [];

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
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a layer for print or not.
   */
  layerFilter: (layer: OlLayer) => boolean = layer => true;

  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a legend of a layer for print or not.
   *
   */
  legendFilter: (layer: OlLayer) => boolean = (layer): boolean => true;

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
   * @param response The response to validate.
   */
  validateResponse(response: Response): void {
    if (!response.ok) {
      throw new Error(
        'Error while trying to request ' +
          `${response.url} (${response.status}: ${response.statusText})`
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
  onExtentLayerPreRender(olEvt: OlRenderEvent) {
    const ctx = olEvt.context;

    if (!(ctx instanceof CanvasRenderingContext2D)) {
      return;
    }

    ctx.save();
  }

  /**
   * Called on the extentLayer's `postrender` event.
   *
   * @param {OlRenderEvent} olEvt The ol render event.
   */
  onExtentLayerPostRender(olEvt: OlRenderEvent) {
    const ctx = olEvt.context;

    if (!(ctx instanceof CanvasRenderingContext2D)) {
      return;
    }

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
   * @return The extent feature.
   */
  initPrintExtentFeature() {
    const printExtent = this.calculatePrintExtent();

    if (!printExtent) {
      return;
    }

    const extentFeature = new OlFeature(fromExtent(printExtent));
    const extentLayerSource = this.extentLayer?.getSource();

    if (!extentLayerSource) {
      return;
    }

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
    const printFeatureExtent = this._extentFeature?.getGeometry()?.getExtent();

    if (!printFeatureExtent) {
      return;
    }

    const printFeatureSize = getSize(printFeatureExtent);
    let closest = Number.POSITIVE_INFINITY;
    let fitScale = scales[0];

    scales.forEach(scale => {
      const scaleVal = scale.value ? scale.value : scale;
      const printScaleExtent = this.calculatePrintExtent(scaleVal);

      if (!printScaleExtent) {
        return;
      }

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

      if (!printExtent) {
        return;
      }

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
    const coords = extentFeature?.getGeometry()?.getCoordinates()[0];

    if (!coords) {
      return;
    }

    const p1 = coords[0];
    const p2 = coords[3];
    const rotation = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;

    return -rotation;
  }

  /**
   * Resets the rotation of the print extent feature.
   */
  resetRotation() {
    const rotation = this.calculateRotation();

    if (!rotation) {
      return;
    }

    this.setRotation(rotation * -1);
  }

  /**
   * Rotates the print extent by the amount of the given rotation.
   *
   * @param {number} rotation The amount to rotate.
   */
  setRotation(rotation: number) {
    const extent = this._extentFeature?.getGeometry()?.getExtent();

    if (!extent) {
      return;
    }

    const center = getCenter(extent);
    this._extentFeature?.getGeometry()?.rotate(rotation, center);
  }

  /**
   * Updates the geometry of the print extent feature to match the current scale.
   */
  updatePrintExtent() {
    if (this.isInitiated()) {
      const printExtent = this.calculatePrintExtent();
      if (this._extentFeature && printExtent) {
        this._extentFeature.setGeometry(fromExtent(printExtent));
      }
    }
  }

  /**
   * Calculates the extent based on a scale.
   *
   * @param scale The scale to calculate the extent for. If not given,
   *              the current scale of the provider will be used.
   *
   * @return The extent.
   */
  calculatePrintExtent(scale?: number) {
    const printMapSize = this.getPrintMapSize();
    const printScale = scale || this.getScale();
    const { width, height } = this.getPrintExtentSize(printMapSize, printScale);
    const extentGeometry = this._extentFeature?.getGeometry();

    let center;
    if (this._extentFeature && extentGeometry) {
      center = getCenter(extentGeometry.getExtent());
    } else {
      center = this.map.getView().getCenter();
    }

    if (!center) {
      return;
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
   * @param printMapSize Print map size containing its width and height.
   * @param printScale Print scale.
   *
   * @return Print extent size.
   */
  getPrintExtentSize(printMapSize: any, printScale: number): {
    width: number;
    height: number;
  } {
    const inchesPerUnit = {
      degrees: 4374754,
      ft: 12,
      m: 39.37
    };
    const mapUnits = this.map.getView().getProjection().getUnits() as keyof typeof inchesPerUnit;

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
   * @param url The url to open.
   */
  download(url: string) {
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
  filterPrintableLayer(layer: OlLayer): boolean {
    return (
      layer !== this.extentLayer &&
      layer.getVisible() &&
      this.layerFilter(layer)
    );
  }

  /**
   * Checks if the legend of a given legend should be printed.
   *
   * @param layer The layer to check.
   *
   * @return Whether the legend of the layer should be printed or not.
   */
  filterPrintableLegend(layer: OlLayer): boolean {
    return (
      layer !== this.extentLayer &&
      layer.getVisible() &&
      this.legendFilter(layer)
    );
  }

  /**
   * Serializes/encodes the given layer.
   *
   * @param layer The layer to serialize/encode.
   *
   * @return The serialized/encoded layer.
   */
  serializeLayer(layer: OlLayer) {
    const viewResolution = this.map.getView().getResolution();
    const layerSource = layer.getSource();

    if (!layerSource) {
      return;
    }

    const serializer = this.serializers.find(s => {
      return s.validateSource(layerSource);
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
   * @return The currently selected layout.
   */
  getLayout(): any {
    return this._layout;
  }

  /**
   * Sets the layout to use. Updates the print extent accordingly.
   *
   * @param {string} name The name of the layout to use.
   */
  setLayout(name: string) {
    const layout = this.getLayouts().find(l => l.name === name);

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
   * @return The currently selected output format.
   */
  getOutputFormat(): any {
    return this._outputFormat;
  }

  /**
   * Sets the output format to use.
   *
   * @param {string} name The name of the output format to use.
   */
  setOutputFormat(name: string) {
    const format = this.getOutputFormats().find(f => f === name);

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
   * @return The currently selected dpi.
   */
  getDpi(): any {
    return this._dpi;
  }

  /**
   * Sets the dpi to use.
   *
   * @param {string} name The name of the dpi to use.
   */
  setDpi = (name: string) => {
    const dpi = this.getDpis().find(d => {
      return d.name === name;
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
   * @return The currently selected scale.
   */
  getScale() {
    return this._scale;
  }

  /**
   * Sets the scale to use. Updates the print extent accordingly.
   *
   * @param {number|string} value The value of the scale to use.
   */
  setScale(value: number | string) {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    const scale = this.getScales().find(s => s === value);

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
   * @return The supported layouts.
   */
  getLayouts() {
    return this._layouts;
  }

  /**
   * Returns all supported output formats.
   *
   * @return The supported output formats.
   */
  getOutputFormats() {
    return this._outputFormats;
  }

  /**
   * Returns all supported dpis.
   *
   * @return The supported dpis.
   */
  getDpis() {
    return this._dpis;
  }

  /**
   * Returns all supported scales.
   *
   * @return The supported scales.
   */
  getScales() {
    return this._scales;
  }

  /**
   * Returns print map size for chosen layout.
   *
   * @return The map size.
   */
  getPrintMapSize() {
    return this._printMapSize;
  }

  /**
   * Sets the map size to use while printing.
   *
   * @param printMapSize The object containing width and height of
   * printed map.
   */
  setPrintMapSize(printMapSize: any) {
    this._printMapSize = printMapSize;
  }

  /**
   * Whether this manager has been initiated or not.
   *
   * @return Whether this manager has been initiated or not.
   */
  isInitiated() {
    return this._initiated;
  }
}

export default BaseMapFishPrintManager;
