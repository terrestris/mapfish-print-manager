import _get from 'lodash/get';
import _isArray from 'lodash/isArray';
import _isNil from 'lodash/isNil';

import URL from 'url-parse';

import QueryString from 'query-string';

import OlLayer from 'ol/layer/Layer';
import { getCenter } from 'ol/extent';

import BaseMapFishPrintManager, { BaseMapFishPrintManagerOpts } from './BaseMapFishPrintManager';
import MapFishPrintV3GeoJsonSerializer from '../serializer/MapFishPrintV3GeoJsonSerializer';
import MapFishPrintV3OSMSerializer from '../serializer/MapFishPrintV3OSMSerializer';
import MapFishPrintV3TiledWMSSerializer from '../serializer/MapFishPrintV3TiledWMSSerializer';
import MapFishPrintV3WMSSerializer from '../serializer/MapFishPrintV3WMSSerializer';
import MapFishPrintV3WMTSSerializer from '../serializer/MapFishPrintV3WMTSSerializer';
import Shared from '../util/Shared';
import Logger from '../util/Logger';
import scales from '../config/scales';

export type V3CustomMapParams = {
  center?: number;
  dpi?: number;
  layers?: [OlLayer];
  projection?: string;
  rotation?: number;
  scale?: number;
  areaOfInterest?: any;
  bbox?: [number];
  useNearestScale?: boolean;
  dpiSensitiveStyle?: boolean;
  useAdjustBounds?: boolean;
  width?: number;
  longitudeFirst?: boolean;
  zoomToFeatures?: boolean;
  height?: number;
};

export type MapFishPrintV3ManagerOpts = BaseMapFishPrintManagerOpts & {
  /**
   * Custom parameters which can be additionally set on map to determine its
   * special handling while printing.
   *
   * Note: Properties of \{V3CustomMapParams\} marked as default will be handled by the manager itself
   * and don't need to be explicitly provided as customized params (s.
   * https://github.com/terrestris/mapfish-print-manager/blob/master/src/manager/MapFishPrintV3Manager.js#L416)
   *
   * Please refer to http://mapfish.github.io/mapfish-print-doc/attributes.html#!map
   * for further details.
   */
  customMapParams?: V3CustomMapParams;
};

/**
 * The MapFishPrintV3Manager.
 *
 * @class
 */
export class MapFishPrintV3Manager extends BaseMapFishPrintManager {

  /**
   * The capabilities endpoint of the print service.
   */
  static APPS_JSON_ENDPOINT: string = 'apps.json';

  /**
   * The capabilities endpoint of the print service.
   */
  static CAPABILITIES_JSON_ENDPOINT: string = 'capabilities.json';

  protected _customMapParams: V3CustomMapParams = {};

  /**
   * The supported print applications by the print service.
   */
  protected _printApps: string[] = [];

  /**
   * The currently selected print application.
   */
  protected _printApp?: string;

  /**
   * ID of currently started print job. Will be used while polling will be
   * performed.
   */
  protected _printJobReference: string | null = null;

  /**
   * The constructor
   */
  constructor(opts: MapFishPrintV3ManagerOpts) {
    super(opts);

    this._customMapParams = opts?.customMapParams ?? {};

    if (!this.serializers || this.serializers.length === 0) {
      this.serializers = [
        new MapFishPrintV3GeoJsonSerializer(),
        new MapFishPrintV3OSMSerializer(),
        new MapFishPrintV3TiledWMSSerializer(),
        new MapFishPrintV3WMSSerializer(),
        new MapFishPrintV3WMTSSerializer()
      ];
    }
  }

  /**
   * Initializes the manager.
   */
  async init(): Promise<void> {
    if (this.url && !this.capabilities) {
      const printApps = await this.loadPrintApps();
      this.setPrintApps(printApps);
      const defaultPrintApp = this.getPrintApps()[0];
      await this.setPrintApp(defaultPrintApp);
    } else if (!this.url && this.capabilities) {
      this.initManager(this.capabilities);
    }
  }

  /**
   * @param forceDownload
   */
  async print(forceDownload: boolean) {
    if (!(this.isInitiated())) {
      Logger.warn('The manager hasn\'t been initiated yet. Please call init() first.');
      return;
    }

    const payload = this.getPrintPayload();
    const createPrintJobUrl = `${this.url}${this.getPrintApp()}/report.${this.getOutputFormat()}`;
    const printResponse = await fetch(createPrintJobUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode,
      body: JSON.stringify(payload)
    });

