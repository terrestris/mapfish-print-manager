import OlSource from 'ol/source/Source';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayer from 'ol/layer/Layer';

import MapFishPrintV3WMSSerializer from './MapFishPrintV3WMSSerializer';

export class MapFishPrintV3TiledWMSSerializer extends MapFishPrintV3WMSSerializer {

  /**
   * The WMS layer type identificator.
   */
  static TYPE_WMS: string = 'tiledwms';

  validateSource(source: OlSource): source is OlSourceTileWMS {
    return source instanceof OlSourceTileWMS;
  }

  serialize(olLayer: OlLayer, opts?: any) {
    const optsToApply = {
      tileSize: [512, 512],
      ...opts
    };

    const source = olLayer.getSource();

    if (!source || !this.validateSource(source)) {
      return;
    }

    return {
      ...super.serialize(olLayer, opts),
      type: MapFishPrintV3TiledWMSSerializer.TYPE_WMS,
      ...optsToApply
    };
  }
}

export default MapFishPrintV3TiledWMSSerializer;
