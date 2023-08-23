import { InjectionToken, Provider } from '@angular/core';
import { ModalComponentInputBinder } from "./modal-input-binder.service";


export const INPUT_BINDER = new InjectionToken<ModalComponentInputBinder>('');

export function withComponentInputBinding(): Provider[] {
    const providers = [
        ModalComponentInputBinder,
        {provide: INPUT_BINDER, useExisting: ModalComponentInputBinder},
    ];

    return providers;
}