import OlWMTS from 'ol/source/WMTS';

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
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [
    OlWMTS
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
    const source = layer.getSource();

    if (!this.validateSource(source)) {
      return;
    }

    const tileGrid = source.getTileGrid();
    // 28mm is the pixel size
    const scaleDenominators = tileGrid.getResolutions().map(resolution => resolution / 0.00028);
    const serialized = {
      ...super.serialize(layer, opts),
      ...opts,
      baseURL: source.getUrls()[0],
      customParams: undefined,
      dimensionParams: undefined,
      dimensions: source.getDimensions(),
      failOnError: true,
      imageFormat: source.getFormat() || 'image/png',
      layer: source.getLayer(),
      matrices: source.getTileGrid().getMatrixIds().slice(0, 11).map((matrixId, index) => ({
        identifier: matrixId,
        matrixSize: [Math.pow(2, index), Math.pow(2, index)],
        scaleDenominator: scaleDenominators[index],
        tileSize: [tileGrid.getTileSize(index), tileGrid.getTileSize(index)],
        topLeftCorner: tileGrid.getOrigin()
      })),
      matrixSet: source.getMatrixSet(),
      mergeableParams: undefined,
      name: layer.get('name'),
      opacity: layer.getOpacity(),
      rasterStyle: '',
      requestEncoding: source.getRequestEncoding(),
      style: source.getStyle(),
      version: source.getVersion() || '1.1.0',
      type: this.constructor.TYPE_WMTS,
    };
    return serialized;
  }
}

export default MapFishPrintV3WMTSSerializer;
