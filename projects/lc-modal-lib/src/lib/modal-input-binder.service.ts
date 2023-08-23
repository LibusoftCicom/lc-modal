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
        const componentFactory = outlet['componentFactory'];
        const component = outlet.componentRef;

        if (!componentFactory || !component) {
            return;
        }

        if (!componentFactory) {
            console.error(`It's not possible to retrieve metadata for the provided component ${componentFactory.componentType}.`);
            return;
        }

        const data = {...outlet['paramsValue'], ...outlet['additionalParamsValue'], ...outlet['resolvedData']};
        for (const {propName, templateName} of componentFactory.inputs) {
            component[propName] = data[templateName] || data[propName];
        }
    }
}