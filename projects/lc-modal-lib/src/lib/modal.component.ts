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
	OnDestroy,
	ComponentFactory
} from '@angular/core';
import { Subject } from 'rxjs';
import { IModalDimensions } from './modal-types.class';
import { ModalConfig } from './modal-config.class';
import { IHostModalComponent } from './modal-component.interface';

@Component({
	selector: `modal-component`,
	templateUrl: `./modal.component.html`,
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, AfterViewInit, OnDestroy, IHostModalComponent {

	@ViewChild('content', { static: true, read: ViewContainerRef })
	private contentRef: ViewContainerRef;

	@ViewChild('modalBox', { static: true })
	private modalBox: ElementRef;

	private escCloseEnabled = false;

	private closeByDocumentEnabled = false;

	private hostElementRef: ElementRef;

	private eventDestroyHooks: Function[] = [];

	private initMinHeight: number;

	private initMaxHeight: number;

	private initMinWidth: number;

	private initMaxWidth: number;

	private positionLeft: number;

	private positionTop: number;

	public title: string;

	public closeEnabled = false;

	public maximizeEnabled = false;

	public maximized = false;

	/**
	 * currently value is set from modal-factory
	 */
	public maximize: Subject<boolean>;

	public closeFn: () => void;

	public isActive = false;

	public isDraggable = false;

	public isResizable = false;

	public focusOnChangeElement: Element = null;

	public readonly resizeObserver: Subject<IModalDimensions> = new Subject();

	constructor(vcRef: ViewContainerRef,
		private renderer: Renderer2, private config: ModalConfig) {
		this.hostElementRef = vcRef.element;
	}

	public ngOnInit(): void {
		// on resize we clear this._boundBox
		this.eventDestroyHooks.push(
			this.renderer.listen('window', 'resize', () => {

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
					if (this.initMinHeight != null) {
						this.minHeight(this.initMinHeight);
					}

					if (this.initMinWidth != null) {
						this.minWidth(this.initMinWidth);
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
		this.focusOnChangeElement = null;
	}

	public get headerVisible(): boolean {
		return !!this.title;
	}

	public displayOverlay(visible: boolean = true): void {
		if (visible !== true) {
			this.renderer.addClass(this.hostElementRef.nativeElement, 'without-overlay');
		} else {
			this.renderer.removeClass(this.hostElementRef.nativeElement, 'without-overlay');
		}
	}

	public display(isVisible: boolean): void {
		if (this.hostElementRef) {
			this.renderer.setStyle(this.hostElementRef.nativeElement, 'display', isVisible ? 'block' : 'none');
		}
	}

	/**
	 * Set modal title
	 */
	public setTitle(title: string): this {
		this.title = title;
		return this;
	}

	/**
	 * display maximize/minimize button
	 */
	public showMaximize(show: boolean): this {
		this.maximizeEnabled = show;
		return this;
	}

	/**
	 * on double click toggle modal size
	 */
	public toggleMaximize() {
		if (!this.maximizeEnabled) {
			return;
		}

		this.maximizeRestore();
	}

	/**
	 * display close button
	 */
	public showClose(): this {
		this.closeEnabled = true;
		return this;
	}

	/**
	 * enable close by ESC
	 */
	public closeOnESC(): this {
		this.escCloseEnabled = true;
		return this;
	}

	/**
	 * enable close by click on overlay
	 */
	public closeOnClick(): this {
		this.closeByDocumentEnabled = true;
		return this;
	}

	/**
	 * set method used on CLOSE button
	 */
	public setCloseFn(fn: () => void): this {
		this.closeFn = fn;
		return this;
	}

	public setClass(className: string): this {
		return this.changeClass(className);
	}

	public removeClass(className: string): this {
		return this.changeClass(className, false);
	}

	public addComponent<T>(componentFactory: ComponentFactory<T>): ComponentRef<T> {
		return this.contentRef.createComponent(componentFactory);
	}

	public height(value: number, units: string = 'px'): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'height', value.toString() + units);
	}

	public minHeight(value: number): void {
		if (this.initMinHeight == null) {
			this.initMinHeight = value;
		}
		this.renderer.setStyle(this.modalBox.nativeElement, 'minHeight', value.toString() + 'px');
	}

	public getMinHeight() {
		return this.initMinHeight || 0;
	}

	public clearMinHeight(): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minHeight', null);
	}

	public setMaxHeight(value: number): void {
		if (this.initMaxHeight == null) {
			this.initMaxHeight = value;
		}
		this.renderer.setStyle(this.modalBox.nativeElement, 'maxHeight', value.toString() + 'px');
	}

	public width(value: number, units: string = 'px'): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'width', value.toString() + units);
	}

	public minWidth(value: number): void {
		if (this.initMinWidth == null) {
			this.initMinWidth = value;
		}
		this.renderer.setStyle(this.modalBox.nativeElement, 'minWidth', value.toString() + 'px');
	}

	public getMinWidth(): number {
		return this.initMinWidth || 0;
	}

	public clearMinWidth(): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minWidth', null);
	}

	public setMaxWidth(value: number): void {
		if (this.initMaxWidth == null) {
			this.initMaxWidth = value;
		}
		this.renderer.setStyle(this.modalBox.nativeElement, 'maxWidth', value.toString() + 'px');
	}

	/**
	 * @description return element height with padding and border
	 *
	 * offsetHeight -> height + padding + border
	 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
	 *
	 * clientHeight -> height + padding
	 * https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight
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
	 * get element calculated margins
	 */
	public getMargins(): {
		top: number;
		left: number;
		bottom: number;
		right: number;
	} {
		const styles = this.getStyles();
		const top = parseInt(styles.marginTop, 10);
		const bottom = parseInt(styles.marginBottom, 10);
		const left = parseInt(styles.marginLeft, 10);
		const right = parseInt(styles.marginRight, 10);

		return { top, left, bottom, right };
	}

	/**
	 * set position relative to parent overlay
	 */
	public setPosition(top: number, left: number): void {
		if (top !== null) {
			this.setTopPosition(top);
		}

		if (left !== null) {
			this.setLeftPosition(left);
		}
	}

	public get hostElement(): HTMLElement {
		return this.hostElementRef.nativeElement;
	}

	public maximizeRestore() {
		this.maximize.next(!this.maximized);
	}

	/**
	 * set left position relative to parent overlay
	 */
	public setLeftPosition(left: number): void {
		this.positionLeft = this.checkBoundBox('left', left);
		this.renderer.setStyle(this.modalBox.nativeElement, 'left', this.positionLeft.toString() + 'px');
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginLeft', '0');
	}

	/**
	 * set top position relative to parent overlay
	 */
	public setTopPosition(top: number): void {
		this.positionTop = this.checkBoundBox('top', top);
		this.renderer.setStyle(this.modalBox.nativeElement, 'top', this.positionTop.toString() + 'px');
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginTop', '0');
	}

	/**
	 * get left position relative to parent overlay
	 */
	public getPositionLeft(): number {
		if (this.positionLeft != null) {
			return this.positionLeft;
		}

		return (this.positionLeft = this.getClientRects().left);
	}

	/**
	 * get top position relative to parent overlay
	 */
	public getPositionTop(): number {
		if (this.positionTop != null) {
			return this.positionTop;
		}

		return (this.positionTop = this.getClientRects().top);
	}

	public changeStackOrder(index: number) {
		this.renderer.setStyle(this.hostElementRef.nativeElement, 'z-index', index);
	}

	@HostListener('mousedown', ['$event'])
	public setActive(event: MouseEvent): void {}

	public getBoundbox(): { height: number; width: number } {
		return { height: window.innerHeight, width: window.innerWidth };
	}

	public onMouseClose(event: MouseEvent): void {
		event.stopPropagation();
		if (this.closeFn) {
			this.closeFn();
		}
	}

	@HostListener('click', ['$event'])
	public documentCloseListener(event: MouseEvent): void {
		const targetEl = event.target || event.srcElement;

		if (this.closeByDocumentEnabled && this.closeFn && this.hostElementRef.nativeElement === targetEl) {
			this.closeFn();
		}

		if (this.hostElementRef.nativeElement === targetEl) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	public get focusOnChange(): Element {
		return this.focusOnChangeElement;
	}

	public set focusOnChange(el: Element) {
		this.focusOnChangeElement = el;
	}

	public autoFocus(): void {
		const focusOnParentClosing = this.focusOnChangeElement;
		if (focusOnParentClosing) {
			if (document.activeElement === focusOnParentClosing) {
				return;
			}
			const focusablehtmlElements = this.filterAllowed(<HTMLElement>focusOnParentClosing);
			if (focusablehtmlElements.length > 0) {
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

	private changeClass(className: string, add: boolean = true): this {
		if (add === true) {
			this.renderer.addClass(this.hostElementRef.nativeElement, className);
		} else {
			this.renderer.removeClass(this.hostElementRef.nativeElement, className);
		}
		return this;
	}

	/**
	 * helper method to determinate new postion according to boundbox
	 */
	private checkBoundBox(dir: 'left' | 'top', position: number): number {
		if (dir === 'left') {
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

	private invokeElementMethod(element: any, methodName: string): void {
		if (methodName === 'focus' && element.setActive) {
			element.setActive();
			return;
		}
		if (element[methodName]) {
			element[methodName]();
		}
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
				return focusableElements.filter((element: Element) => ignoreElements.indexOf(element) === -1);
			}

			return focusableElements;
		}

		return [];
	}
}
