import { Component } from '@angular/core';
import { Modal } from '@libusoftcicom/lc-modal';
import { ModalComponentExample } from './modal-example/modal-example.component';
import { ModalComponentExample2 } from './modal-example2/modal-example.component';

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
			.loadComponent(async () => import('./modal-example2/modal-example.component').then((m) => m.ModalComponentExample2))
			.title('Example modal')
			.preserveDesktopBehavior(true)
			.draggable(true)
			.resizable(true)
			.overlay(false)
			.showMaximize(false)
			.showCollapse(true)
			.positionOnScreenCenter(true)
			.setWidth(500)
			.setHeight(600)
			.setMaxHeight(700)
			.preOpen(async () => {
				return true;
			})
			.params({
				id: 12,
				selected: 1,
				data: {},
				GUID: 'ddef390b-3b5c-4341-a192-393adbf04c16'
			})
			.open();
		this.result = modalResult.data;
		this.status = modalResult.type;
	}

	public async modalExample() {
		const modal = this.modal
			.title('Message box example')
			.closeOnError()
			.positionOnScreenCenter(true)
			.draggable(false)
			.setOrder(50000)
			.addClass('message-box')
			.component(ModalComponentExample2);

			modal.closeOnlyByUser = false;
			modal.open();
	}

	public async openFormModal() {
		const result = await this.modal
			.title('Form modal')
			.setHeight(370)
			.setWidth(700)
			.resizable(true)
			.component(ModalComponentExample)
			.draggable(true)
			.showMaximize(true)
			.open();
		this.result = result.data;
		this.status = result.type;
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
		this.status = modalResult.type;
	}

	public async withoutHeaderModal() {
		const modalResult = await this.modal
			.component(ModalComponentExample)
			.setHeight(370)
			.setWidth(700)
			.open();
		this.result = modalResult.data;
		this.status = modalResult.type;
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
		this.status = modalResult.type;
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
		this.status = result.type;
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
		this.status = result.type;
	}
}
