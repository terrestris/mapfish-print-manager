import OlLayer from 'ol/layer/Layer';
import OlSourceXYZ from 'ol/source/XYZ';
import OlSource from 'ol/source/Source';
import MapFishPrintV3OSMSerializer from './MapFishPrintV3OSMSerializer';

export class MapFishPrintV3XYZSerializer extends MapFishPrintV3OSMSerializer {

  validateSource(source: OlSource): source is OlSourceXYZ {
    return source instanceof OlSourceXYZ;
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

export default MapFishPrintV3XYZSerializer;
