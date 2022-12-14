import {Extent as OlExtent, getCenter} from 'ol/extent';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlLayer from 'ol/layer/Layer';
import {Coordinate as OlCoordinate} from 'ol/coordinate';

import BaseMapFishPrintManager, { BaseMapFishPrintManagerOpts } from './BaseMapFishPrintManager';
import MapFishPrintV2WMSSerializer from '../serializer/MapFishPrintV2WMSSerializer';
import MapFishPrintV2VectorSerializer from '../serializer/MapFishPrintV2VectorSerializer';
import Shared from '../util/Shared';
import Log from '../util/Logger';

export type MapFishPrintV2ManagerOpts = BaseMapFishPrintManagerOpts & {};

/**
 * The MapFishPrintV2Manager.
 *
 * @class
 */
export class MapFishPrintV2Manager extends BaseMapFishPrintManager {

  /**
   * The capabilities endpoint of the print service.
   */
  static INFO_JSON_ENDPOINT: string = 'info.json';

  /**
   * The constructor
   */
  constructor(opts: MapFishPrintV2ManagerOpts) {
    super(opts);

    if (!this.serializers || this.serializers.length === 0) {
      this.serializers = [
        new MapFishPrintV2WMSSerializer(),
        new MapFishPrintV2VectorSerializer()
      ];
    }
  }

  /**
   * Initializes the manager.
   */
  async init(): Promise<void> {
    if (!this.url && this.capabilities) {
      this.initManager(this.capabilities);
    } else if (this.url && !this.capabilities) {
      const json = await this.loadCapabilities();
      this.initManager(json);
    }
  }

  /**
   * Initializes the manager instance. Typically called by subclasses via init().
   *
   * @param capabilities The capabilities to set.
   */
  initManager(capabilities: any) {
    this.capabilities = capabilities;

    this._layouts = this.capabilities.layouts;
    this._outputFormats = this.capabilities.outputFormats;
    this._dpis = this.capabilities.dpis;
    this._scales = this.capabilities.scales;

    this.setLayout(this.getLayouts()[0].name);
    this.setOutputFormat(this.getOutputFormats()[0].name);
    this.setDpi(this.getDpis()[0].name);
    this.setScale(this.getClosestScaleToFitMap().name);

    this.initPrintExtentLayer();
    this.initPrintExtentFeature();
    this.initTransformInteraction();

    this._initiated = true;
  }

