import {
	Component,
	ElementRef,
	Renderer2,
	ChangeDetectionStrategy,
	AfterViewInit,
	OnDestroy,
	NgZone
} from '@angular/core';
import { ModalHelper } from '../modal-helper.service';
import { MouseEventButton } from '../draggable/draggable-handle.directive';
import type { ModalComponent } from '../modal.component';
import { ModalClassNames, ModalDimensionUnits } from '../modal-configuration.class';

@Component({
	selector: 'resizable',
	template: `
		<div
			class="resizable-handle resizable-right"
			(mousedown)="onMousedown($event, 'right')"
			(touchstart)="onMousedown($event, 'right')"
		></div>
		<div
			class="resizable-handle resizable-bottom"
			(mousedown)="onMousedown($event, 'bottom')"
			(touchstart)="onMousedown($event, 'bottom')"
		></div>
		<div
			class="resizable-handle resizable-corner"
			(mousedown)="onMousedown($event, 'both')"
			(touchstart)="onMousedown($event, 'both')"
		>
			<span></span>
		</div>
	`,
	styleUrls: ['./resizable.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class Resizable implements AfterViewInit, OnDestroy {
	private pseudoEl: HTMLElement;

	private mouseDown = false;

	private resizeDirection: 'right' | 'bottom' | 'both';

	private width = 0;

	private height = 0;

	private modalComponentHost: ElementRef;

	private eventDestroyHooks: Function[] = [];

	private resizing = false;

	private parent: ModalComponent = null;

	constructor(
		private renderer: Renderer2,
		private modalHelper: ModalHelper,
		private zone: NgZone
	) {
	}

	public ngAfterViewInit() {
		// don't run it in zone because it will trigger detect changes in component
		this.zone.runOutsideAngular(() => {
			const mouseMoveFn = this.renderer.listen('document', 'mousemove', (event: MouseEvent) => this.onMouseMove(event));
			const toucheMoveFn = this.renderer.listen('document', 'touchmove', (event: MouseEvent) =>
				this.onMouseMove(event)
			);
			const mouseUpFn = this.renderer.listen('document', 'mouseup', (event: MouseEvent) => this.onMouseUp());
			const toucheUpFn = this.renderer.listen('document', 'touchend', (event: MouseEvent) => this.onMouseUp());

			this.eventDestroyHooks.push(mouseMoveFn);
			this.eventDestroyHooks.push(mouseUpFn);
			this.eventDestroyHooks.push(toucheMoveFn);
			this.eventDestroyHooks.push(toucheUpFn);
		});
		// TODO -> check why this setHeight is called here
		// this.parent.getConfiguration().setHeight(this.getHeight());
	}

	public ngOnDestroy(): void {
		this.eventDestroyHooks.forEach(destroyFn => destroyFn());
		this.parent = null;
		this.modalComponentHost = null;
	}

	public setParent(parent: ModalComponent): void {
		this.parent = parent;
		this.modalComponentHost = parent.getHostElementRef();
	}

	public onMousedown(event: MouseEvent, direction: 'right' | 'bottom' | 'both'): void {
		event.preventDefault();
		event.stopPropagation();

		if (this.parent.getConfiguration().isMaximized()) {
			return;
		}

		if (this.isResizePossible() &&
			event.button !== MouseEventButton.Secondary) {
			this.preparePseudoEl();

			this.mouseDown = true;
			this.resizeDirection = direction;
		}
	}

	private isResizePossible(): boolean {
		return this.modalHelper.viewport.width > 600
		|| this.parent.getConfiguration().isDesktopBehaviorPreserved();
	}

	public onMouseUp(): void {
		if (this.mouseDown) {
			this.modalComponentHost.nativeElement.removeChild(this.pseudoEl);
			this.mouseDown = false;

			// change sizes on parent element
			if (this.width) {
				this.parent.getConfiguration().setWidth({ value: this.width, units: ModalDimensionUnits.PIXEL });
			}

			if (this.height) {
				this.parent.getConfiguration().setHeight({ value: this.height, units: ModalDimensionUnits.PIXEL });
			}

			if (this.resizing) {
				this.onStopResizing();
			}

			this.width = this.height = 0;
			this.resizeDirection = null;
		}
	}

	public onMouseMove(event: MouseEvent): void {
		if (this.mouseDown) {
			this.resizing = true;
			this.parent.getConfiguration().addClass(ModalClassNames.RESIZING);
			this.calcNewSize(event);
			this.modalHelper.pauseEvent(event);
		}
	}

	private onStopResizing(): void {
		this.parent.autoFocus();
		this.parent.getConfiguration().removeClass(ModalClassNames.RESIZING);
		this.resizing = false;
	}

	/**
	 * izračun širine ovisno o poziciji pointera i širine ekrana
	 * @param event
	 */
	private calcNewSize(event: MouseEvent) {
		const mousePos = this.modalHelper.getMousePosition(event);

		if (this.resizeDirection === 'right' || this.resizeDirection === 'both') {
			this.width = Math.max(mousePos.x - this.parent.getPositionLeft(),
			this.parent.getConfiguration().getMinWidth().value);
		}

		if (this.resizeDirection === 'bottom' || this.resizeDirection === 'both') {
			this.height = Math.max(mousePos.y - this.parent.getPositionTop(),
			this.parent.getConfiguration().getMinHeight().value);
		}

		if (this.height) {
			this.renderer.setStyle(this.pseudoEl, 'height', this.height.toString() + 'px');
		}

		if (this.width) {
			this.renderer.setStyle(this.pseudoEl, 'width', this.width.toString() + 'px');
		}
	}

	private preparePseudoEl(): void {
		if (!this.pseudoEl) {
			this.pseudoEl = this.renderer.createElement('div');
			this.renderer.appendChild(this.modalComponentHost.nativeElement, this.pseudoEl);
		} else {
			this.modalComponentHost.nativeElement.appendChild(this.pseudoEl);
		}

		this.renderer.addClass(this.pseudoEl, 'modal-pseudo');

		const height = (this.height = this.parent.getHeight());
		const width = (this.width = this.parent.getWidth());

		this.renderer.setStyle(this.pseudoEl, 'height', height.toString() + 'px');
		this.renderer.setStyle(this.pseudoEl, 'width', width.toString() + 'px');

		const minWidth = this.parent.getConfiguration().getMinWidth();
		const minHeight = this.parent.getConfiguration().getMinHeight();

		this.renderer.setStyle(this.pseudoEl, 'min-width', minWidth.toString() + 'px');
		this.renderer.setStyle(this.pseudoEl, 'min-height', minHeight.toString() + 'px');

		const top = this.parent.getPositionTop();
		const left = this.parent.getPositionLeft();

		this.renderer.setStyle(this.pseudoEl, 'top', top.toString() + 'px');
		this.renderer.setStyle(this.pseudoEl, 'left', left.toString() + 'px');
	}
}
