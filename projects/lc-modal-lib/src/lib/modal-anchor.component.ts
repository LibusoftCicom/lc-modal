import { Component, ViewContainerRef, ViewChild, OnInit, OnDestroy, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Modal } from './modal.service';
import { Subscription, merge } from 'rxjs';

@Component({
	selector: 'dialog-anchor',
	template: `
		<ng-template #content></ng-template>
	`
})
export class ModalAnchor implements OnInit, OnDestroy {
	private subscriptions: Array<Subscription> = [];
	private scrollPosition: number | null = null;
	private view: Window;
	private body: Body;

	@ViewChild('content', { static: true, read: ViewContainerRef })
	private viewContainerRef: ViewContainerRef;

	constructor(private modal: Modal, private renderer: Renderer2, @Inject(DOCUMENT) private document: any) {
		this.view = document.defaultView;
		this.body = document.body;

		if (this.view && this.body) {
			this.subscriptions.push(
				merge(this.modal.openChange, this.modal.closeChange).subscribe(() => this.adjustBody())
			);
		}
	}

	public ngOnInit(): void {
		this.modal.setViewContainerRef(this.viewContainerRef);
	}

	public ngOnDestroy() {
		this.modal.destroyAllAsObservable();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
		this.subscriptions.length = 0;
		this.modal.setViewContainerRef(null);
	}

	/**
	 * adjust body position
	 * and prevent window scroll
	 */
	private adjustBody(): void {
		const modals = this.modal.length;
		if (this.scrollPosition == null) {
			this.scrollPosition = this.view.pageYOffset;
		}

		const overlayCount = this.modal.modals.find((modal) => modal.overlayVisible);

		if (modals > 0 && !!overlayCount) {
			this.renderer.setStyle(this.body, 'overflow', 'hidden');
			this.renderer.setStyle(this.body, 'position', 'fixed');
			this.renderer.setStyle(this.body, 'left', 0);
			this.renderer.setStyle(this.body, 'right', 0);
			this.renderer.setStyle(this.body, 'top', `-${this.scrollPosition}px`);
			// this.renderer.setStyle(this.body, 'overscrollBehavior', 'none');
		} else {
			this.renderer.removeStyle(this.body, 'overflow');
			this.renderer.removeStyle(this.body, 'position');
			this.renderer.removeStyle(this.body, 'left');
			this.renderer.removeStyle(this.body, 'right');
			this.renderer.removeStyle(this.body, 'top');
			// this.renderer.removeStyle(this.body, 'overscrollBehavior');
			this.view.scrollTo(0, this.scrollPosition);
			this.scrollPosition = null;
		}
	}
}
