import OlSource from 'ol/source/Source';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayer from 'ol/layer/Layer';

import defaultsDeep from 'lodash/defaultsDeep';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV3WMSSerializer.
 *
 * @class
 */
export class MapFishPrintV3WMSSerializer extends BaseSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {string}
   */
  static TYPE_WMS = 'wms';

  /**
   * The constructor
   */
  constructor() {
    super();
  }

  /**
   * @param {OlSource} source
   * @return {boolean}
   */
  canSerialize(source) {
    return source instanceof OlSourceImageWMS || source instanceof OlSourceTileWMS;
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @abstract
   * @param {OlLayer} layer The layer to serialize/encode.
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format. Only
   *   used in V3.
   * @param {number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, opts = {}, viewResolution) { // eslint-disable-line no-unused-vars
    defaultsDeep(opts, {
      failOnError: false,
      mergeableParams: [],
      method: 'GET',
      rasterStyle: undefined,
      // One of MAPSERVER, GEOSERVER, QGISSERVER
      serverType: undefined,
      useNativeAngle: false
    });

    const source = /** @type {OlSourceImageWMS | OlSourceTileWMS} */ (layer.getSource());

    if (!this.validateSource(source)) {
      return;
    }

    const layers = source.getParams().LAYERS;
    const layersArray = layers ? layers.split(',') : [''];
    const styles = source.getParams().STYLES;
    const stylesArray = styles ? styles.split(',') : [''];

    const {
      LAYERS,
      STYLES,
      VERSION,
      WIDTH,
      HEIGHT,
      FORMAT,
      BBOX,
      CRS,
      SRS,
      ...customParams
    } = source.getParams();

    const baseUrl = source instanceof OlSourceImageWMS ? source.getUrl() : source.getUrls()[0];

    return {
      ...{
        baseURL: baseUrl,
        customParams,
        imageFormat: source.getParams().FORMAT || 'image/png',
        layers: layersArray,
        name: layer.get('name'),
        opacity: layer.getOpacity(),
        styles: stylesArray,
        version: source.getParams().VERSION || '1.1.0',
        type: MapFishPrintV3WMSSerializer.TYPE_WMS
      },
      ...opts
    };
  }
}

export default MapFishPrintV3WMSSerializer;
