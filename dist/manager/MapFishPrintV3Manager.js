'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MapFishPrintV3Manager = undefined;

var _BaseMapFishPrintManager = require('./BaseMapFishPrintManager');

var _BaseMapFishPrintManager2 = _interopRequireDefault(_BaseMapFishPrintManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The MapFishPrintV3Manager.
 *
 * @class
 */
var MapFishPrintV3Manager = exports.MapFishPrintV3Manager = function (_BaseMapFishPrintMana) {
  _inherits(MapFishPrintV3Manager, _BaseMapFishPrintMana);

  /**
   * The constructor
   */
  function MapFishPrintV3Manager() {
    _classCallCheck(this, MapFishPrintV3Manager);

    return _possibleConstructorReturn(this, (MapFishPrintV3Manager.__proto__ || Object.getPrototypeOf(MapFishPrintV3Manager)).call(this));
  }

  /**
   * The capabilities endpoint of the print service.
   *
   * @type {String}
   */


  return MapFishPrintV3Manager;
}(_BaseMapFishPrintManager2.default);

MapFishPrintV3Manager.INFO_JSON_ENDPOINT = 'capabilities.json';
exports.default = MapFishPrintV3Manager;