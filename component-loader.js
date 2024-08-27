import { defineAsyncComponent } from 'vue';

let components = {};
addComponents(import.meta.glob('../common/components/*.vue'), 'common/components');
addComponents(import.meta.glob('../specific/components/*.vue'), 'specific/components');
import { additionalComponents } from '../specific/additional-components.js';    
additionalComponents();

/**
 * Retrieves the component from the global API store based on the provided component name.
 * @param {string} component - The name of the component to retrieve.
 * @returns {Object} - The retrieved component from the global API store.
 */
function getComponent(component) {
    //return () => import(components[component]);
    return components[component];
};

function loadComponent(component) {
    //let importedComponent = getComponent(component);
    //return defineAsyncComponent(importedComponent);

    //return defineAsyncComponent(() => import(components[component]));
    return defineAsyncComponent(components[component]);
};

function componentPath(component) {
    return components[component];
}

function addComponents(glob, dir) {
    for (let key in glob) {
        // extract the name of the component from the file path
        //let name = key.split('/').pop().split('.').shift();
        //components[name] = `/src/${dir}/${name}.vue`;

        let name = key.split('/').pop().split('.').shift();
        // extract the path of the component from the glob[key]

        components[name] = glob[key];
    }
}

export { getComponent, loadComponent, componentPath, addComponents };