import {
	Component,
	OnInit,
	AfterViewInit,
	ViewContainerRef,
	ElementRef,
	ViewChild,
	ComponentRef,
	HostListener,
	Renderer2,
	OnDestroy
} from '@angular/core';
import { Subject } from 'rxjs';
import { IModalDimensions } from './modal-types.class';
import { ModalConfig } from './modal-config.class';

@Component({
	selector: `modal-component`,
	template: `
		<div class="modal-box" #modalBox draggable>
			<div
				*ngIf="_showMaximize"
				class="fa modal-header-btn maximize-btn"
				[ngClass]="{ 'fa-window-maximize': !maximized, 'fa-window-restore': maximized }"
				(click)="_maximizeRestore()"
			></div>
			<div *ngIf="_showClose" class="modal-header-btn close-btn" (click)="_closeFn()"></div>
			<div *ngIf="!!title && isDraggable" class="modal-header" (dblclick)="toggleMaximize()" draggable-handle>
				<span class="modal-title">{{ title }}</span>
			</div>
			<div *ngIf="!!title && !isDraggable" class="modal-header" (dblclick)="toggleMaximize()">
				<span class="modal-title">{{ title }}</span>
			</div>
			<div class="modal-body">
				<div class="modal-content">
					<ng-template #content></ng-template>
				</div>
			</div>
			<resizable *ngIf="isResizable"></resizable>
		</div>
	`,
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('content', { static: true, read: ViewContainerRef })
	private contentRef: ViewContainerRef;

	@ViewChild('modalBox', { static: true }) private modalBox: ElementRef;

	public title: string;

	public _showClose = false;

	public _showMaximize = false;

	public maximized = false;

	public maximize: Subject<boolean>;

	private _closeByESC = false;

	private _closeByDocument = false;

	public _closeFn: () => void;

	private hostElementRef: ElementRef;

	public isActive = false;

	public isDraggable = false;

	public isResizable = false;

	private eventDestroyHooks: Function[] = [];

	public _focusOnChange: Element = null;

	public resizeObserver: Subject<IModalDimensions> = new Subject();

	private _initMinHeight;

	private _initMinWidth;

	constructor(vcRef: ViewContainerRef, private renderer: Renderer2, private config: ModalConfig) {
		this.hostElementRef = vcRef.element;
	}

	public ngOnInit(): void {
		// on resize we clear this._boundBox
		this.eventDestroyHooks.push(
			this.renderer.listen('window', 'resize', () => {
				this._boundBox = null;

				// recalculate new position
				// just return all modals inside bound box
				if (this.isDraggable) {
					const left = this.getPositionLeft();
					const top = this.getPositionTop();

					this.setLeftPosition(left);
					this.setTopPosition(top);
				}

				const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

				if (width < 600) {
					this.clearMinHeight();
					this.clearMinWidth();
				} else {
					if (this._initMinHeight != null) {
						this.minHeight(this._initMinHeight);
					}

					if (this._initMinWidth != null) {
						this.minWidth(this._initMinWidth);
					}
				}
			})
		);

		this.maximize.asObservable().subscribe(maximized => {
			this.maximized = maximized;
		});
	}

	public ngAfterViewInit(): void {
		setTimeout(() => this.autoFocus(), 100);
	}

	public ngOnDestroy(): void {
		this.eventDestroyHooks.forEach(destroyFn => destroyFn());
		this._focusOnChange = null;
	}

	/**
	 * Set modal title
	 */
	public setTitle(title: string): ModalComponent {
		this.title = title;
		return this;
	}

	/**
	 * Shows maximize/minimize button
	 */
	public showMaximize(show: boolean): ModalComponent {
		this._showMaximize = show;
		return this;
	}

	/**
	 * on double click toggle modal size
	 */
	public toggleMaximize() {
		if (!this._showMaximize) {
			return;
		}

		this._maximizeRestore();
	}

	/**
	 * Enable close button show
	 */
	public showClose(): ModalComponent {
		this._showClose = true;
		return this;
	}

	/**
	 * enable close by ESC
	 */
	public closeOnESC(): ModalComponent {
		this._closeByESC = true;
		return this;
	}

	public closeOnClick(): ModalComponent {
		this._closeByDocument = true;
		return this;
	}

	/**
	 * set method used on X button
	 */
	public setCloseFn(fn: () => void): ModalComponent {
		this._closeFn = fn;
		return this;
	}

	public setClass(className: string): ModalComponent {
		return this.changeClass(className);
	}

	public removeClass(className: string): ModalComponent {
		return this.changeClass(className, false);
	}

	private changeClass(className: string, add: boolean = true): ModalComponent {
		if (add === true) {
			this.renderer.addClass(this.hostElementRef.nativeElement, className);
		} else {
			this.renderer.removeClass(this.hostElementRef.nativeElement, className);
		}
		return this;
	}

	public addComponent(componentFactory: any): ComponentRef<{}> {
		return this.contentRef.createComponent(componentFactory);
	}

	public height(value: number, units: string = 'px'): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'height', value.toString() + units);
	}

	public minHeight(value: number): void {
		if (this._initMinHeight == null) {
			this._initMinHeight = value;
		}
		this.renderer.setStyle(this.modalBox.nativeElement, 'minHeight', value.toString() + 'px');
	}

	public getMinHeight() {
		return this._initMinHeight || 0;
	}

	public clearMinHeight(): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minHeight', null);
	}

	public width(value: number, units: string = 'px'): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'width', value.toString() + units);
	}

	public minWidth(value: number): void {
		if (this._initMinWidth == null) {
			this._initMinWidth = value;
		}
		this.renderer.setStyle(this.modalBox.nativeElement, 'minWidth', value.toString() + 'px');
	}

	public getMinWidth() {
		return this._initMinWidth || 0;
	}

	public clearMinWidth(): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minWidth', null);
	}
	/**
	 * @description return element height with padding and border
	 *
	 * offsetHeight -> height + padding + border / https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
	 * clientHeight -> height + padding / https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight
	 */
	public getHeight(): number {
		const el = this.modalBox.nativeElement;
		return el.offsetHeight || el.clientHeight;
	}

	/**
	 * @description return element width with padding and border
	 */
	public getWidth(): number {
		const el = this.modalBox.nativeElement;
		return el.offsetWidth || el.clientWidth;
	}

	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
	 * getBoundingClientRect -> problem is because WebKit recalculate layout each time you call it
	 */
	public getClientRects(): ClientRect {
		const el = this.modalBox.nativeElement;
		return el.getBoundingClientRect();
	}

	/**
	 * compatible with IE
	 * will typically force style recalc
	 */
	public getStyles(): CSSStyleDeclaration {
		const el = this.modalBox.nativeElement;
		return el.currentStyle || window.getComputedStyle(el, null);
	}

	/**
	 * get element calculated moragins
	 */
	public getMargins(): {
		top: number;
		left: number;
		bottom: number;
		right: number;
	} {
		const styles = this.getStyles();
		const top = parseInt(styles.marginTop);
		const bottom = parseInt(styles.marginBottom);
		const left = parseInt(styles.marginLeft);
		const right = parseInt(styles.marginRight);

		return { top, left, bottom, right };
	}

	private _positionLeft: number;
	private _positionTop: number;

	/**
	 * set position relative to parent overlay
	 * @param  top
	 * @param  left
	 */
	public setPosition(top: number, left: number): void {
		if (top !== null) {
			this.setTopPosition(top);
		}

		if (left !== null) {
			this.setLeftPosition(left);
		}
	}

	/**
	 * helper method to determinate new postion according to boundbox
	 * @param  dir
	 * @param  position
	 */
	private checkBoundBox(dir: 'left' | 'top', position: number): number {
		if (dir == 'left') {
			const boundboxWidth = this.getBoundbox().width;

			if (position > boundboxWidth - 30) {
				return boundboxWidth - 30;
			}

			const n = 0 - this.getWidth() + 60;
			if (position < n) {
				return n;
			}

			return position;
		} else {
			const boundboxHeight = this.getBoundbox().height;

			if (position > boundboxHeight - 30) {
				return boundboxHeight - 30;
			}

			if (position < 0) {
				return 0;
			}

			return position;
		}
	}

	/**
	 * set left position relative to parent overlay
	 * @param  left
	 */
	public setLeftPosition(left: number): void {
		this._positionLeft = this.checkBoundBox('left', left);
		this.renderer.setStyle(this.modalBox.nativeElement, 'left', this._positionLeft.toString() + 'px');
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginLeft', '0');
	}

	/**
	 * set top position relative to parent overlay
	 * @param  top
	 */
	public setTopPosition(top: number): void {
		this._positionTop = this.checkBoundBox('top', top);
		this.renderer.setStyle(this.modalBox.nativeElement, 'top', this._positionTop.toString() + 'px');
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginTop', '0');
	}

	/**
	 * get left position relative to parent overlay
	 * @return
	 */
	public getPositionLeft(): number {
		if (this._positionLeft != null) {
			return this._positionLeft;
		}

		return (this._positionLeft = this.getClientRects().left);
	}

	/**
	 * get top position relative to parent overlay
	 * @return
	 */
	public getPositionTop(): number {
		if (this._positionTop != null) {
			return this._positionTop;
		}

		return (this._positionTop = this.getClientRects().top);
	}

	private _boundBox: { height: number; width: number } = null;

	public getBoundbox(): { height: number; width: number } {
		if (this._boundBox) {
			return this._boundBox;
		}
		const hostEl = this.hostElementRef.nativeElement;
		const height = hostEl.offsetHeight || hostEl.clientHeight;
		const width = hostEl.offsetWidth || hostEl.clientWidth;
		return (this._boundBox = { height, width });
	}

	private invokeElementMethod(element: any, methodName: string): void {
		if (methodName == 'focus' && element.setActive) {
			element.setActive();
			return;
		}
		if (element[methodName]) {
			element[methodName]();
		}
	}

	@HostListener('click', ['$event'])
	public documentCloseListener(event: MouseEvent): void {
		const targetEl = event.target || event.srcElement;

		if (this._closeByDocument && this._closeFn && this.hostElementRef.nativeElement === targetEl) {
			this._closeFn();
		}

		if (this.hostElementRef.nativeElement === targetEl) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	public get focusOnChange() {
		return this._focusOnChange;
	}

	public set focusOnChange(el: Element) {
		this._focusOnChange = el;
	}

	public autoFocus() {
		const focusOnParentClosing = this._focusOnChange;
		if (focusOnParentClosing) {
			if (document.activeElement === focusOnParentClosing) {
				return;
			}
			const focusableElements = this.filterAllowed(<HTMLElement>focusOnParentClosing);
			if (focusableElements.length > 0) {
				this.handleFocus(focusOnParentClosing);
				return;
			}
			this.invokeElementMethod(document.activeElement, 'blur');
		}

		// else focus other elements
		const el = this.hostElementRef.nativeElement;
		// Browser's (Chrome 40, Forefix 37, IE 11) don't appear to honor
		// autofocus on the dialog, but we should
		const autoFocusEl = (<HTMLElement>el).querySelector(this.config.AutoFocusSelectors);

		if (autoFocusEl !== null) {
			if (document.activeElement === autoFocusEl) {
				return;
			}

			this.handleFocus(autoFocusEl);
			return;
			// Autofocus element might was display: none, so let's continue
		}

		const focusableElements = this.filterAllowed(el);

		if (focusableElements.length > 0) {
			this.handleFocus(focusableElements[0]);
			return;
		}

		// if there is nothing to focus we should at least move focus from active element
		this.invokeElementMethod(document.activeElement, 'blur');
	}

	@HostListener('keydown', ['$event'])
	public trapFocusKeydown(event: KeyboardEvent): void {
		const isTab = event.keyCode === 9;
		const backward = event.shiftKey === true;

		if (isTab) {
			this.handleTabKey(event, backward);
		}
	}

	public focusNext(event: KeyboardEvent): void {
		this.handleTabKey(event, false);
	}

	public focusPrevious(event: KeyboardEvent): void {
		this.handleTabKey(event, true);
	}

	private handleTabKey(event: KeyboardEvent, backward: boolean): void {
		const el = this.hostElementRef.nativeElement;

		const focusableElements = this.filterAllowed(el);
		if (focusableElements.length === 0) {
			if (document.activeElement) {
				this.invokeElementMethod(document.activeElement, 'blur');
			}
			return;
		}

		const currentFocus: any = document.activeElement;

		/**
		 * IE fix - micanje selectiona na input polju na blur eventu
		 */
		if (
			['INPUT'].includes(currentFocus.tagName) &&
			currentFocus.type &&
			currentFocus.type.toLowerCase() !== 'radio' &&
			currentFocus.type.toLowerCase() !== 'checkbox'
		) {
			if (currentFocus['selectionStart']) {
				currentFocus['selectionStart'] = 0;
			}
			if (currentFocus['selectionEnd']) {
				currentFocus['selectionEnd'] = 0;
			}
			document.body.focus();
		}

		const focusIndex = focusableElements.indexOf(currentFocus);

		const isFocusIndexUnknown = focusIndex === -1;
		const isFirstElementFocused = focusIndex === 0;
		const isLastElementFocused = focusIndex === focusableElements.length - 1;

		if (backward) {
			if (isFocusIndexUnknown || isFirstElementFocused) {
				this.handleFocus(focusableElements[focusableElements.length - 1]);
			} else {
				this.handleFocus(focusableElements[focusIndex - 1]);
			}
		} else {
			if (isFocusIndexUnknown || isLastElementFocused) {
				this.handleFocus(focusableElements[0]);
			} else {
				this.handleFocus(focusableElements[focusIndex + 1]);
			}
		}

		event.preventDefault();
		event.stopPropagation();
	}

	/**
	 * method used when we need to focus|select element on component creation
	 * or when user use tab to focus|select next element
	 * action depends about element type
	 * @param element
	 */
	private handleFocus(element: Element): void {
		// TEXTAREA does not need to be selected
		const action: 'focus' | 'select' = ['INPUT'].includes(element.tagName) ? 'select' : 'focus';
		// Calling element.select() will not necessarily focus the input,
		// so call focus before
		try {
			this.invokeElementMethod(element, 'focus');
			this.invokeElementMethod(element, action);
		} catch (e) {
			/**
			 * we don't catch Error
			 * because in this moment element which we try
			 * to focus may be hidden -> IE fix -> to prevent page break
			 */
		}
	}

	private getFocusableElements(element: HTMLElement): Element[] {
		// ako element ima parent i ako nije riječ o modal-component elementu
		// koji je root element modalnog prikaza
		// krenut ćemo od njega kako bi i prosljeđeni element uzeli u obzir
		if (element.parentElement && element.tagName !== 'MODAL-COMPONENT') {
			element = element.parentElement;
		}

		const rawElements = element.querySelectorAll(this.config.FocusableSelectors);

		// Ignore untabbable elements, ie. those with tabindex = -1
		const tabbableEl = this.filterTabbableElements(rawElements);

		return this.filterVisibleElements(<HTMLElement[]>tabbableEl);
	}

	private filterTabbableElements(elements: NodeListOf<Element>): Element[] {
		const filtered = [];

		for (let i = 0; i < elements.length; i++) {
			const element = <HTMLElement>elements[i];
			if (element.tabIndex !== -1) {
				filtered.push(element);
			}
		}
		return filtered;
	}

	private filterVisibleElements(elements: HTMLElement[]): Element[] {
		return elements.filter((element: HTMLElement) => element.offsetWidth > 0 || element.offsetHeight > 0);
	}

	/**
	 * filter element which we need to ignore
	 * this method isn't used on focus with `tab`,
	 * because there we need to be able go through
	 * toolbar buttons
	 * @param el
	 */
	private filterAllowed(el: HTMLElement): Element[] {
		const focusableElements = this.getFocusableElements(el);

		if (focusableElements.length > 0) {
			// filter ignore elements
			// to prevent focusing unavailable element
			const ignoreElements = Array.from((<HTMLElement>el).querySelectorAll(this.config.IgnoreFocusSelectors));

			if (ignoreElements.length > 0) {
				return focusableElements.filter((element: Element) => ignoreElements.indexOf(element) == -1);
			}

			return focusableElements;
		}

		return [];
	}

	public get hostElement(): HTMLElement {
		return this.hostElementRef.nativeElement;
	}

	public _maximizeRestore() {
		this.maximize.next(!this.maximized);
	}
}
