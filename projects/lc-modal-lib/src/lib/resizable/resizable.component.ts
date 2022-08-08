import {
	Component,
	ElementRef,
	Renderer2,
	ChangeDetectionStrategy,
	AfterViewInit,
	OnDestroy,
	NgZone,
	Inject,
	ViewChild
} from '@angular/core';
import { ModalHelper } from '../modal-helper.service';
import { MouseEventButton } from '../draggable/draggable-handle.directive';
import type { ModalComponent } from '../modal.component';
import { ModalClassNames, ModalDimensionUnits } from '../modal-configuration.class';
import { DOCUMENT } from '@angular/common';
import { fromEvent, merge, Subscription } from 'rxjs';

@Component({
	selector: 'resizable',
	template: `
		<div #resizableRightEl class="resizable-handle resizable-right"></div>
		<div #resizableBottomEl class="resizable-handle resizable-bottom"></div>
		<div #resizableCornerEl class="resizable-handle resizable-corner">
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

	private subscriptions: Subscription[] = [];

	private resizing = false;

	private parent: ModalComponent = null;

	@ViewChild('resizableRightEl')
	public resizableRightEl: ElementRef<HTMLDivElement>;

	@ViewChild('resizableBottomEl')
	public resizableBottomEl: ElementRef<HTMLDivElement>;

	@ViewChild('resizableCornerEl')
	public resizableCornerEl: ElementRef<HTMLDivElement>;

	constructor(
		private renderer: Renderer2,
		private modalHelper: ModalHelper,
		private zone: NgZone,
		@Inject(DOCUMENT) private readonly document
	) {
	}

	public ngAfterViewInit() {
		// don't run it in zone because it will trigger detect changes in component
		this.zone.runOutsideAngular(() => {
			this.subscriptions.push(
				merge(
					fromEvent(this.document, 'mousemove'),
					fromEvent(this.document, 'touchmove', { passive: true }),
				)
				.subscribe((event: MouseEvent | TouchEvent) => this.onMouseMove(event))
			);

			this.subscriptions.push(
				merge(
					fromEvent(this.document, 'mouseup'),
					fromEvent(this.document, 'touchend'),
				)
				.subscribe(() => this.onMouseUp())
			);

			this.subscriptions.push(
				merge(
					fromEvent(this.resizableRightEl.nativeElement, 'mousedown'),
					fromEvent(this.resizableRightEl.nativeElement, 'touchstart', { passive: true })
				)
				.subscribe((event: MouseEvent | TouchEvent) => this.onMousedown(event, 'right'))
			);

			this.subscriptions.push(
				merge(
					fromEvent(this.resizableBottomEl.nativeElement, 'mousedown'),
					fromEvent(this.resizableBottomEl.nativeElement, 'touchstart', { passive: true })
				)
				.subscribe((event: MouseEvent | TouchEvent) => this.onMousedown(event, 'bottom'))
			)

			this.subscriptions.push(
				merge(
					fromEvent(this.resizableCornerEl.nativeElement, 'mousedown'),
					fromEvent(this.resizableCornerEl.nativeElement, 'touchstart', { passive: true })
				)
				.subscribe((event: MouseEvent | TouchEvent) => this.onMousedown(event, 'both'))
			)
		});
		// TODO -> check why this setHeight is called here
		// this.parent.getConfiguration().setHeight(this.getHeight());
	}

	public ngOnDestroy(): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
		this.subscriptions.length = 0;
		this.parent = null;
		this.modalComponentHost = null;
	}

	public setParent(parent: ModalComponent): void {
		this.parent = parent;
		this.modalComponentHost = parent.getHostElementRef();
	}

	private onMousedown(event: MouseEvent | TouchEvent, direction: 'right' | 'bottom' | 'both'): void {
		event.stopPropagation();

		if (this.parent.getConfiguration().isMaximized()) {
			return;
		}

		if (this.isResizePossible() &&
			(event as MouseEvent).button !== MouseEventButton.Secondary) {
			this.preparePseudoEl();

			this.mouseDown = true;
			this.resizeDirection = direction;
		}
	}

	private isResizePossible(): boolean {
		return this.modalHelper.viewport.width > 600
		|| this.parent.getConfiguration().isDesktopBehaviorPreserved();
	}

	private onMouseUp(): void {
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

	private onMouseMove(event:  MouseEvent | TouchEvent): void {
		if (this.mouseDown) {
			if (!event.type.includes('touch')) {
				this.modalHelper.pauseEvent(event as MouseEvent);
			}
			this.resizing = true;
			this.parent.getConfiguration().addClass(ModalClassNames.RESIZING);
			this.calcNewSize(event);
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
	private calcNewSize(event:  MouseEvent | TouchEvent) {
		const mousePos = this.modalHelper.getMousePosition(event);
		const widthUnit = ModalDimensionUnits.PIXEL;
		const heightUnit = ModalDimensionUnits.PIXEL;

		if (this.resizeDirection === 'right' || this.resizeDirection === 'both') {
			const width = this.parent.getConfiguration().getMinWidth()?.value;
			const maxWidth = this.parent.getConfiguration().getMaxWidth()?.value;

			this.width = Math.max(mousePos.x - this.parent.getPositionLeft(), width);
			if (maxWidth &&
				this.parent.getConfiguration().getMaxWidth()?.units === ModalDimensionUnits.PIXEL) {
				this.width = Math.min(maxWidth, this.width);
			}
		}

		if (this.resizeDirection === 'bottom' || this.resizeDirection === 'both') {
			const height = this.parent.getConfiguration().getMinHeight()?.value;
			const maxHeight = this.parent.getConfiguration().getMaxHeight()?.value;

			this.height = Math.max(mousePos.y - this.parent.getPositionTop(), height);
			// TODO -> use ModalDimensionUnits.PERCENTAGE in calculation
			if (maxHeight &&
				this.parent.getConfiguration().getMaxHeight()?.units === ModalDimensionUnits.PIXEL) {
				this.height = Math.min(maxHeight, this.height);
			}
		}

		if (this.height) {
			this.renderer.setStyle(this.pseudoEl, 'height', `${this.height}${heightUnit}`);
		}

		if (this.width) {
			this.renderer.setStyle(this.pseudoEl, 'width', `${this.width}${widthUnit}`);
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

		if (minWidth) {
			this.renderer.setStyle(this.pseudoEl, 'min-width', `${minWidth}px`);
		}

		if (minHeight) {
			this.renderer.setStyle(this.pseudoEl, 'min-height', `${minHeight}px`);
		}

		const top = this.parent.getPositionTop();
		const left = this.parent.getPositionLeft();

		this.renderer.setStyle(this.pseudoEl, 'top', top.toString() + 'px');
		this.renderer.setStyle(this.pseudoEl, 'left', left.toString() + 'px');
	}
}
