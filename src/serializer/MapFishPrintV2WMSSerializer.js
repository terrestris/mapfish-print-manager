import OlSource from 'ol/source/Source';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayer from 'ol/layer/Layer';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV2WMSSerializer.
 *
 * @class
 */
export class MapFishPrintV2WMSSerializer extends BaseSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {string}
   */
  static TYPE_WMS = 'WMS';

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
   * @param {OlLayer} oLayer The layer to serialize/encode.
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format. Only
   *   used in V3.
   * @param {number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(oLayer, opts, viewResolution) { // eslint-disable-line no-unused-vars
    const source = /** @type {OlSourceImageWMS|OlSourceTileWMS} */ (oLayer.getSource());

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

    const serialized = {
      ...{
        baseURL: source instanceof OlSourceImageWMS ? source.getUrl() : source.getUrls()[0],
        customParams: customParams,
        format: source.getParams().FORMAT || 'image/png',
        layers: layersArray,
        opacity: oLayer.getOpacity(),
        singleTile: source instanceof OlSourceImageWMS,
        styles: stylesArray,
        type: MapFishPrintV2WMSSerializer.TYPE_WMS
      }
    };

    return serialized;
  }
}

export default MapFishPrintV2WMSSerializer;
