import OlSource from 'ol/source/Source';
import OlSourceOSM from 'ol/source/OSM';
import OlLayer from 'ol/layer/Layer';

import defaultsDeep from 'lodash/defaultsDeep';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV3OSMSerializer.
 *
 * @class
 */
export class MapFishPrintV3OSMSerializer extends BaseSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {string}
   */
  static TYPE_OSM = 'osm';

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
    return source instanceof OlSourceOSM;
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
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'png',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      rasterStyle: undefined,
      tileSize: [256, 256]
    });

    const source = /** @type {OlSourceOSM} */(layer.getSource());

    if (!this.validateSource(source)) {
      return;
    }

    const tileGrid = source.getTileGrid();
    const tileGridResolutions = tileGrid.getResolutions() || [];

    const serialized = {
      ...{
        name: layer.get('name'),
        opacity: layer.getOpacity(),
        resolutions: tileGridResolutions,
        type: MapFishPrintV3OSMSerializer.TYPE_OSM
      },
      ...opts
    };

    return serialized;
  }
}

export default MapFishPrintV3OSMSerializer;
