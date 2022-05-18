import OlSource from 'ol/source/Source';
import OlWMTS from 'ol/source/WMTS';
import OlLayer from 'ol/layer/Layer';
// eslint-disable-next-line no-unused-vars
import OlWMTSTileGrid from 'ol/tilegrid/WMTS';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV3WMTSSerializer.
 * Documentation on http://mapfish.github.io/mapfish-print-doc/layers.html
 *
 * @class
 */
export class MapFishPrintV3WMTSSerializer extends BaseSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {string}
   */
  static TYPE_WMTS = 'wmts';

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
    return source instanceof OlWMTS;
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
    const source = /** @type {OlWMTS} */ (layer.getSource());

    if (!this.validateSource(source)) {
      return;
    }

    let baseUrl = source.getUrls()[0];

    // MapFish Print replaces {style}
    // https://mapfish.github.io/mapfish-print-doc/layers.html#WMTS%20Layer
    if (baseUrl.indexOf('{Style}') > -1) {
      baseUrl = baseUrl.replace('{Style}', '{style}');
    }

    const tileGrid = /** @type {OlWMTSTileGrid} */ (source.getTileGrid());
    const matrixSizes = source.get('matrixSizes');

    // 28mm is the pixel size
    const scaleDenominators = tileGrid.getResolutions().map(resolution => resolution / 0.00028);
    const serialized = {
      ...opts,
      baseURL: baseUrl,
      customParams: undefined,
      dimensionParams: undefined,
      dimensions: source.getDimensions(),
      failOnError: true,
      imageFormat: source.getFormat() || 'image/png',
      layer: source.getLayer(),
      matrices: tileGrid.getMatrixIds().map((matrixId, index) => ({
        identifier: matrixId,
        matrixSize: matrixSizes
          ? [matrixSizes[index][0], matrixSizes[index][1]]
          : [Math.pow(2, index), Math.pow(2, index)],
        scaleDenominator: scaleDenominators[index],
        tileSize: [tileGrid.getTileSize(index), tileGrid.getTileSize(index)],
        topLeftCorner: tileGrid.getOrigin(index) || tileGrid.getOrigin(0)
      })),
      matrixSet: source.getMatrixSet(),
      mergeableParams: undefined,
      name: layer.get('name'),
      opacity: layer.getOpacity(),
      rasterStyle: '',
      requestEncoding: source.getRequestEncoding(),
      style: source.getStyle(),
      version: source.getVersion() || '1.1.0',
      type: MapFishPrintV3WMTSSerializer.TYPE_WMTS
    };
    return serialized;
  }
}

export default MapFishPrintV3WMTSSerializer;
