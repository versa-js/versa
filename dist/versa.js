const defaults = {
	base: '/versa'
};
const env = Object.assign( defaults,  window.versaEnv || {});

class BEM{
    node = null
    base = 'base'

    constructor(node, base=''){
        this.node = node;
        this.base = base;
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

    element(name){
        return new BEM( 
            this.node.querySelector(`.${this.base}_${name}`),
            this.base
        )
    }

    elements(name){
        let items = [];
        for(let item of this.node.querySelectorAll(`.${this.base}_${name}`)){
            items.push(new BEM(item, this.base));
        }

        return items;
    }
}

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
    this.modules[module.name] = module;
  }

  handleEvent(event) {
    if (!event.target || !event.target.tagName || ['HTML'].indexOf(event.target.tagName) != -1) return;
    event.isGlobal? this.handleGlobalEvent(event) : this.handleComponentEvent(event);
  }

  handleGlobalEvent(event){
    let bases = document.querySelectorAll('[data-component]');

    for( let base of bases ){
      let name = base.dataset['component'];
      let component = this.modules[name];

      if( !component.events[event.type][name] ){
        continue;
      }

      component
        .events[event.type][name]
        .call( component, new BEM(base, component.name), event);
    }
  }

  handleComponentEvent(){
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
              new BEM(element, component.name),
              new BEM(base, component.name),
              event
            );
        }
      }
    }
  }

}

const eventHandler = new EventHandler;

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
    event.payload = payload;
    event.isGlobal = true;
    document.body.dispatchEvent(event);
  }
}

const installComponents = () => {
  for( let component of document.querySelectorAll('[data-component]')){
    if (component.installed) continue;

    let name = component.dataset['component'];

    import(`${env.base}/${name}/module.js`)
      .then((loaded) => {
        let module = new loaded.default();
        eventHandler.addModule(module);
        component.component_name = name;

        try {
          module.bootstrap();
          module.install.call(module, new BEM(component, module.name));
          component.installed = true;

        } catch (e) {
          component.installed = true;
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

const mutationObserver = new MutationObserver( componentObserver );
mutationObserver.observe(document.body, { childList: true, subtree: true });
installComponents();

export { Component as default };
