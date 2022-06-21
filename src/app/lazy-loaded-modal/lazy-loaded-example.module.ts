import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { ModalModule } from '@libusoftcicom/lc-modal';
import { ModalComponentExample } from './modal-example/modal-example.component';


import { FormsModule } from '@angular/forms';
import { LazyLoadedBaseComponent } from './lazy-loaded.base.component';
import { Router, RouterModule } from '@angular/router';
import { LazyLoadedService } from './lazy-loaded.service';
@NgModule({
	declarations: [LazyLoadedBaseComponent, ModalComponentExample],
	imports: [
		FormsModule,
		CommonModule,
		ModalModule,
		RouterModule.forChild([
			{
				path: '',
				component: LazyLoadedBaseComponent
			}
		])
	],
	providers: [LazyLoadedService]
})
export class LazyLoadedModule {}
