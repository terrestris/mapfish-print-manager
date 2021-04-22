import OlSourceOSM from 'ol/source/OSM';

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
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [
    OlSourceOSM
  ];

  /**
   * The constructor
   */
  constructor() {
    super(arguments);
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode.
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, opts = {}) {
    defaultsDeep(opts, {
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'png',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      rasterStyle: undefined,
      resolutions: [],
      tileSize: [256, 256]
    });

    const source = layer.getSource();
    const tileGrid = source.getTileGrid();
    const tileGridResolutions = tileGrid.getResolutions();

    if (!this.validateSource(source)) {
      return;
    }

    const serialized = {
      ...{
        name: layer.get('name'),
        opacity: layer.getOpacity(),
        type: this.constructor.TYPE_OSM,
        resolutions: serialized.resolutions.length === 0 ? tileGridResolutions : serialized.resolutions
      },
      ...opts
    };

    return serialized;
  }
}

export default MapFishPrintV3OSMSerializer;
