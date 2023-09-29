export default class BEM{
    node = null
    basename = 'base'
    base = null


    constructor(node, basename='', base){
        this.node = node
        this.base = (base)? base : node
        this.basename = basename
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