  /**
   * Loads the print capabilities from the provided remote source.
   */
  async loadCapabilities(): Promise<any> {
    const response = await fetch(this.url + MapFishPrintV2Manager.INFO_JSON_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(response);

    const responseJson = await response.json();

    return responseJson;
  }

  /**
   * Calls the print servlet to create a output file in the requested format
   * and forces a download of the created output.
   *
   * Note: The manager has to been initialized prior this method's usage.
   *
   * @param forceDownload Whether to force a direct download of the
   *                      print result or to return the download url.
   * @return If forceDownload is set to false, the download
   *         url of the print result will be returned in a
   *         Promise.
   */
  async print(forceDownload?: boolean) {
    if (!(this.isInitiated())) {
      Log.warn('The manager hasn\'t been initiated yet. Please call init() first.');
      return;
    }

    const payload = this.getPrintPayload();

    if (this.method === 'GET') {
      const url = `${this.capabilities.printURL}?spec=${encodeURIComponent(JSON.stringify(payload))}`;
      if (forceDownload) {
        this.download(url);
      } else {
        return url;
      }
    } else {
      const response = await fetch(this.capabilities.createURL, {
        method: this.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        credentials: this.credentialsMode,
        body: JSON.stringify(payload)
      });

      this.validateResponse(response);

      const responseJson = await response.json();

      const url: string = responseJson.getURL;

      if (!forceDownload) {
        return url;
      }

      this.download(url);
    }
  }

  /**
   * Collects the payload that is required for the print call to the print
   * servlet.
   *
   * @return The print payload.
   */
  getPrintPayload(): any {
    const mapView = this.map.getView();
    const mapProjection = mapView.getProjection();
    const mapLayers = Shared.getMapLayers(this.map);
    const extentFeatureGeometry = this._extentFeature?.getGeometry();

    const serializedLayers = mapLayers
      .filter(this.filterPrintableLayer.bind(this))
      .reduce((acc: any[], layer) => {
        const serializedLayer = this.serializeLayer(layer);
        if (serializedLayer) {
          acc.push(serializedLayer);
        }
        return acc;
      }, []);

    const serializedLegends = mapLayers
      .filter(this.filterPrintableLegend.bind(this))
      .reduce((acc: any[], layer) => {
        const serializedLegend = this.serializeLegend(layer);
        if (serializedLegend) {
          acc.push(serializedLegend);
        }
        return acc;
      }, []);

    const payload = {
      units: mapProjection.getUnits(),
      srs: mapProjection.getCode(),
      layout: this.getLayout().name,
      outputFormat: this.getOutputFormat().name,
      dpi: this.getDpi().value,
      layers: serializedLayers,
      pages: [{
        center: getCenter(extentFeatureGeometry?.getExtent() || [0, 0, 0, 0]),
        scale: this.getScale().value,
        rotation: this.calculateRotation() || 0
      }],
      legends: serializedLegends,
      ...this.customParams
    };

    return payload;
  }

  /**
   * Serializes/encodes the legend payload for the given layer.
   *
   * @param layer The layer to serialize/encode the legend for.
   *
   * @return The serialized/encoded legend.
   */
  serializeLegend(layer: OlLayer): any {
    const source = layer.getSource();
    if (source instanceof OlSourceTileWMS ||
      source instanceof OlSourceImageWMS ||
      source instanceof OlSourceWMTS) {
      return {
        name: layer.get('name') || (!(source instanceof OlSourceWMTS) && source.getParams().LAYERS) || '',
        classes: [{
          name: '',
          icons: [Shared.getLegendGraphicUrl(layer)]
        }]
      };
    }
  }

  /**
   * Called on translate interaction's `scaling` event.
   */
  onTransformScaling() {
    const scale = this.getClosestScaleToFitExtentFeature();
    this.setScale(scale.name);
  }

  /**
   * Calculates the extent based on a scale.
   * Overrides the method from base class.
   *
   * @param scale The scale to calculate the extent for. If not given,
   *              the current scale of the provider will be used.
   * @return The extent.
   */
  calculatePrintExtent(scale?: number): OlExtent {
    const printMapSize = this.getLayout().map;
    const printScale = scale || this.getScale().value;
    const {
      width,
      height
    } = this.getPrintExtentSize(printMapSize, printScale);

    let center: OlCoordinate;
    const geom = this._extentFeature?.getGeometry();
    if (geom) {
      center = getCenter(geom.getExtent());
    } else {
      center = this.map.getView().getCenter() || [0, 0];
    }

    return [
      center[0] - (width / 2),
      center[1] - (height / 2),
      center[0] + (width / 2),
      center[1] + (height / 2)
    ];
  }

  /**
   * Sets the output format to use.
   * Overrides the method from base class.
   *
   * @param name The name of the output format to use.
   */
  setOutputFormat(name: string) {
    const format = this.getOutputFormats().find(f => f.name === name);

    if (!format) {
      Log.warn(`No output format named '${name}' found.`);
      return;
    }

    this._outputFormat = format;

    this.dispatch('change:outputformat', format);
  }

  /**
   * Sets the scale to use. Updates the print extent accordingly.
   * Overrides the method from base class.
   *
   * @param {string} name The name of the scale to use.
   */
  setScale = (name: string) => {
    const scale = this.getScales().find(s => s.name === name);

    if (!scale) {
      Log.warn(`No scale named '${name}' found.`);
      return;
    }

    this._scale = scale;

    this.updatePrintExtent();

    this.dispatch('change:scale', scale);
  };
}

export default MapFishPrintV2Manager;
