import { Component } from '@angular/core';
import { Modal, IModalComponent, IModalResultData, IModalResult } from '@libusoftcicom/lc-modal';
import { Observable, of } from 'rxjs';

@Component({
	selector: `modal-component-example2`,
	template: `<h1> EXAMPLE </h1>`,
	styles: [``]
})
export class ModalComponentExample2 implements IModalComponent<any> {
	public model = {};

	public isActive: boolean;
	public params: any;
	public title: string;
	constructor(private modal: Modal) {}

	public confirm(data: any) {
		return of<IModalResultData<any>>({
			data: this.model,
			modalResult: IModalResult.Confirm
		});
	}

	public cancel() {
		return of<IModalResultData<any>>({
			modalResult: IModalResult.Cancel
		});
	}

	public setTitle(title: string) {
		this.title = title;
	}
}
