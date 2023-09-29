import BEM from './BEM.js'
import eventHandler from './EventHandler.js'
import Component from './Component.js'

const installComponents = () => {
  for( const component of document.querySelectorAll('[data-component]:not([versa-installed])')){
    const name = component.dataset['component'];

    const module = eventHandler.getModule(name);
    if( module ){
      try{
        module.install.call(module, new BEM(component, module.name));
        component.setAttribute('versa-installed', true)
      }catch(e){
        component.setAttribute('versa-installed', true)
        console.error(e)
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
          component.setAttribute('versa-installed', true)

        } catch (e) {
          component.setAttribute('versa-installed', true)
          console.error(e)
        }
      });
  }
}

const componentObserver = (mutations, observer) => {
  let update = false;

  for( let mutation of mutations ){
    if (mutation.type !== 'childList' || !mutation.addedNodes.length){
      return;
    } 

    update = true;
  }

  if (update) installComponents();
}

function emit(name, payload){
  const event = new Event(name);
  event.payload = payload
  document.body.dispatchEvent(event);
}

function on(event, handler){
  eventHandler.addExternalEvent(event, handler)
}

const mutationObserver = new MutationObserver( componentObserver );
mutationObserver.observe(document.body, { childList: true, subtree: true });
setTimeout(installComponents);

export { Component, emit, on, BEM };
export default Component;