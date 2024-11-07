export class ObservableEvent {

  /**
   * The name of the event.
   */
  eventName: string;

  /**
   * The callback functions of the event.
   */
  callbacks: ((data: any) => void)[] = [];

  constructor(eventName: string) {
    this.eventName = eventName;
  }

  /**
   * Registers a callback to this ObservableEvent.
   *
   * @param callback The callback function to register.
   */
  registerCallback(callback: (data: any) => void) {
    this.callbacks.push(callback);
  }

  /**
   * Unregisters a callback of this ObservableEvent.
   *
   * @param callback The callback to unregister.
   */
  unregisterCallback(callback: (data: any) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Calls all given callbacks of the event with the provided data.
   *
   * @param data The data to call the callback(s) with.
   */
  fire(data: any) {
    const callbacks = this.callbacks.slice(0);
    callbacks.forEach(callback => {
      callback(data);
    });
  }
}

export default ObservableEvent;
