import OlLayerGroup from 'ol/layer/Group';
import OlLayer from 'ol/layer/Layer';
import OlMap from 'ol/Map';
import { METERS_PER_UNIT } from 'ol/proj/Units';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';

/**
 * Some shared static utility methods.
 *
 * @class
 */
export class Shared {

  /**
   * Returns all map interactions with the given name.
   *
   * @param map The map to get the interactions from.
   * @param name The name to filter with.
   *
   * @return The matching candidates.
   */
  static getInteractionsByName = (map: OlMap, name: string) => {
    const interactions = map.getInteractions().getArray();
    return interactions.filter(interaction => interaction.get('name') === name);
  };

  /**
   * Returns all map layers with the given name.
   *
   * @param map The map to get the layers from.
   * @param name The name to filter with.
   * @return The matching candidates.
   */
  static getLayersByName = (map: OlMap, name: string) => {
    const layers = Shared.getMapLayers(map);
    return layers.filter(layer => layer.get('name') === name);
  };

  /**
   * Returns all layers from the given map.
   *
   * @param collection The map or layergroup to get the layers from.
   * @return The layers.
   */
  static getMapLayers = (collection: OlMap | OlLayerGroup) => {
    const layers = collection.getLayers().getArray();
    const mapLayers: OlLayer[] = [];

    layers.forEach(layer => {
      if (layer instanceof OlLayerGroup) {
        if (layer.getVisible()) {
          Shared.getMapLayers(layer).forEach(l => {
            mapLayers.push(l);
          });
        }
      }

      if (layer instanceof OlLayer) {
        mapLayers.push(layer);
      }
    });

    return mapLayers;
  };

  /**
   * Generates the GetLegendGraphic url for the given layer.
   *
   * @param layer The layer to generate the GetLegendGraphic for.
   * @return The GetLegendGraphic url.
   */
  static getLegendGraphicUrl = (layer: OlLayer) => {
    if (layer.get('legendUrl')) {
      return layer.get('legendUrl');
    }

    const source = layer.getSource();

    if (source instanceof OlSourceTileWMS ||
      source instanceof OlSourceImageWMS) {
      const customParams = layer.get('customPrintLegendParams');

      let url;
      if (source instanceof OlSourceImageWMS) {
        url = source.getUrl();
      }

      if (source instanceof OlSourceTileWMS) {
        const urls = source.getUrls();
        url = urls ? urls[0] : undefined;
      }

      const {
        LAYERS,
        VERSION,
        FORMAT,
        ...passThroughParams
      } = source.getParams();
      const params = {
        LAYER: LAYERS.split(',')[0],
        VERSION: VERSION || '1.3.0',
        SERVICE: 'WMS',
        REQUEST: 'GetLegendGraphic',
        FORMAT: FORMAT || 'image/png',
        ...customParams,
        ...passThroughParams
      };
      const queryParams = Object.keys(params).map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
      }).join('&');

      if (url?.endsWith('?')) {
        return `${url}${queryParams}`;
      } else {
        return `${url}?${queryParams}`;
      }
    }
  };

  /**
   * Returns the appropriate scale for the given resolution and units.
   *
   * @param resolution The resolution to calculate the scale for.
   * @param units The units the resolution is based on, typically
   *                       either 'm' or 'degrees'.
   * @return The appropriate scale.
   */
  static getScaleForResolution = (resolution: number | string, units: keyof typeof METERS_PER_UNIT) => {
    const dpi = 25.4 / 0.28;
    const mpu = METERS_PER_UNIT[units];
    const inchesPerMeter = 39.37;

    if (typeof resolution === 'string') {
      resolution = parseFloat(resolution);
    }

    return resolution * mpu * inchesPerMeter * dpi;
  };

  /**
   * Removes duplicated forward slashes as well as trailing slash
   * and returns normalized URL string
   */
  static sanitizeUrl = (url: string) => {
    return url.replace(/([^:]\/)\/+/g, '$1').replace(/\/+$/, '');
  };
}

export default Shared;
