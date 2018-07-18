import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Modal } from './modal.service';
import { ModalComponent } from './modal.component';
import { ModalAnchor } from './modal-anchor.component';
import { Draggable } from './draggable/draggable.directive';
import { DraggableHandle } from './draggable/draggable-handle.directive';
import { ModalHelper } from './modal-helper.service';
import { Resizable } from './resizable/resizable.component';
import { ModalConfig } from './modal-config.class';

export * from './modal.service';
export * from './modal-types.class';
export * from './draggable/draggable-handle.directive';
export * from './draggable/draggable.directive';
export * from './resizable/resizable.component';
export * from './modal-helper.service';
export * from './modal-factory.class';
export * from './modal-config.class';

@NgModule({
	imports: [CommonModule],
	declarations: [ModalComponent, ModalAnchor, DraggableHandle, Draggable, Resizable],
	exports: [ModalAnchor],
	providers: [
		{
			provide: ANALYZE_FOR_ENTRY_COMPONENTS,
			useValue: [ModalComponent],
			multi: true
		},
		{
			provide: ModalConfig,
			useValue: ModalConfig
		},
		Modal,
		ModalHelper
	],
	entryComponents: [ModalAnchor]
})
export class ModalModule {
	static withComponents(components: any[]): ModuleWithProviders {
		return {
			ngModule: ModalModule,
			providers: [
				{
					provide: ANALYZE_FOR_ENTRY_COMPONENTS,
					useValue: [...components],
					multi: true
				}
			]
		};
	}
}
