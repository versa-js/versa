import eventHandler from './EventHandler.js'

export default class Component {
  name = 'component'
  elements = {}
  global = {}
  events = {}

  install(base) {}

  bootstrap() {
    for( let element in this.elements ){
      for( let event in this.elements[element] ){
        this.register(`${this.name}__${element}`, event, this.elements[element][event])
        eventHandler.addEvent(event);
      }
    }

    for( let event in this.global ){
      this.register(`${this.name}`, event, this.global[event]);
      eventHandler.addEvent(event);
    }
  }

  register(target, event, fn) {
    if (!this.events[event]) this.events[event] = {};
    if (!this.events[event][target]) this.events[event][target] = {};
    this.events[event][target] = fn;
  }

  emit(name, payload){
    const event = new Event(name);
    event.payload = payload
    event.isGlobal = true;
    document.body.dispatchEvent(event);
  }
}