import OlLayer from 'ol/layer/Layer';
import OlSource from 'ol/source/Source';
import OlSourceStamen from 'ol/source/Stamen';
import MapFishPrintV3OSMSerializer from './MapFishPrintV3OSMSerializer';

/**
 * The MapFishPrintV3StamenSerializer.
 *
 * @class
 */
export class MapFishPrintV3StamenSerializer extends MapFishPrintV3OSMSerializer {

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
    return source instanceof OlSourceStamen;
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @abstract
   * @param {OlLayer} layer The layer to serialize/encode.
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format.
   * @param {number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, opts = {}, viewResolution) {
    const source = /** @type {OlSourceStamen} */ (layer.getSource());

    if (!this.validateSource(source)) {
      return;
    }

    return {
      ...super.serialize(layer, opts, viewResolution),
      ...{
        baseURL: source.getUrls()[0]
      }
    };
  }
}

export default MapFishPrintV3StamenSerializer;
