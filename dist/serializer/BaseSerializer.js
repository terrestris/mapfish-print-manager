'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BaseSerializer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Shared = require('../util/Shared');

var _Shared2 = _interopRequireDefault(_Shared);

var _Logger = require('../util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The BaseSerializer.
 *
 * @class
 */
var BaseSerializer = exports.BaseSerializer = function () {
  function BaseSerializer() {
    var _this = this;

    _classCallCheck(this, BaseSerializer);

    this.validateSource = function (source) {
      var isValidSource = _this.constructor.sourceCls.some(function (cls) {
        return source instanceof cls;
      });

      if (!isValidSource) {
        _Logger2.default.warn('Cannot serialize the given source with this serializer');
      }

      return isValidSource;
    };
  }

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */


  _createClass(BaseSerializer, [{
    key: 'serialize',


    /**
     * Serializes/Encodes the given layer.
     *
     * @param {ol.layer.Layer} layer The layer to serialize/encode.
     * @return {Object} The serialized/encoded layer.
     */
    value: function serialize(layer) {
      var serialized = {};
      var source = layer.getSource();
      var units = source.getProjection() ? source.getProjection().getUnits() : 'm';

      if (layer.getMinResolution() > 0) {
        serialized.minScaleDenominator = _Shared2.default.getScaleForResolution(layer.getMinResolution(), units);
      }
      if (layer.getMaxResolution() !== Infinity) {
        serialized.maxScaleDenominator = _Shared2.default.getScaleForResolution(layer.getMaxResolution(), units);
      }

      return serialized;
    }

    /**
     * Validates if the given ol source is compatible with the serializer. Usally
     * called by subclasses.
     *
     * @param {ol.source.Source} source The source to validate.
     * @return {Boolean} Whether it is a valid source or not.
     */

  }]);

  return BaseSerializer;
}();

BaseSerializer.sourceCls = [];
exports.default = BaseSerializer;