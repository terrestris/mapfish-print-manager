import OlLayer from 'ol/layer/Layer';
import OlSource from 'ol/source/Source';
import OlSourceStadiaMaps from 'ol/source/StadiaMaps';
import MapFishPrintV3OSMSerializer from './MapFishPrintV3OSMSerializer';

export class MapFishPrintV3StamenSerializer extends MapFishPrintV3OSMSerializer {

  validateSource(source: OlSource): source is OlSourceStadiaMaps {
    return source instanceof OlSourceStadiaMaps;
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

export default MapFishPrintV3StamenSerializer;
