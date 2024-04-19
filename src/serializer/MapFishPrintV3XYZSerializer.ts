import OlSource from 'ol/source/Source';
import OlSourceXYZ from 'ol/source/XYZ';
import OlLayer from 'ol/layer/Layer';

import BaseSerializer from './BaseSerializer';

export class MapFishPrintV3XYZSerializer implements BaseSerializer {

  /**
   * The XYZ layer type identificator.
   * We use OSM for the type because the backend does not
   * have XYZ implemented which leads to the map not being printed
   */
  static TYPE_XYZ: string = 'OSM';

  validateSource(source: OlSource): source is OlSourceXYZ {
    return source instanceof OlSourceXYZ;
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
    const urls = source.getUrls();
    const baseUrl = urls ? urls[0] : undefined;

    const serialized = {
      name: olLayer.get('name'),
      opacity: olLayer.getOpacity(),
      resolutions: tileGridResolutions,
      baseURL: baseUrl,
      type: MapFishPrintV3XYZSerializer.TYPE_XYZ,
      ...optsToApply
    };
    return serialized;
  }
}

export default MapFishPrintV3XYZSerializer;
