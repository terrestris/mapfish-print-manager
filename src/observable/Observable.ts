import ObservableEvent from './ObservableEvent';

export class Observable {

  /**
   * The registered events.
   */
  protected events: any = {};

  /**
   * Registers an event.
   *
   * @param name The name of the event to register.
   * @param callback The callback function to register.
   */
  on(name: string, callback: Function) {
    let event = this.events[name];
    if (!event) {
      event = new ObservableEvent(name);
      this.events[name] = event;
    }
    event.registerCallback(callback);
  }

  /**
  * Unregisters an event.
  *
  * @param name The name of the event to unregister.
  * @param callback The callback function to unregister.
  */
  un(name: string, callback: Function) {
    const event = this.events[name];
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
   * @param name The name of the event to dispatch.
   * @param data The data to apply to the event callback.
   */
  dispatch(name: string, data: any) {
    const event = this.events[name];
    if (event) {
      event.fire(data);
    }
  }
}

export default Observable;
