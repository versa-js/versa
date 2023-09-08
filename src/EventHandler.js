import BEM from './BEM.js'


class EventHandler {
  mutationObserver = null
  modules = {}
  events = []

  addEvent(event) {
    if( this.events.indexOf(event) != -1 ) return;

    document.addEventListener(event, event => this.handleEvent(event), true);
    this.events.push(event);
  }

  addModule(module){
    this.modules[module.name] = module
  }

  getModule(module){
    return this.modules[module]
  }

  handleEvent(event) {
    if (!event.target || !event.target.tagName || ['HTML'].indexOf(event.target.tagName) != -1) return;
    event.target == document.body ? this.handleGlobalEvent(event) : this.handleComponentEvent(event);
  }

  handleGlobalEvent(event){
    let bases = document.querySelectorAll('[data-component]');

    for( let base of bases ){
      let name = base.dataset['component'];
      let component = this.modules[name];
      let event_name = `_${event.type}`;

      if( !component.events[event_name] ){
        continue;
      }
  
      component
        .events[event_name]
        .call( component, new BEM(base, component.name), event);
    }
  }

  handleComponentEvent(event){

    let path = event
      .composedPath()
      .filter((el) => el.tagName && ['HTML'].indexOf(el.tagName) == -1 );

    let bases = path.filter((el) => el.dataset['component'] );

    for( let base of bases ){
      let component = this.modules[base.dataset['component']]

      for( let target_class in component.events[event.type] ){
        let elements = base.querySelectorAll(`.${target_class}`);
        if(!elements) continue;

        for(let element of elements){
          if( path.indexOf(element) == -1 ){
            continue;
          }
          
          component.events[event.type][target_class]
            .call(
              component,
              new BEM(base, component.name),
              new BEM(element, component.name),
              event
            )
        }
      }
    }
  }

}

const eventHandler = new EventHandler();
export default eventHandler;