import { InjectionToken, Provider, Type } from '@angular/core';
import { IModalHeaderComponent } from './modal-header.component.interface';
import { ModalHeaderComponent } from './modal-header.component';


export const MODAL_HEADER = new InjectionToken<Type<IModalHeaderComponent>>('LC_MODAL_HEADER');

export function withModalHeader(
    header: Type<IModalHeaderComponent> = ModalHeaderComponent
): Provider {
    return {
        provide: MODAL_HEADER,
        useValue: header
    };
}

