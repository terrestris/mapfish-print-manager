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
import { containsExtent, getCenter, getSize } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import OlStyleStyle from 'ol/style/Style';
import OlStyleFill from 'ol/style/Fill';
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import {DEVICE_PIXEL_RATIO} from 'ol/has';

import InteractionTransform, { OlInteractionTransformOpts } from '../interaction/InteractionTransform';

import Shared from '../util/Shared';
import Logger from '../util/Logger';

import Observable from '../observable/Observable';

import BaseSerializer from '../serializer/BaseSerializer';

export type PrintMapSize = {
  width: number;
  height: number;
};

export type Layout = {
  name: string;
  attributes: any[];
};

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
  extentLayer?: OlLayerVector<OlFeature>;
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
  transformOpts?: OlInteractionTransformOpts;
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
  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a layer for print or not.
   */
  layerFilter?: (layer: OlLayer) => boolean;
  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a legend of a layer for print or not.
   */
  legendFilter?: (layer: OlLayer) => boolean;
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

  protected map: OlMap;

  protected url?: string;

  protected capabilities?: any;

  protected method: 'GET' | 'POST';

  protected headers?: {
    [key: string]: string;
  };

  protected credentialsMode: RequestCredentials;

  protected customParams?: any;

  protected extentLayer?: OlLayerVector<OlFeature>;

  protected maskColor: string;

  protected transformOpts?: OlInteractionTransformOpts;

  protected customPrintScales?: number[];

  protected timeout: number;

  protected serializers: BaseSerializer[] = [];

  protected layerFilter: (layer: OlLayer) => boolean;

  protected legendFilter: (layer: OlLayer) => boolean;

  /**
   * The supported layouts by the print service.
   */
  protected _layouts: Layout[] = [];

  /**
   * The supported output formats by the print service.
   */
  protected _outputFormats: string[] = [];

  /**
   * The supported DPIs by the print service.
   */
  protected _dpis: number[] = [];

  /**
   * The supported scales by the print service.
   */
  protected _scales: number[] = [];

  /**
   * The currently selected layout.
   */
  protected _layout?: Layout;

  /**
   * The currently selected output format.
   */
  protected _outputFormat?: string;

  /**
   * The currently selected dpi.
   */
  protected _dpi?: number;

  /**
   * The currently selected scale.
   */
  protected _scale?: number;

  /**
   * The currently set map size defined with its width and height.
   */
  protected _printMapSize?: PrintMapSize;

  /**
   * Whether this manger has been initiated or not.
   */
  protected _initiated: boolean = false;

  /**
   * Feature representing the page extent.
   */
  protected _extentFeature?: OlFeature<OlGeomPolygon>;

  constructor(opts: BaseMapFishPrintManagerOpts) {
    super();

    this.map = opts.map;
    this.url = opts.url;
    this.capabilities = opts.capabilities;
    this.method = opts.method ? opts.method : 'POST';
    this.headers = opts.headers || {};
    this.credentialsMode = opts.credentialsMode ? opts.credentialsMode : 'same-origin';
    this.customParams = opts.customParams || {};
    this.extentLayer = opts.extentLayer;
    this.maskColor = opts.maskColor ? opts.maskColor : 'rgba(130, 130, 130, 0.5)';
    this.transformOpts = opts.transformOpts;
    this.customPrintScales = opts.customPrintScales || [];
    this.timeout = opts.timeout ? opts.timeout : 30000;
    this.serializers = opts.serializers ? opts.serializers : [];
    this.layerFilter = opts.layerFilter || (() => true);
    this.legendFilter = opts.legendFilter || (() => true);

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
   * Returns the closest scale to fit the print feature's extent into the
   * current extent of the map.
   */
  getClosestScaleToFitMap() {
    const mapView = this.map.getView();
    const mapExtent = mapView.calculateExtent();
    const scales = this.getScales();
    let fitScale = scales[0];

    scales.forEach(scale => {
      const printExtent = this.calculatePrintExtent(scale);

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
   * Updates the geometry of the print extent feature to match the current scale.
   */
  updatePrintExtent() {
    const printExtent = this.calculatePrintExtent();
    if (this._extentFeature && printExtent) {
      this._extentFeature.setGeometry(fromExtent(printExtent));
    }
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
   * @param rotation The amount to rotate.
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
   * Returns the currently selected layout.
   *
   * @return The currently selected layout.
   */
  getLayout() {
    return this._layout;
  }

  /**
   * Returns the currently selected output format.
   *
   * @return The currently selected output format.
   */
  getOutputFormat() {
    return this._outputFormat;
  }

  /**
   * Returns the extent layer.
   *
   * @return The extent layer.
   */
  getExtentLayer() {
    return this.extentLayer;
  }

  /**
   * Sets the output format to use.
   *
   * @param name The name of the output format to use.
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
  getDpi() {
    return this._dpi;
  }

  /**
   * Sets the dpi to use.
   *
   * @param value The value of the dpi to use.
   */
  setDpi = (value: number) => {
    const dpi = this.getDpis().find(d => d === value);

    if (!dpi) {
      Logger.warn(`No dpi with value '${value}' found.`);
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
   * @param value The value of the scale to use.
   */
  setScale(value: number) {
    const scale = this.getScales().find(s => s === value);

    if (!scale) {
      Logger.warn(`No scale with value '${value}' found.`);
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
   *                     printed map.
   */
  setPrintMapSize(printMapSize: PrintMapSize) {
    this._printMapSize = printMapSize;
  }

  /**
   * Sets the custom params.
   *
   * @param params The params to set.
   */
  setCustomParams(params: any) {
    this.customParams = params;
  }

  /**
   * Returns the custom params.
   *
   * @returns The custom params
   */
  getCustomParams() {
    return this.customParams;
  }

  /**
   * Sets an individual custom param.
   *
   * @param key The key of the param.
   * @param value The value of the param.
   */
  setCustomParam(key: string, value: any) {
    this.customParams[key] = value;
  }

  /**
   * Returns an individual custom param.
   *
   * @param key The custom param to get.
   *
   * @returns The custom param
   */
  getCustomParam(key: string) {
    return this.customParams[key];
  }

  /**
   * Whether this manager has been initiated or not.
   *
   * @return Whether this manager has been initiated or not.
   */
  isInitiated() {
    return this._initiated;
  }

  /**
   * Setter for legend filter
   * @param filterFn The new legend filter function
   */
  setLegendFilter(filterFn: (layer: OlLayer) => boolean) {
    this.legendFilter = filterFn;
  }

  /**
   * Validates the given HTTP fetch response.
   *
   * @param response The response to validate.
   */
  protected validateResponse(response: Response): void {
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
  protected initPrintExtentLayer() {
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
   * @param olEvt The ol render event.
   */
  protected onExtentLayerPreRender(olEvt: OlRenderEvent) {
    const ctx = olEvt.context;

    if (!(ctx instanceof CanvasRenderingContext2D)) {
      return;
    }

    ctx.save();
  }

  /**
   * Called on the extentLayer's `postrender` event.
   *
   * @param olEvt The ol render event.
   */
  protected onExtentLayerPostRender(olEvt: OlRenderEvent) {
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

    const A = this.map.getPixelFromCoordinate(coords[1]).map(el => el * DEVICE_PIXEL_RATIO);
    const B = this.map.getPixelFromCoordinate(coords[4]).map(el => el * DEVICE_PIXEL_RATIO);
    const C = this.map.getPixelFromCoordinate(coords[3]).map(el => el * DEVICE_PIXEL_RATIO);
    const D = this.map.getPixelFromCoordinate(coords[2]).map(el => el * DEVICE_PIXEL_RATIO);

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
  protected initPrintExtentFeature() {
    const printExtent = this.calculatePrintExtent();

    if (!printExtent) {
      return;
    }

    const extentFeature = new OlFeature(fromExtent(printExtent));
    const extentLayerSource = this.extentLayer?.getSource();

    if (!extentLayerSource) {
      return;
    }

    if (!this._extentFeature) {
      this._extentFeature = extentFeature;
    } else {
      this._extentFeature.setGeometry(fromExtent(printExtent));
    }

    extentLayerSource.clear();
    extentLayerSource.addFeature(this._extentFeature);

    return this._extentFeature;
  }

  /**
   * Initializes the transform interaction.
   */
  protected initTransformInteraction() {
    if (
      Shared.getInteractionsByName(
        this.map,
        BaseMapFishPrintManager.TRANSFORM_INTERACTION_NAME
      ).length === 0
    ) {
      const transform = new InteractionTransform({
        features: this._extentFeature ? [this._extentFeature] : undefined,
        translateFeature: true,
        translate: true,
        stretch: false,
        scale: true,
        rotate: true,
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
  protected onTransformScaling() {
    const scale = this.getClosestScaleToFitExtentFeature();

    if (!scale) {
      return;
    }

    this.setScale(scale);
  }

  /**
   * Returns the closest scale to current print feature's extent.
   */
  protected getClosestScaleToFitExtentFeature() {
    const scales = this.getScales();
    const printFeatureExtent = this._extentFeature?.getGeometry()?.getExtent();

    if (!printFeatureExtent) {
      return;
    }

    const printFeatureSize = getSize(printFeatureExtent);
    let closest = Number.POSITIVE_INFINITY;
    let fitScale = scales[0];

    scales.forEach(scale => {
      const printScaleExtent = this.calculatePrintExtent(scale);

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
   * Checks if a given layer should be printed.
   *
   * @param layer The layer to check.
   *
   * @return Whether the layer should be printed or not.
   */
  protected filterPrintableLayer(layer: OlLayer) {
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
  protected filterPrintableLegend(layer: OlLayer): boolean {
    return (
      layer !== this.extentLayer &&
      layer.getVisible() &&
      this.legendFilter(layer)
    );
  }

  /**
   * Calculates the current rotation of the print extent feature.
   */
  protected calculateRotation() {
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
   * Calculates the extent based on a scale.
   *
   * @param scale The scale to calculate the extent for. If not given,
   *              the current scale of the provider will be used.
   *
   * @return The extent.
   */
  protected calculatePrintExtent(scale?: number) {
    const printMapSize = this.getPrintMapSize();
    const printScale = scale || this.getScale();

    if (!printMapSize || !printScale) {
      return;
    }

    const {
      width,
      height
    } = this.getPrintExtentSize(printMapSize, printScale);
    const extentGeometry = this._extentFeature?.getGeometry();

    let center: OlCoordinate;
    if (extentGeometry) {
      center = getCenter(extentGeometry.getExtent());
    } else {
      center = this.map.getView().getCenter() || [0, 0];
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
  protected getPrintExtentSize(printMapSize: PrintMapSize, printScale: number): PrintMapSize {
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
  protected download(url: string) {
    if (/Opera|OPR\//.test(navigator.userAgent)) {
      window.open(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Serializes/encodes the given layer.
   *
   * @param layer The layer to serialize/encode.
   *
   * @return The serialized/encoded layer.
   */
  protected serializeLayer(layer: OlLayer) {
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
   * @param layer The layer to serialize/encode the legend for.
   *
   * @return The serialized/encoded legend.
   */
  protected serializeLegend(layer: OlLayer) {
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
        icons: [
          Shared.getLegendGraphicUrl(layer) !== ''
            ? Shared.getLegendGraphicUrl(layer)
            : undefined
        ]
      };
    }
  }
}

export default BaseMapFishPrintManager;
