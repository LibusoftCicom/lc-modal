import { ComponentRef, Type } from '@angular/core';
import { ModalConfiguration } from './modal-configuration.class';

export interface IHostModalComponent {

	title: string;
	closeButtonEnabled: boolean;
	maximizeButtonEnabled: boolean;
	collapseButtonEnabled: boolean;

	maximized: boolean;
	collapsed: boolean;

	closeFn: () => void;

	isActive: boolean;
	isDraggable: boolean;
	isResizable: boolean;
	focusOnChangeElement: Element;

	focusOnChange: Element; // getter | setter
	readonly hostElement: HTMLElement; // getter

	setTitle(title: string): this;

	toggleMaximize(): void;

	setCloseFn(fn: () => void): this;

	setConfiguration(modalConfiguration: ModalConfiguration): void;

	addComponent<T>(componentFactory: Type<T>): ComponentRef<T>;

	getHeight(): number;
	getWidth(): number;

	getPositionLeft(): number;
	getPositionTop(): number;

	documentCloseListener(event: PointerEvent): void;
	autoFocus(): void;
	trapFocusKeydown(event: KeyboardEvent): void;

	focusNext(event: KeyboardEvent): void;
	focusPrevious(event: KeyboardEvent): void;
}
