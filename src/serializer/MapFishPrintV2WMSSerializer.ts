import OlLayer from 'ol/layer/Layer';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSource from 'ol/source/Source';
import OlSourceTileWMS from 'ol/source/TileWMS';

import BaseSerializer from './BaseSerializer';

export class MapFishPrintV2WMSSerializer implements BaseSerializer {

  /**
   * The WMS layer type identificator.
   */
  static TYPE_WMS = 'WMS';

  validateSource(source: OlSource): source is OlSourceImageWMS | OlSourceTileWMS {
    return source instanceof OlSourceImageWMS || source instanceof OlSourceTileWMS;
  };

  serialize(olLayer: OlLayer) {
    const source = olLayer.getSource();

    if (!source || !this.validateSource(source)) {
      return;
    }

    const layers = source.getParams().LAYERS;
    const layersArray = layers ? layers.split(',') : [''];
    const styles = source.getParams().STYLES;
    const stylesArray = styles ? styles.split(',') : [''];

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      LAYERS,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      STYLES,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      VERSION,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      WIDTH,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      HEIGHT,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      FORMAT,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      BBOX,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      CRS,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      SRS,
      ...customParams
    } = source.getParams();

    let baseUrl;
    if (source instanceof OlSourceImageWMS) {
      baseUrl = source.getUrl();
    }

    if (source instanceof OlSourceTileWMS) {
      const urls = source.getUrls();
      baseUrl = urls ? urls[0] : undefined;
    }

    return {
      baseURL: baseUrl,
      customParams: customParams,
      format: source.getParams().FORMAT || 'image/png',
      layers: layersArray,
      opacity: olLayer.getOpacity(),
      singleTile: source instanceof OlSourceImageWMS,
      styles: stylesArray,
      type: MapFishPrintV2WMSSerializer.TYPE_WMS
    };
  }
}

export default MapFishPrintV2WMSSerializer;