    this.validateResponse(printResponse);

    const printResponseJson = await printResponse.json();

    const {
      ref,
      statusURL
    } = printResponseJson;

    const basePath = this.getBasePath();
    const fullStatusUrl = Shared.sanitizeUrl(basePath + statusURL);
    this._printJobReference = ref;

    try {
      const statusResponseJson = await this.pollUntilDone(fullStatusUrl, 1000, this.timeout);

      const status = statusResponseJson.status;

      if (status === 'finished') {
        const fullDownloadUrl = Shared.sanitizeUrl(basePath + statusResponseJson.downloadURL);

        if (forceDownload) {
          this.download(fullDownloadUrl);
        } else {
          return fullDownloadUrl;
        }
      }

      if (status === 'error') {
        throw new Error(`There was an error executing the job: ${statusResponseJson.error}`);
      }

      if (status === 'cancelled') {
        throw new Error('The job was cancelled.');
      }
    } finally {
      this._printJobReference = null;
    }
  }

  /**
   * Cancels current print job by id.
   *
   * @param id Print id to cancel.
   */
  async cancelPrint(id: string): Promise<void> {
    if (!id) {
      return;
    }

    const cancelPrintJobUrl = `${this.url}cancel/${id}`;

    const cancelPrintResponse = await fetch(cancelPrintJobUrl, {
      method: 'DELETE',
      headers: {
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(cancelPrintResponse);
  }

  /**
   * Returns all supported print applications.
   *
   * @return The supported print applications.
   */
  getPrintApps() {
    return this._printApps;
  }

  /**
   * Sets the supported print applications.
   *
   * @param printApps The supported print applications to set.
   */
  setPrintApps(printApps: string[]) {
    this._printApps = printApps;
  }

  /**
   * Returns the currently selected print application.
   *
   * @return The currently selected print application.
   */
  getPrintApp() {
    return this._printApp;
  }

  /**
   * Set custom map parmeters
   * @param params The parameters to set
   */
  setCustomMapParams(params: V3CustomMapParams) {
    this._customMapParams = params;
  }

  /**
   * Append (partial) map parameters
   * @param params The parameters to append
   */
  appendCustomMapParams(params: Partial<V3CustomMapParams>) {
    if (_isNil(this._customMapParams)) {
      this.setCustomMapParams(params);
      return;
    }
    this._customMapParams = {
      ...this._customMapParams,
      ...params
    };
  }

  /**
   * Returns the currently set custom map parameters
   */
  getCustomMapParams() {
    return this._customMapParams;
  }

  /**
   * Resets the currently set custom map parameters to an emtpy object
   */
  clearCustomMapParams() {
    this._customMapParams = {};
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

    const mapAttribute = this.getAttributeByName('map');

    this._dpis = _get(mapAttribute, 'clientInfo.dpiSuggestions');
    // set some defaults if not provided via capabilities
    if (!this._dpis) {
      this._dpis = [72, 150];
    }
    this.setDpi(this.getDpis()[0]);

    this.setPrintMapSize({
      width: _get(mapAttribute, 'clientInfo.width'),
      height: _get(mapAttribute, 'clientInfo.height')
    });

    this.updatePrintExtent();

    this.dispatch('change:layout', layout);
  }

  /**
   * Sets the print application to use.
   * For each print app the appropriate capabilities will be load and the
   * manager will be initialized afterwards.
   *
   * @param printAppName The name of the application to use.
   */
  setPrintApp = async (printAppName: string) => {
    const printApps = this.getPrintApps();
    const printApp = _isArray(printApps) ? this.getPrintApps().find(pa => pa === printAppName) : undefined;

    if (!printApp) {
      Logger.warn(`No print application named '${printAppName}' found.`);
      return;
    }

    this._printApp = printApp;

    this.dispatch('change:app', printApp);

    // reinit print manager with capabilities from set app
    const appCapabilities = await this.loadAppCapabilities(printApp);

    this.initManager(appCapabilities);
  };

  getPrintJobReference() {
    return this._printJobReference;
  }

  /**
   * @param capabilities
   */
  protected initManager(capabilities: any) {
    this.capabilities = capabilities;

    this._layouts = capabilities.layouts;
    this._outputFormats = capabilities.formats;

    this.setLayout(this.getLayouts()[0].name);
    this.setOutputFormat(this.getOutputFormats()[0]);

    // mapfish3 doesn't provide scales via capabilities, so we get them from
    // initialized manager if set or set some most common used values here
    // manually as fallback
    if (this.customPrintScales && this.customPrintScales.length > 0) {
      this._scales = this.customPrintScales;
    } else {
      this._scales = scales;
    }
    this.setScale(this.getClosestScaleToFitMap());

    this.initPrintExtentLayer();
    this.initPrintExtentFeature();
    this.initTransformInteraction();

    this._initiated = true;

    return this.isInitiated();
  }

  /**
   * Returns attribute value contained in currently chosen layout by its name.
   *
   * @param attributeName The attribute name (key) to be searched.
   *
   * @return Obtained attribute value.
   */
  protected getAttributeByName(attributeName: string) {
    const layoutName = this.getLayout()?.name;

    if (!layoutName) {
      return;
    }

    const layout = this.getLayoutByName(layoutName);
    const layoutAttributes = layout?.attributes;
    return layoutAttributes?.find((layoutAttribute: any) => {
      return layoutAttribute.name === attributeName;
    });
  }

  /**
   * Returns an object containing configuration for layout based on its name
   *
   * @param layoutName Layout name.
   *
   * @return Layout configuration object.
   */
  protected getLayoutByName(layoutName: string) {
    const layouts = this.getLayouts();
    return layouts.find(layout => layout.name === layoutName);
  }

  /**
   * Returns all available print applications.
   *
   * @return Promise containing available print apps.
   */
  protected async loadPrintApps(): Promise<string[]> {
    const printAppResponse = await fetch(`${this.url}${MapFishPrintV3Manager.APPS_JSON_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(printAppResponse);
    return await printAppResponse.json();
  }

  /**
   * Loads the print capabilities from the provided remote source.
   */
  protected async loadAppCapabilities(printApp: string) {
    const capEndpoint = MapFishPrintV3Manager.CAPABILITIES_JSON_ENDPOINT;
    const url = `${this.url}${printApp}/${capEndpoint}`;

    const appCapabilitiesResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(appCapabilitiesResponse);
    return await appCapabilitiesResponse.json();
  }

  /**
   * Determine the base path the application is running
   * @return The base host path
   */
  protected getBasePath() {
    if (!this.url) {
      return;
    }
    const baseUrlObj = new URL(this.url, undefined, QueryString.parse);
    return `${baseUrlObj.protocol}//${baseUrlObj.host}${baseUrlObj.pathname}`;
  }

  protected async pollUntilDone(url: string, interval: number, timeout: number): Promise<any> {
    return this.poll(
      () => this.getStatus(url),
      responseJson => ['waiting', 'running'].includes(responseJson.status),
      interval,
      timeout
    );
  }

  protected async getStatus(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(response);
    return await response.json();
  }

  protected async poll<T = any,>(fn: () => Promise<T>, fnCondition: (res?: T) => boolean,
    interval: number = 1000, timeout: number = 30000) {
    let start = Date.now();
    let result = await fn();

    while (fnCondition(result)) {
      if (timeout > 0 && Date.now() - start > timeout) {
        break;
      }

      await this.wait(interval);
      result = await fn();
    }

    return result;
  };

  protected async wait(interval: number) {
    return new Promise(resolve => {
      setTimeout(resolve, interval);
    });
  };

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
      }, []).reverse();

    const serializedLegends = mapLayers
      .filter(this.filterPrintableLegend.bind(this))
      .reduce((acc: any[], layer) => {
        const serializedLegend = this.serializeLegend(layer);
        if (serializedLegend) {
          acc.push(serializedLegend);
        }
        return acc;
      }, []).reverse();

    return {
      layout: this.getLayout()?.name,
      attributes: {
        map: {
          center: getCenter(extentFeatureGeometry?.getExtent() || [0, 0, 0, 0]),
          dpi: this.getDpi(),
          layers: serializedLayers,
          projection: mapProjection.getCode(),
          rotation: this.calculateRotation() || 0,
          scale: this.getScale(),
          ...this._customMapParams
        },
        legend: {
          classes: serializedLegends
        },
        ...this.customParams
      }
    };
  }
}

export default MapFishPrintV3Manager;
