import OlLayer from 'ol/layer/Layer';
import OlSource from 'ol/source/Source';
import olSourceOSM from 'ol/source/OSM';
import MapFishPrintV3XYZSerializer from './MapFishPrintV3XYZSerializer';

export class MapFishPrintV3OSMSerializer extends MapFishPrintV3XYZSerializer {

  validateSource(source: OlSource): source is olSourceOSM {
    return source instanceof olSourceOSM;
  }

  serialize(olLayer: OlLayer, opts?: any) {
    const source = olLayer.getSource();
    const optsToApply = {
      baseURL: undefined,
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'png',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      rasterStyle: undefined,
      tileSize: [256, 256],
      ...opts
    };

    if (!source || !this.validateSource(source)) {
      return;
    }

    const urls = source.getUrls();
    const baseUrl = urls ? urls[0] : undefined;

    return {
      ...super.serialize(olLayer, opts),
      baseURL: baseUrl,
      ...optsToApply
    };
  }
}

export default MapFishPrintV3OSMSerializer;
