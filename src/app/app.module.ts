import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { ModalModule } from '@libusoftcicom/lc-modal';
import { ModalComponentExample } from './modal-example/modal-example.component';
import { ModalComponentExample2 } from './modal-example2/modal-example.component';

import { FormsModule } from '@angular/forms';
@NgModule({
	declarations: [AppComponent, ModalComponentExample2, ModalComponentExample],
	imports: [
		BrowserModule,
		FormsModule,
		CommonModule,
		ModalModule.withComponents([ModalComponentExample, ModalComponentExample2])
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
