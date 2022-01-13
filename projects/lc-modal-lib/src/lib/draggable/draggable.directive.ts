import { Directive, OnDestroy, ElementRef } from '@angular/core';
import { ModalHelper } from './../modal-helper.service';
import { ModalClassNames } from '../modal-configuration.class';
import type { ModalComponent } from '../modal.component';

@Directive({ selector: '[draggable]' })
export class Draggable implements OnDestroy {
	private parent: ModalComponent = null;

	private hostElementRef: ElementRef = null;

	constructor(private modalHelper: ModalHelper) { }

	public ngOnDestroy(): void {
		this.parent =
		this.hostElementRef = null;
	}

	public setParent(parent: ModalComponent): void {
		this.parent = parent;
		this.hostElementRef = parent.getHostElementRef();
	}

	public isActive(): boolean {
		return this.parent.isActive;
	}

	public autoFocus(): void {
		this.parent.autoFocus();
	}

	public height(): number {
		return this.parent.getHeight();
	}

	public width(): number {
		return this.parent.getWidth();
	}

	public get hostElement(): ElementRef {
		return this.hostElementRef;
	}

	public left(): number {
		return this.parent.getPositionLeft();
	}

	public top(): number {
		return this.parent.getPositionTop();
	}

	public setLeftPosition(pos: number): void {
		this.parent.getConfiguration().setLeftPosition(pos);
	}

	public setTopPosition(pos: number): void {
		this.parent.getConfiguration().setTopPosition(pos);
	}

	public setClass(): void {
		this.parent.getConfiguration().addClass(ModalClassNames.DRAGGING);
	}

	public removeClass(): void {
		this.parent.getConfiguration().removeClass(ModalClassNames.DRAGGING);
	}

	public set focusOnChange(el: Element) {
		this.parent.focusOnChange = el;
	}

	public isDraggingPossible(): boolean {
		return this.modalHelper.viewport.width > 600
		|| this.parent.getConfiguration().isDesktopBehaviorPreserved();
	}
}
