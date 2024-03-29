import OlLayerImage from 'ol/layer/Image';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceOSM from 'ol/source/OSM';

import { MapFishPrintV3OSMSerializer } from '../../src/serializer/MapFishPrintV3OSMSerializer';

describe('MapFishPrintV3OSMSerializer', () => {
  let serializer: MapFishPrintV3OSMSerializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3OSMSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3OSMSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerImage({
      source: new OlSourceImageWMS()
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with an OSM source', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'png',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      name: layer.get('name'),
      opacity: layer.getOpacity(),
      rasterStyle: undefined,
      resolutions: [
        156543.03392804097,
        78271.51696402048,
        39135.75848201024,
        19567.87924100512,
        9783.93962050256,
        4891.96981025128,
        2445.98490512564,
        1222.99245256282,
        611.49622628141,
        305.748113140705,
        152.8740565703525,
        76.43702828517625,
        38.21851414258813,
        19.109257071294063,
        9.554628535647032,
        4.777314267823516,
        2.388657133911758,
        1.194328566955879,
        0.5971642834779395,
        0.29858214173896974,
      ],
      tileSize: [256, 256],
      type: 'osm'
    });
  });

  it('accepts additional serializer opts', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serializedSimple = serializer.serialize(layer, {
      tileSize: [512, 512],
      imageExtension: 'jpg'
    });

    expect(serializedSimple).toEqual({
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'jpg',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      name: layer.get('name'),
      opacity: layer.getOpacity(),
      rasterStyle: undefined,
      resolutions: [
        156543.03392804097,
        78271.51696402048,
        39135.75848201024,
        19567.87924100512,
        9783.93962050256,
        4891.96981025128,
        2445.98490512564,
        1222.99245256282,
        611.49622628141,
        305.748113140705,
        152.8740565703525,
        76.43702828517625,
        38.21851414258813,
        19.109257071294063,
        9.554628535647032,
        4.777314267823516,
        2.388657133911758,
        1.194328566955879,
        0.5971642834779395,
        0.29858214173896974,
      ],
      tileSize: [512, 512],
      type: 'osm'
    });
  });
});
