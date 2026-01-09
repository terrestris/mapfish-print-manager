import OlLayerTile from 'ol/layer/Tile';

import OlSourceWMTS from 'ol/source/WMTS';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';

import { MapFishPrintV3WMTSSerializer } from '../../src/serializer/MapFishPrintV3WMTSSerializer';

describe('MapFishPrintV3WMTSSerializer', () => {
  let serializer: MapFishPrintV3WMTSSerializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3WMTSSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3WMTSSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerTile({
      source: new OlSourceWMTS({
        layer: ' test',
        matrixSet: 'example',
        style: 'default',
        tileGrid: new OlTileGridWMTS({
          matrixIds: ['0'],
          resolutions: [1000],
          origin: [19, 0.9]
        })
      })
    });

    const serialized = serializer.serialize(layer);
    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with an WMTS source', () => {
    const layerUrl = 'https://domain.com/wmts/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png';
    const matrixSet = 'MATRIXSET';
    const layer = new OlLayerTile({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceWMTS({
        urls: [layerUrl],
        layer: 'test',
        matrixSet,
        style: 'default',
        tileGrid: new OlTileGridWMTS({
          matrixIds: ['0'],
          resolutions: [1000],
          origin: [19, 0.9],
          tileSizes: [[256, 256]]
        }),
        requestEncoding: 'REST'
      }),
      properties: {
        name: 'Peter'
      }
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      baseURL: layerUrl,
      customParams: undefined,
      dimensionParams: {},
      dimensions: undefined,
      failOnError: false,
      imageFormat: 'image/jpeg',
      layer: 'test',
      matrices: [{
        identifier: '0',
        matrixSize: [1, 1],
        scaleDenominator: 3571428.571428572,
        tileSize: [ 256, 256 ],
        topLeftCorner: [ 19, 0.9 ],
      }],
      matrixSet,
      mergeableParams: undefined,
      name: 'Peter',
      opacity: 1,
      rasterStyle: '',
      requestEncoding: 'REST',
      style: 'default',
      type: 'wmts',
      version: '1.0.0',
    });
  });

  it('accepts additional serializer dimension opts', () => {
    const layerUrl = 'https://dim-wmts/{Time}/2056/{TileMatrix}/{TileCol}/{TileRow}.jpeg';
    const layer = new OlLayerTile({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceWMTS({
        urls: [layerUrl],
        layer: 'test',
        matrixSet: 'MATRIXSET',
        style: 'default',
        tileGrid: new OlTileGridWMTS({
          matrixIds: ['0'],
          resolutions: [1000],
          origin: [19, 0.9],
          tileSizes: [[256, 256]]
        }),
        requestEncoding: 'REST',
        dimensions: {
          Time: 'current'
        }
      }),
      properties: {
        name: 'Peter'
      }
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      baseURL: layerUrl,
      customParams: undefined,
      dimensionParams: {
        Time: 'current'
      },
      dimensions: ['Time'],
      failOnError: false,
      imageFormat: 'image/jpeg',
      layer: 'test',
      matrices: [{
        identifier: '0',
        matrixSize: [1, 1],
        scaleDenominator: 3571428.571428572,
        tileSize: [ 256, 256 ],
        topLeftCorner: [ 19, 0.9 ],
      }],
      matrixSet: 'MATRIXSET',
      mergeableParams: undefined,
      name: 'Peter',
      opacity: 1,
      rasterStyle: '',
      requestEncoding: 'REST',
      style: 'default',
      type: 'wmts',
      version: '1.0.0',
    });
  });
});
