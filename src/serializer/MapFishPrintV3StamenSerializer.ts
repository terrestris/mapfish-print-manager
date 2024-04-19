import OlLayer from 'ol/layer/Layer';
import OlSource from 'ol/source/Source';
import OlSourceStamen from 'ol/source/Stamen';
import MapFishPrintV3XYZSerializer from './MapFishPrintV3XYZSerializer';


export class MapFishPrintV3StamenSerializer extends MapFishPrintV3XYZSerializer {

  validateSource(source: OlSource): source is StadiaMaps {
    return source instanceof StadiaMaps;
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
