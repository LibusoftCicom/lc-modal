import { InjectionToken, Provider, Type } from '@angular/core';
import { IModalResolve } from './modal-types.class';


export const MODAL_RESOLVE = new InjectionToken<any>('MODAL_RESOLVE');

export function withComponentResolver(resolver: Type<IModalResolve>): Provider {
    const providers = [
        { provide: MODAL_RESOLVE, useClass: resolver },
    ];

    return providers;
}