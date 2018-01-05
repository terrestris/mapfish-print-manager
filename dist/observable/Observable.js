'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Observable = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ObservableEvent = require('./ObservableEvent');

var _ObservableEvent2 = _interopRequireDefault(_ObservableEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The Observable.
 */
var Observable = exports.Observable = function () {
  function Observable() {
    _classCallCheck(this, Observable);

    this.events = {};
  }

  /**
   * The registered events.
   *
   * @type {Object}
   */


  _createClass(Observable, [{
    key: 'on',


    /**
    * Registers an event.
    *
    * @param {String} name The name of the event to register.
    * @param {Function} callback The callback function to register.
    */
    value: function on(name, callback) {
      var event = this.events[name];
      if (!event) {
        event = new _ObservableEvent2.default(name);
        this.events[name] = event;
      }
      event.registerCallback(callback);
    }

    /**
    * Unregisters an event.
    *
    * @param {String} name The name of the event to unregister.
    * @param {Function} callback The callback function to unregister.
    */

  }, {
    key: 'un',
    value: function un(name, callback) {
      var event = this.events[name];
      if (event && event.callbacks.indexOf(callback) > -1) {
        event.unregisterCallback(callback);
        if (event.callbacks.length === 0) {
          delete this.events[name];
        }
      }
    }

    /**
     * Dispatches the given event with the provided data.
     *
     * @param {String} name The name of the event to dispatch.
     * @param {Object} data The data to apply to the event callback.
     */

  }, {
    key: 'dispatch',
    value: function dispatch(name, data) {
      var event = this.events[name];
      if (event) {
        event.fire(data);
      }
    }
  }]);

  return Observable;
}();

exports.default = Observable;