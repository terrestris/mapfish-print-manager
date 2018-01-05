import BaseMapFishPrintManager from './BaseMapFishPrintManager';

/**
 * The MapFishPrintV3Manager.
 *
 * @class
 */
export class MapFishPrintV3Manager extends BaseMapFishPrintManager {

  /**
   * The capabilities endpoint of the print service.
   *
   * @type {String}
   */
  static INFO_JSON_ENDPOINT = 'capabilities.json';

  /**
   * The constructor
   */
  constructor() {
    super();
  }

}

export default MapFishPrintV3Manager;
