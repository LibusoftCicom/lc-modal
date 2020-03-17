import { ComponentRef, ComponentFactory } from '@angular/core';
import { Subject } from 'rxjs';
import { IModalDimensions } from './modal-types.class';

export interface IHostModalComponent {

	title: string;
	closeEnabled: boolean;
	maximizeEnabled: boolean;

	maximized: boolean;
	maximize: Subject<boolean>;

	closeFn: () => void;

	isActive: boolean;
	isDraggable: boolean;
	isResizable: boolean;
	focusOnChangeElement: Element;
	resizeObserver: Subject<IModalDimensions>;

	focusOnChange: Element; // getter | setter
	readonly hostElement: HTMLElement; // getter

	displayOverlay(visible: boolean): void;
	display(isVisible: boolean): void;
	setTitle(title: string): this;

	showMaximize(show: boolean): this;
	toggleMaximize(): void;

	showClose(): this;
	closeOnESC(): this;
	closeOnClick(): this;
	setCloseFn(fn: () => void): this;

	setClass(className: string): this;
	removeClass(className: string): this;

	addComponent<T>(componentFactory: ComponentFactory<T>): ComponentRef<T>;

	height(value: number, units: string): void;
	minHeight(value: number): void;
	getMinHeight(): number;
	clearMinHeight(): void;
	width(value: number, units: string): void;
	minWidth(value: number): void;
	getMinWidth(): number;
	clearMinWidth(): void;

	getHeight(): number;
	getWidth(): number;

	getClientRects(): ClientRect;
	getStyles(): CSSStyleDeclaration;

	getMargins(): {
		top: number;
		left: number;
		bottom: number;
		right: number;
	};

	setPosition(top: number, left: number): void;
	setLeftPosition(left: number): void;
	setTopPosition(top: number): void;
	getPositionLeft(): number;
	getPositionTop(): number;
	getBoundbox(): { height: number; width: number };

	documentCloseListener(event: MouseEvent): void;
	autoFocus(): void;
	trapFocusKeydown(event: KeyboardEvent): void;

	focusNext(event: KeyboardEvent): void;
	focusPrevious(event: KeyboardEvent): void;

	maximizeRestore(): void;
}
