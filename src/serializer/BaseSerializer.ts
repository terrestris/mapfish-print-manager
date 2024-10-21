import OlLayer from 'ol/layer/Layer';
import OlSource from 'ol/source/Source';

export interface BaseSerializer {

  /**
   * Serializes/Encodes the given layer.
   *
   * @param layer The layer to serialize/encode.
   * @param opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format. Only
   *   used in V3.
   * @param viewResolution The resolution to calculate the styles for.
   *
   * @return The serialized/encoded layer.
   */
  serialize: (layer: OlLayer, opts?: any, viewResolution?: number) => any;

  /**
   * Validates if the given ol source is compatible with the serializer. Usally
   * called by subclasses.
   *
   * @param source The source to validate.
   *
   * @return Whether it is a valid source or not.
   */
  validateSource: (source: OlSource) => boolean;
}

export default BaseSerializer;
