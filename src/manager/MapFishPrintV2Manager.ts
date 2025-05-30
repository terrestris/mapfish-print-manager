import {getCenter} from 'ol/extent';
import OlLayer from 'ol/layer/Layer';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceWMTS from 'ol/source/WMTS';

import MapFishPrintV2VectorSerializer from '../serializer/MapFishPrintV2VectorSerializer';
import MapFishPrintV2WMSSerializer from '../serializer/MapFishPrintV2WMSSerializer';

import Logger from '../util/Logger';
import Shared from '../util/Shared';

import BaseMapFishPrintManager, {BaseMapFishPrintManagerOpts} from './BaseMapFishPrintManager';

export type MapFishPrintV2ManagerOpts = BaseMapFishPrintManagerOpts & {};

export class MapFishPrintV2Manager extends BaseMapFishPrintManager {

  /**
   * The capabilities endpoint of the print service.
   */
  static INFO_JSON_ENDPOINT = 'info.json';

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
   * Calls the print servlet to create an output file in the requested format
   * and forces a download of the created output.
   *
   * Note: The manager has to be initialized prior this method's usage.
   *
   * @param forceDownload Whether to force a direct download of the
   *                      print result or to return the download url.
   * @return If forceDownload is set to false, the download
   *         url of the print result will be returned in a
   *         Promise.
   */
  async print(forceDownload?: boolean) {
    if (!(this.isInitiated())) {
      Logger.warn('The manager hasn\'t been initiated yet. Please call init() first.');
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
   * Sets the layout to use. Updates the print extent accordingly.
   *
   * @param name The name of the layout to use.
   */
  setLayout(name: string) {
    const layout = this.getLayouts().find(l => l.name === name);

    if (!layout) {
      Logger.warn(`No layout named '${name}' found.`);
      return;
    }

    this._layout = layout;

    this.setPrintMapSize({
      width: layout.map?.width ?? 0,
      height: layout.map?.height ?? 0
    });

    this.updatePrintExtent();

    this.dispatch('change:layout', layout);
  }

  /**
   * Serializes/encodes the legend payload for the given layer.
   *
   * @param layer The layer to serialize/encode the legend for.
   *
   * @return The serialized/encoded legend.
   */
  protected serializeLegend(layer: OlLayer): any {
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
   * Collects the payload that is required for the print call to the print
   * servlet.
   *
   * @return The print payload.
   */
  protected getPrintPayload() {
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

    return {
      units: mapProjection.getUnits(),
      srs: mapProjection.getCode(),
      layout: this.getLayout()?.name,
      outputFormat: this.getOutputFormat(),
      dpi: this.getDpi(),
      layers: serializedLayers,
      pages: [{
        center: getCenter(extentFeatureGeometry?.getExtent() || [0, 0, 0, 0]),
        scale: this.getScale(),
        rotation: this.calculateRotation() || 0
      }],
      legends: serializedLegends,
      ...this.customParams
    };
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
   * Initializes the manager instance. Typically called by subclasses via init().
   *
   * @param capabilities The capabilities to set.
   */
  protected initManager(capabilities: any) {
    this.capabilities = capabilities;

    this._layouts = this.capabilities.layouts;
    this._outputFormats = this.capabilities.outputFormats?.map((format: any) => format.name);
    this._dpis = this.capabilities.dpis?.map((dpi: any) => parseInt(dpi.value, 10));
    this._scales = this.capabilities.scales?.map((scale: any) => parseFloat(scale.value));

    this.setLayout(this.getLayouts()[0].name);
    this.setOutputFormat(this.getOutputFormats()[0]);
    this.setDpi(this.getDpis()[0]);
    this.setScale(this.getClosestScaleToFitMap());

    this.initPrintExtentLayer();
    this.initPrintExtentFeature();
    this.initTransformInteraction();

    this._initiated = true;
  }

  /**
   * Loads the print capabilities from the provided remote source.
   */
  protected async loadCapabilities(): Promise<any> {
    const response = await fetch(this.url + MapFishPrintV2Manager.INFO_JSON_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(response);

    return await response.json();
  }
}

export default MapFishPrintV2Manager;
