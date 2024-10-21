import _isNil from 'lodash/isNil';
import OlLayer from 'ol/layer/Layer';
import OlSource from 'ol/source/Source';
import OlSourceWMTS from 'ol/source/WMTS';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';

import BaseSerializer from './BaseSerializer';


export class MapFishPrintV3WMTSSerializer implements BaseSerializer {

  /**
   * The WMS layer type identificator.
   */
  static TYPE_WMTS = 'wmts';

  validateSource(source: OlSource): source is OlSourceWMTS {
    return source instanceof OlSourceWMTS;
  }

  serialize(olLayer: OlLayer, opts?: any) {
    const source = olLayer.getSource();

    if (!source || !this.validateSource(source)) {
      return;
    }

    const urls = source.getUrls();
    let baseUrl = urls ? urls[0] : undefined;

    if (!baseUrl) {
      return;
    }

    // MapFish Print replaces {style}
    // https://mapfish.github.io/mapfish-print-doc/layers.html#WMTS%20Layer
    if (baseUrl.indexOf('{Style}') > -1) {
      baseUrl = baseUrl.replace('{Style}', '{style}');
    }

    const tileGrid = source.getTileGrid() as OlTileGridWMTS;
    const matrixSizes = source.get('matrixSizes');

    if (!tileGrid) {
      return;
    }

    const dimensionParams = source.getDimensions();
    let dimensions = undefined;
    if (!_isNil(dimensionParams) && Object.keys(dimensionParams).length > 0) {
      dimensions = Object.keys(dimensionParams);
    }

    // 28mm is the pixel size
    const scaleDenominators = tileGrid.getResolutions().map(resolution => resolution / 0.00028);
    return {
      ...opts,
      baseURL: baseUrl,
      customParams: undefined,
      dimensionParams,
      dimensions,
      failOnError: opts?.failOnError || true,
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
      name: olLayer.get('name'),
      opacity: olLayer.getOpacity(),
      rasterStyle: '',
      requestEncoding: source.getRequestEncoding(),
      style: source.getStyle(),
      version: source.getVersion() || '1.1.0',
      type: MapFishPrintV3WMTSSerializer.TYPE_WMTS
    };
  }
}

export default MapFishPrintV3WMTSSerializer;
