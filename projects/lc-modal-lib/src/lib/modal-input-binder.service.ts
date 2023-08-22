import { ComponentFactoryResolver, Injectable } from '@angular/core';
import type { ModalFactory } from './modal-factory.class';

export interface IModalComponentInputBinder {
    bind(outlet: ModalFactory): void;
}


/**
 * Injectable used as a tree-shakable provider for opting in to 
 * binding params and additionalParams data to component
 * inputs.
 *
 * It was used in order to maintain consistency in writing code for routes, templates, and modals.
 */
@Injectable()
export class ModalComponentInputBinder {
    public bind(outlet: ModalFactory): void {
        const componentClass = outlet['componentClassRef'];
        const component = outlet.componentRef;
        const injector = outlet['injector'];

        if (!componentClass || !component) {
            return;
        }

        const resolver = injector.get(ComponentFactoryResolver);
        const metadata = resolver.resolveComponentFactory(componentClass);

        if (!metadata) {
            console.error(`It's not possible to retrieve metadata for the provided component ${componentClass}.`);
            return;
        }

        const data = {...outlet['paramsValue'], ...outlet['additionalParamsValue'], ...outlet['resolvedData']};
        for (const {propName, templateName} of metadata.inputs) {
            component[propName] = data[templateName] || data[propName];
        }
    }
}