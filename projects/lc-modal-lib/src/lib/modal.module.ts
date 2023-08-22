import { ModuleWithProviders, NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Modal } from './modal.service';
import { ModalComponent } from './modal.component';
import { ModalAnchor } from './modal-anchor.component';
import { Draggable } from './draggable/draggable.directive';
import { DraggableHandle } from './draggable/draggable-handle.directive';
import { ModalHelper } from './modal-helper.service';
import { Resizable } from './resizable/resizable.component';
import { ModalConfig } from './modal-config.class';
import { withComponentInputBinding } from './modal-binding.class';
import { IModalResolve } from './modal-types.class';
import { withComponentResolver } from './modal-resolve.class';

export * from './modal.service';
export * from './modal-types.class';
export * from './draggable/draggable-handle.directive';
export * from './draggable/draggable.directive';
export * from './resizable/resizable.component';
export * from './modal-helper.service';
export * from './modal-factory.class';
export * from './modal-config.class';
export * from './modal-event.class';
export {
	ModalConfigurationEventType,
	IModalConfigurationEvent,
	ModalDimensionUnits
} from './modal-configuration.class';
export { INPUT_BINDER } from './modal-binding.class';
export { MODAL_RESOLVE } from './modal-resolve.class';

export interface IModalModuleConfig {
    bindToComponentInputs?: boolean;
    resolve?: Type<IModalResolve>;
}

@NgModule({
    imports: [CommonModule],
    declarations: [ModalComponent, ModalAnchor, DraggableHandle, Draggable, Resizable],
    exports: [ModalAnchor],
    providers: [
        {
            provide: ModalConfig,
            useValue: ModalConfig
        },
        Modal,
        ModalHelper
    ]
})
export class ModalModule {
    public static forRoot<T extends IModalModuleConfig>(configuration?: T): ModuleWithProviders<ModalModule> {
        return {
            ngModule: ModalModule,
            providers: [
                configuration?.bindToComponentInputs ? withComponentInputBinding() : [],
                configuration?.resolve ? withComponentResolver(configuration.resolve) : [],
            ]
        };
    }
}
