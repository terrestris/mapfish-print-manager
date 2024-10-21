import OlLayer from 'ol/layer/Layer';
import OlSourceOSM from 'ol/source/OSM';
import OlSource from 'ol/source/Source';

import MapFishPrintV3XYZSerializer from './MapFishPrintV3XYZSerializer';

export class MapFishPrintV3OSMSerializer extends MapFishPrintV3XYZSerializer {

  validateSource(source: OlSource): source is OlSourceOSM {
    return source instanceof OlSourceOSM;
  }

  serialize(olLayer: OlLayer, opts?: any) {
    const source = olLayer.getSource();

    if (!source || !this.validateSource(source)) {
      return;
    }

    return {
      ...super.serialize(olLayer, opts),
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    };
  }
}

export default MapFishPrintV3OSMSerializer;
