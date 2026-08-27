import { ChangeDetectionStrategy, Component, InputSignal, input } from '@angular/core';
import { IModalHeaderComponent, ModalConfiguration } from '@libusoftcicom/lc-modal';

// custom header used for a single modal instance via `.header(CustomHeaderComponent)`
@Component({
	selector: 'custom-modal-header',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="custom-modal-header">
			<span class="custom-modal-header-title">🔧 {{ title() }}</span>
			<button type="button" class="custom-modal-header-close" (click)="close()">&times;</button>
		</div>
	`,
	styles: [`
        :host {
            background: #7c3aed;
                display: block;
                width: 100%;
        }
		.custom-modal-header {
			align-items: center;
			color: #fff;
            display: flex;
            font-weight: 600;
            height: 100%;
            justify-content: space-between;
            padding: 0 10px;
		}
		.custom-modal-header-close {
			background: none;
			border: none;
			color: #fff;
			cursor: pointer;
			font-size: 20px;
			line-height: 1;
		}
	`]
})
export class CustomHeaderComponent implements IModalHeaderComponent {

	public title: InputSignal<string | null> = input.required<string | null>();

	public configuration: InputSignal<ModalConfiguration> = input.required<ModalConfiguration>();

	private closeFn: () => void = () => {};

	public setCloseFn(fn: () => void): void {
		this.closeFn = fn;
	}

	protected close(): void {
		this.closeFn();
	}
}
