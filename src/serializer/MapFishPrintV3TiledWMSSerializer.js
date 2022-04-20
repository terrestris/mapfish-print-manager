import OlSource from 'ol/source/Source';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayer from 'ol/layer/Layer';

import defaultsDeep from 'lodash/defaultsDeep';

import MapFishPrintV3WMSSerializer from './MapFishPrintV3WMSSerializer';

/**
 * The MapFishPrintV3TiledWMSSerializer.
 *
 * @class
 */
export class MapFishPrintV3TiledWMSSerializer extends MapFishPrintV3WMSSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {string}
   */
  static TYPE_WMS = 'tiledwms';

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
    return source instanceof OlSourceTileWMS;
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
  serialize(layer, opts = {}, viewResolution) {
    defaultsDeep(opts, {
      tileSize: [512, 512]
    });

    const source = layer.getSource();

    if (!this.validateSource(source)) {
      return;
    }

    return {
      ...super.serialize(layer, opts, viewResolution),
      ...{
        type: MapFishPrintV3TiledWMSSerializer.TYPE_WMS
      },
      ...opts
    };
  }
}

export default MapFishPrintV3TiledWMSSerializer;
