import _get from 'lodash/get';
import _isArray from 'lodash/isArray';

import URL from 'url-parse';

import QueryString from 'query-string';

import OlLayer from 'ol/layer/Layer';
import {
  getCenter
} from 'ol/extent';

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

  customMapParams: V3CustomMapParams = {};

  /**
   * The supported print applications by the print service.
   *
   * @private
   */
  _printApps: any[] = [];

  /**
   * The currently selected print application.
   *
   * @private
   */
  _printApp: any = {};

  /**
   * ID of currently started print job. Will be used while polling will be
   * performed.
   *
   * @private
   */
  _printJobReference: string | null = null;

  /**
   * The constructor
   */
  constructor(opts: MapFishPrintV3ManagerOpts) {
    super(opts);

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

      this.setPrintApp(defaultPrintApp);
    } else if (!this.url && this.capabilities) {
      this.initManager(this.capabilities);
    }
  }

  /**
   * @param {*} capabilities
   */
  initManager(capabilities: any) {
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
   * @param layoutName Name of currently chosen layout.
   *
   * @return {*} Obtained attribute value.
   */
  getAttributeByName(attributeName: string, layoutName: string = this.getLayout().name): any {
    const layout = this.getLayoutByName(layoutName);
    const layoutAttributes = layout.attributes;

    const attribute = layoutAttributes.find((layoutAttribute: any) => {
      return layoutAttribute.name === attributeName;
    });

    return attribute;
  }

  /**
   * Returns an object containing configuration for layout based on its name
   *
   * @param layoutName Layout name.
   *
   * @return Layout configuration object.
   */
  getLayoutByName(layoutName: string): any {
    const layouts = this.getLayouts();

    return layouts.find(layout => layout.name === layoutName);
  }

  /**
   * Returns all available print applications.
   *
   * @return {Promise} Promise containing available print apps.
   */
  async loadPrintApps(): Promise<any> {
    const printAppResponse = await fetch(`${this.url}${MapFishPrintV3Manager.APPS_JSON_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(printAppResponse);

    const printAppResponseJson = await printAppResponse.json();

    return printAppResponseJson;
  }

  /**
   * Loads the print capabilities from the provided remote source.
   */
  async loadAppCapabilities(printApp: any) {
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

    const appCapabilitiesResponseJson = await appCapabilitiesResponse.json();

    return appCapabilitiesResponseJson;
  }

  /**
   * Determine the base path the application is running
   * @return The base host path
   */
  getBasePath() {
    if (!this.url) {
      return;
    }
    const baseUrlObj = new URL(this.url, undefined, QueryString.parse);
    const baseHost = `${baseUrlObj.protocol}//${baseUrlObj.host}${baseUrlObj.pathname}`;
    return baseHost;
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
      const downloadUrl = await this.pollUntilDone.call(this, fullStatusUrl, 1000, this.timeout);

      const fullDownloadUrl = Shared.sanitizeUrl(basePath + downloadUrl);

      if (forceDownload) {
        this.download(fullDownloadUrl);
      } else {
        return fullDownloadUrl;
      }
    } finally {
      this._printJobReference = null;
    }
  }

  async pollUntilDone(url: string, interval: number, timeout: number): Promise<any> {
    // let start = Date.now();

    this.poll(
      () => this.getStatus(url),
      responseJson => {
        return false;
        // const status = responseJson.status;
        // if (status === 'finished') {
        //   return responseJson.downloadURL;
        // } else if (status === 'error') {
        //   throw new Error(`There was an error executing the job: ${responseJson.error}`);
        // } else if (status === 'cancelled') {
        //   throw new Error('The job was cancelled.');
        // } else if (['waiting', 'running'].includes(status)) {
        //   if (timeout !== 0 && Date.now() - start > timeout) {
        //     throw new Error('timeout error on pollUntilDone');
        //   }
        // }
      },
      interval,
      this.timeout
    );

    // const run = async () => {
    //   const response = await fetch(url, {
    //     method: 'GET',
    //     headers: {
    //       ...this.headers
    //     },
    //     credentials: this.credentialsMode
    //   });

    //   this.validateResponse(response);

    //   const responseJson = await response.json();

    //   const status = responseJson.status;
    //   if (status === 'finished') {
    //     return responseJson.downloadURL;
    //   } else if (status === 'error') {
    //     throw new Error(`There was an error executing the job: ${responseJson.error}`);
    //   } else if (status === 'cancelled') {
    //     throw new Error('The job was cancelled.');
    //   } else if (['waiting', 'running'].includes(status)) {
    //     if (timeout !== 0 && Date.now() - start > timeout) {
    //       throw new Error('timeout error on pollUntilDone');
    //     } else {
    //       return new Promise(resolve => {
    //         setTimeout(resolve, interval);
    //       }).then(run.bind(this));
    //     }
    //   }
    // };

    // return run.call(this);
  }

  async getStatus(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.headers
      },
      credentials: this.credentialsMode
    });

    this.validateResponse(response);

    const responseJson = await response.json();

    return responseJson;
  }

  async poll<T = any, >(fn: () => Promise<T>, fnCondition: (res?: T) => boolean,
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

  async wait(interval: number) {
    return new Promise(resolve => {
      setTimeout(resolve, interval);
    });
  };

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

    const payload = {
      layout: this.getLayout().name,
      attributes: {
        map: {
          center: getCenter(extentFeatureGeometry?.getExtent() || [0, 0, 0, 0]),
          dpi: this.getDpi(),
          layers: serializedLayers,
          projection: mapProjection.getCode(),
          rotation: this.calculateRotation() || 0,
          scale: this.getScale(),
          ...this.customMapParams
        },
        legend: {
          classes: serializedLegends
        },
        ...this.customParams
      }
    };
    return payload;
  }

  /**
   * Returns all supported print applications.
   *
   * @return {Array} The supported print applications.
   */
  getPrintApps(): Array<any> {
    return this._printApps;
  }

  /**
   * Sets the supported print applications.
   *
   * @param {Array} printApps The supported print applications to set.
   */
  setPrintApps(printApps: Array<any>) {
    this._printApps = printApps;
  }

  /**
   * Returns the currently selected print application.
   *
   * @return {string} The currently selected print application.
   */
  getPrintApp(): string {
    return this._printApp;
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
   * @param {string} printAppName The name of the application to use.
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

    // return Promise.resolve(true);

    // Logger.error(error);
    // Promise.reject(new Error(`${error.message}`));
  };

  /**
   * Sets the dpi to use.
   *
   * @param value The value of the dpi to use.
   */
  setDpi = (value: number | string) => {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    const dpi = this.getDpis().find(d => d === value);

    if (!dpi) {
      Logger.warn(`No dpi '${value}' found.`);
      return;
    }

    this._dpi = dpi;

    this.dispatch('change:dpi', dpi);
  };
}

export default MapFishPrintV3Manager;
