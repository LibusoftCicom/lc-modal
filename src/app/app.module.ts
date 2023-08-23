import { BrowserModule } from '@angular/platform-browser';
import { NgModule, inject } from '@angular/core';

import { AppComponent } from './app.component';
import { ModalModule } from '@libusoftcicom/lc-modal';
import { ModalComponentExample } from './modal-example/modal-example.component';
import { ModalComponentExample2 } from './modal-example2/modal-example.component';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalResolve } from './modal-resolve.service';

@NgModule({
	declarations: [AppComponent, ModalComponentExample2, ModalComponentExample],
	imports: [
		BrowserModule,
		FormsModule,
		ModalModule.forRoot({
			bindToComponentInputs: true,
			resolve: ModalResolve
		}),
		RouterModule.forRoot([
			{
				path: 'test',
				loadChildren: () => import('./lazy-loaded-modal/lazy-loaded-example.module')
				.then(module => module.LazyLoadedModule),
			},
			{
				path: 'test2',
				loadChildren: () => import('./lazy-loaded-modal2/lazy-loaded-example.module')
				.then(module => module.LazyLoadedModule)
			}
		])
	],
	providers: [
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
