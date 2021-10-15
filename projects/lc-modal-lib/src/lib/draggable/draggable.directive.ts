import { Directive, Optional, Host, SkipSelf, ElementRef } from '@angular/core';
import { ModalHelper } from './../modal-helper.service';
import { ModalClassNames } from '../modal-configuration.class';
import { ModalComponent } from '../modal.component';

@Directive({ selector: '[draggable]' })
export class Draggable {
	constructor(
		@Optional()
		@Host()
		@SkipSelf()
		private parent: ModalComponent,
		private modalHelper: ModalHelper
	) { }

	public isActive(): boolean {
		return this.parent.isActive;
	}

	public autoFocus(): void {
		this.parent.autoFocus();
	}

	public height(): number {
		if (this.parent.getConfiguration().isCollapsed()) {
			return this.parent.getConfiguration().getHeight();
		}
		return this.parent.getHeight();
	}

	public width(): number {
		return this.parent.getWidth();
	}

	public get hostElement(): ElementRef {
		return <ElementRef>(<any>this.parent).hostElementRef;
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
