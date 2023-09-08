export default class BEM{
    node = null
    base = 'base'

    constructor(node, base=''){
        this.node = node
        this.base = base
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
                this.node.appendChild(el) 
            }

            return this;
        }

        this.node.appendChild(el);
        return this;
    }

    state(name, status){
        let classList = this.node.classList
        let className = `is-${name}`

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
            this.node.querySelector(`.${this.base}__${name}`),
            this.base
        )
    }

    elements(name){
        let items = [];
        for(let item of this.node.querySelectorAll(`.${this.base}__${name}`)){
            items.push(new BEM(item, this.base));
        }

        return items;
    }
}