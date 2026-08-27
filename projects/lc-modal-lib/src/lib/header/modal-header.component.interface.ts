import { InputSignal } from '@angular/core';
import { ModalConfiguration } from './../modal-configuration.class';

export interface IModalHeaderComponent {

    title: InputSignal<string | null>;
    configuration: InputSignal<ModalConfiguration>;

    setCloseFn(fn: () => void): void;
}
