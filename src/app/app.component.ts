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
		let modalResult = await this.modal
			.component(ModalComponentExample2)
			.title('Example modal')
			.setHeight(300)
			.setWidth(400)
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}

	public async openFormModal() {
		let modalResult = await this.modal
			.title('Form modal')
			.setHeight(370)
			.setWidth(700)
			.draggable(false)
			.resizable(true)
			.component(ModalComponentExample)
			.draggable(true)
			.showMaximize(true)
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}

	public async fullScreenModal() {
		let modalResult = await this.modal
			.component(ModalComponentExample2)
			.title('Fullscreen modal')
			.setHeight(370)
			.setWidth(700)
			.setFullScreen()
			.open();
		this.result = modalResult.data;
		this.status = modalResult.modalResult;
	}
}
