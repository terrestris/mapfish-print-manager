'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The ObservableEvent.
 */
var ObservableEvent = exports.ObservableEvent = function () {

  /**
   * The constructor.
   */


  /**
   * The name of the event.
   *
   * @type {String}
   */
  function ObservableEvent(eventName) {
    _classCallCheck(this, ObservableEvent);

    this.eventName = '';
    this.callbacks = [];

    this.eventName = eventName;
  }

  /**
   * Registers a callback to this ObservableEvent.
   *
   * @param {Function} callback The callback function to register.
   */


  /**
   * The callback functions of the event.
   *
   * @type {Array}
   */


  _createClass(ObservableEvent, [{
    key: 'registerCallback',
    value: function registerCallback(callback) {
      this.callbacks.push(callback);
    }

    /**
     * Unregisters a callback of this ObservableEvent.
     *
     * @param {Function} callback The callback to unregister.
     */

  }, {
    key: 'unregisterCallback',
    value: function unregisterCallback(callback) {
      var index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    }

    /**
     * Calls all given callbacks of the event with the provided data.
     *
     * @param {Object} data The data to call the callback(s) with.
     */

  }, {
    key: 'fire',
    value: function fire(data) {
      var callbacks = this.callbacks.slice(0);
      callbacks.forEach(function (callback) {
        callback(data);
      });
    }
  }]);

  return ObservableEvent;
}();

exports.default = ObservableEvent;