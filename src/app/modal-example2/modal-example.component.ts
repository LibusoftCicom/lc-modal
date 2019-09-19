import { Component } from '@angular/core';
import { BaseModalComponent } from '@libusoftcicom/lc-modal';

@Component({
	selector: `modal-component-example2`,
	template: `<h1> EXAMPLE </h1>`,
	styles: [``]
})
export class ModalComponentExample2 extends BaseModalComponent<{}> {
	public model = {};
}
