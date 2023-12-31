class BEM{
    node = null
    basename = 'base'
    base = null


    constructor(node, basename='', base){
        this.node = node;
        this.base = (base)? base : node;
        this.basename = basename;
    }

    html(html){
        this.node.innerHTML = html;
        return this;
    }

    append(element){
        if( typeof element === 'string' || element instanceof String ) {
            let temp = document.createElement('div');
            temp.innerHTML = element;
            for (const el of temp.children) {
                this.node.appendChild(el); 
            }

            return this;
        }

        this.node.appendChild(el);
        return this;
    }

    state(name, status){
        if(!this.node){
            console.warn(`.${this.basename}__${name} not found, cant set ${name} state`);
            return this;
        }

        let classList = this.node.classList;
        let className = `is-${name}`;

        if(status){
            classList.add(className);
            return this;
        }
        
        classList.remove(className);
        return this;
    }

    is(state){
        return this.node.classList.contains(`is-${state}`);
    }

    element(name, root){
        return new BEM( 
            ((root)? this.base : this.node).querySelector(`.${this.basename}__${name}`),
            this.basename,
            this.base,
        )
    }

    elements(name, root){
        let items = [];
        for(let item of ((root)? this.base : this.node).querySelectorAll(`.${this.basename}__${name}`)){
            items.push(new BEM(item, this.basename, this.base));
        }

        return items;
    }
}

class EventHandler {
  mutationObserver = null
  modules = {}
  events = []
  external_events = {}

  addEvent(event) {
    if( this.events.indexOf(event) != -1 ) return;

    document.addEventListener(event, event => this.handleEvent(event), true);
    this.events.push(event);
  }

  addExternalEvent(event, handler){
    this.addEvent(event);
    this.external_events[event] = this.external_events[event] || [];
    this.external_events[event].push(handler);
  }

  addModule(module){
    this.modules[module.name] = module;
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

      if( !component.events || !component.events[event_name] ){
        continue;
      }

      component
        .events[event_name]
        .call( component, new BEM(base, component.name), event);
    }

    this.handleExternalEvent(event);
  }

  handleExternalEvent(event){
    const handlers = this.external_events[event.type];
    
    if(!handlers){
      return;
    }

    handlers.forEach(handler => {
      handler(event);
    });
  }

  handleComponentEvent(event){

    let path = event
      .composedPath()
      .filter((el) => el.tagName && ['HTML'].indexOf(el.tagName) == -1 );

    let bases = path.filter((el) => el.dataset['component'] );

    for( let base of bases ){
      let component = this.modules[base.dataset['component']];

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
            );
        }
      }
    }
  }

}

const eventHandler = new EventHandler();

class Component {
  name = 'component'
  elements = {}
  global = {}
  events = {}

  install(base) {}

  bootstrap() {
    for( let element in this.elements ){
      for( let event in this.elements[element] ){
        this.register(`${this.name}__${element}`, event, this.elements[element][event]);
        eventHandler.addEvent(event);
      }
    }

    for( let event in this.global ){
      this.events[`_${event}`] = this.global[event];
      eventHandler.addEvent(event);
    }
  }

  register(target, event, fn) {
    if (!this.events[event]) this.events[event] = {};
    if (!this.events[event][target]) this.events[event][target] = {};
    this.events[event][target] = fn;
  }

  

  static addModule(module){
    if( !Object.keys(module.events).length ){
      module.bootstrap();
    }
    eventHandler.addModule(module);
  }
}

const installComponents = () => {
  for( const component of document.querySelectorAll('[data-component]:not([versa-installed])')){
    const name = component.dataset['component'];

    const module = eventHandler.getModule(name);
    if( module ){
      try{
        module.install.call(module, new BEM(component, module.name));
        component.setAttribute('versa-installed', true);
      }catch(e){
        component.setAttribute('versa-installed', true);
        console.error(e);
      }

      continue;
    }

    import(`/versa/${name}/module.js`)
      .then((loaded) => {
        let module = new loaded.default();
        eventHandler.addModule(module);

        try {
          module.bootstrap();
          module.install.call(module, new BEM(component, module.name));
          component.setAttribute('versa-installed', true);

        } catch (e) {
          component.setAttribute('versa-installed', true);
          console.error(e);
        }
      });
  }
};

const componentObserver = (mutations, observer) => {
  let update = false;

  for( let mutation of mutations ){
    if (mutation.type !== 'childList' || !mutation.addedNodes.length){
      return;
    } 

    update = true;
  }

  if (update) installComponents();
};

function emit(name, payload){
  const event = new Event(name);
  event.payload = payload;
  document.body.dispatchEvent(event);
}

function on(event, handler){
  eventHandler.addExternalEvent(event, handler);
}

const mutationObserver = new MutationObserver( componentObserver );
mutationObserver.observe(document.body, { childList: true, subtree: true });
setTimeout(installComponents);

export { BEM, Component, Component as default, emit, on };
