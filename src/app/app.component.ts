import { Component } from '@angular/core';
import { Modal, IModalResult } from '@libusoftcicom/lc-modal';
import { ModalComponentExample } from './modal-example/modal-example.component';
import { ModalComponentExample2 } from './modal-example2/modal-example.component';
import { IModalResultData } from 'projects/lc-modal-lib/src/lc-modal';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	public result: Object;
	public status: Object;
	constructor(private modal: Modal) {}

	public async example() {
		const modalResult = await this.modal
			.component(ModalComponentExample2)
			.title('Example modal')
			.setHeight(300)
			.setWidth(400)
			.draggable(true)
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}

	public async modalExample() {
		const modal = this.modal
			.title('Message box example')
			.closeOnError()
			.positionOnScreenCenter(true)
			.draggable(false)
			.setClass('message-box')
			.component(ModalComponentExample2);

			modal.closeOnlyByUser = false;
			modal.open();
	}

	public async openFormModal() {
		const result = await this.modal
			.title('Form modal')
			.setHeight(370)
			.setWidth(700)
			.draggable(false)
			.resizable(true)
			.component(ModalComponentExample)
			.draggable(true)
			.showMaximize(true)
			.open();
		this.result = result.data;
		this.status = result.modalResult;
	}

	public async fullScreenModal() {
		const modalResult = await this.modal
			.component(ModalComponentExample2)
			.title('Fullscreen modal')
			.setHeight(370)
			.setWidth(700)
			.setFullScreen()
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}

	public async withoutHeaderModal() {
		const modalResult = await this.modal
			.component(ModalComponentExample)
			.setHeight(370)
			.setWidth(700)
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}

	public async withoutOverlayModal() {
		const modalResult = await this.modal
			.component(ModalComponentExample)
			.setHeight(370)
			.setWidth(700)
			.draggable(true)
			.overlay(false)
			.showMaximize(true)
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}

	public async withSizeLimitModal() {
		const result = await this.modal
			.title('Form modal')
			.component(ModalComponentExample2)
			.setHeight(370)
			.setMaxHeight(500)
			.setWidth(700)
			.setMaxWidth(800)
			.draggable(true)
			.resizable(true)
			.showMaximize(true)
			.open();
		this.result = result.data;
		this.status = result.modalResult;
	}

	public async withCollapseModal() {
		const result = await this.modal
			.title('Form modal')
			.component(ModalComponentExample)
			.draggable(true)
			.resizable(true)
			.offsetLeft(52)
			.offsetTop(83)
			.overlay(false)
			.showMaximize(true)
			.showCollapse(true)
			.preserveDesktopBehavior()
			.open();
		this.result = result.data;
		this.status = result.modalResult;
	}
}
