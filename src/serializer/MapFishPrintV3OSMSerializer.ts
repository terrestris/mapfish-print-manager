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

    if (!source || !this.validateSource(source)) {
      return;
    }

    const urls = source.getUrls();
    const baseUrl = urls ? urls[0] : undefined;

    return {
      ...super.serialize(olLayer, opts),
      baseURL: baseUrl
    };
  }
}

export default MapFishPrintV3OSMSerializer;
