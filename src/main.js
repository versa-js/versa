import BEM from './BEM.js'
import eventHandler from './EventHandler.js'
import Component from './Component.js'

const installComponents = () => {
  for( let component of document.querySelectorAll('[data-component]')){
    if (component.installed) continue;

    let name = component.dataset['component'];

    let module = eventHandler.getModule(name);
    if( module ){
      try{
        module.install.call(module, new BEM(component, module.name));
        component.installed = true;
      }catch(e){
        component.installed = true;
        console.error(e)
      }

      return;
    }

    import(`/versa/${name}/module.js`)
      .then((loaded) => {
        let module = new loaded.default();
        eventHandler.addModule(module);

        try {
          module.bootstrap();
          module.install.call(module, new BEM(component, module.name));
          component.installed = true;

        } catch (e) {
          component.installed = true;
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

const mutationObserver = new MutationObserver( componentObserver );
mutationObserver.observe(document.body, { childList: true, subtree: true });
setTimeout(installComponents);

export default { Component, emit };