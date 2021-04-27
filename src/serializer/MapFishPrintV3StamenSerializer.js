import OlSourceStamen from 'ol/source/Stamen';
import MapFishPrintV3OSMSerializer from './MapFishPrintV3OSMSerializer';

/**
 * The MapFishPrintV3StamenSerializer.
 *
 * @class
 */
export class MapFishPrintV3StamenSerializer extends MapFishPrintV3OSMSerializer {

    /**
     * The ol sources this serializer is capable of serializing.
     *
     * @type {Array}
     */
    static sourceCls = [
        OlSourceStamen
    ];

    /**
     * The constructor
     */
    constructor() {
        super();
    }

    /**
     * Serializes/Encodes the given layer.
     *
     * @param {ol.layer.Layer} layer The layer to serialize/encode.
     * @param {Object} opts Additional properties to pass to the serialized
     *   layer object that can't be obtained by the layer itself. It can also be
     *   used to override all generated layer values, e.g. the image format.
     * @return {Object} The serialized/encoded layer.
     */
    serialize(layer, opts = {}) {
        const serialized = super.serialize(layer, opts);
        const source = layer.getSource();

        if (!this.validateSource(source)) {
            return;
        }
        serialized.baseURL = source.getUrls()[0];
        serialized.tileSize = [256, 256]

        return serialized;
    }
}

export default MapFishPrintV3StamenSerializer;
