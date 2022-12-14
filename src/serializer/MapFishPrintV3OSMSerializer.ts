import OlSource from 'ol/source/Source';
import OlSourceOSM from 'ol/source/OSM';
import OlLayer from 'ol/layer/Layer';

import BaseSerializer from './BaseSerializer';

export class MapFishPrintV3OSMSerializer implements BaseSerializer {

  /**
   * The WMS layer type identificator.
   */
  static TYPE_OSM: string = 'osm';

  validateSource(source: OlSource): source is OlSourceOSM {
    return source instanceof OlSourceOSM;
  }

  serialize(olLayer: OlLayer, opts?: any) {
    const optsToApply = {
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'png',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      rasterStyle: undefined,
      tileSize: [256, 256],
      ...opts
    };

    const source = olLayer.getSource();

    if (!source || !this.validateSource(source)) {
      return;
    }

    const tileGrid = source.getTileGrid();
    const tileGridResolutions = tileGrid?.getResolutions() || [];

    const serialized = {
      name: olLayer.get('name'),
      opacity: olLayer.getOpacity(),
      resolutions: tileGridResolutions,
      type: MapFishPrintV3OSMSerializer.TYPE_OSM,
      ...optsToApply
    };

    return serialized;
  }
}

export default MapFishPrintV3OSMSerializer;
