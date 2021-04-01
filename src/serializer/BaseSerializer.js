import Log from '../util/Logger';

/**
 * The BaseSerializer.
 *
 * @class
 */
export class BaseSerializer {

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [];

  /**
   * Validates if the given ol source is compatible with the serializer. Usally
   * called by subclasses.
   *
   * @param {ol.source.Source} source The source to validate.
   * @return {boolean} Whether it is a valid source or not.
   */
  validateSource = source => {
    const isValidSource = this.constructor.sourceCls.some(cls => {
      return (source instanceof cls);
    });

    if (!isValidSource) {
      Log.warn('Cannot serialize the given source with this serializer');
    }

    return isValidSource;
  }
}

export default BaseSerializer;
