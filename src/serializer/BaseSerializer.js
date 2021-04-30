import OlSource from 'ol/source/Source';
import OlLayer from 'ol/layer/Layer';

import Log from '../util/Logger';

/**
 * The BaseSerializer.
 *
 * @class
 */
export class BaseSerializer {

  /**
   * Determines if this Serializer can serialize the given source
   *
   * @abstract
   * @param {OlSource} source
   * @return {boolean}
   */
  canSerialize (source) { // eslint-disable-line no-unused-vars
    throw new Error('abstract method');
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @abstract
   * @param {OlLayer} layer The layer to serialize/encode.
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format. Only
   *   used in V3.
   * @param {number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, opts, viewResolution) { // eslint-disable-line no-unused-vars
    throw new Error('abstract method');
  }

  /**
   * Validates if the given ol source is compatible with the serializer. Usally
   * called by subclasses.
   *
   * @param {OlSource} source The source to validate.
   * @return {boolean} Whether it is a valid source or not.
   */
  validateSource (source) {
    const isValidSource = this.canSerialize(source);

    if (!isValidSource) {
      Log.warn('Cannot serialize the given source with this serializer');
    }

    return isValidSource;
  }
}

export default BaseSerializer;
