import { Observable, Subject } from 'rxjs';


export enum ModalConfigurationEventType {
	VISIBILITY_CHANGE,
	OVERLAY_VISIBILITY_CHANGE,
	ON_ESC_CHANGE,
	CLASS_ADD_CHANGE,
	CLASS_REMOVE_CHANGE,

	COLLAPSE_CHANGE,
	DRAGGABLE_CHANGE,
	RESIZABLE_CHANGE,
	FULLSCREEN_CHANGE,
	DESKTOP_BEHAVIOR_CHANGE,

	HEIGHT_CHANGE,
	MIN_HEIGHT_CHANGE,
	MAX_HEIGHT_CHANGE,
	WIDTH_CHANGE,
	MIN_WIDTH_CHANGE,
	MAX_WIDTH_CHANGE,

	POSITION_CHANGE
}

export interface IModalConfigurationEvent {
	type: ModalConfigurationEventType;
	value: any;
}

export enum ModalClassNames {
	FULLSCREEN = 'fullscreen',
	WITHOUT_OVERLY = 'without-overlay',
	DRAGGING = 'dragging',
	ACTIVE = 'active',
	OVERLAY_ACTIVE = 'overlay-active',
	RESIZING = 'resizing',
	COLLAPSED = 'collapsed',
	BEHAVIOR_PRESERVED = 'behavior-preserved'
}

export interface IModalDimensions {
	height: number;
	width: number;
	units: string;
}

export enum ModalDimensionUnits {
	PIXEL = 'px',
	PERCENTAGE = '%'
}

export class ModalConfiguration {

	/**
	 * state configuration
	 */
	private escCloseEnabled = false;

	/**
	 * enable close on document click
	 */
	private clickOnDocumentCloseEnabled = false;

	private displayOverlay = true;

	private positionToScreenCenter = false;

	private visible = true;

	private draggable = false;

	private resizable = false;

	private fullscreen = false;

	private collapsed = false;

	private classNameList: Set<string> = new Set();

	private desktopBehaviorPreserved = false;

	/**
	 * buttons
	 */
	private showCollapseButton = false;

	private showMaximizeButton = false;

	private showCloseButton = true;

	/**
	 * dimensions
	 */
	private height: number = null;

	private minHeight: number = null;

	private initMinHeight: number = null;

	private maxHeight: number = null;

	private initMaxHeight: number = null;

	private width: number = null;

	private minWidth: number = null;

	private initMinWidth: number = null;

	private maxWidth: number = null;

	private initMaxWidth: number = null;

	private dimensionUnits = ModalDimensionUnits.PIXEL;

	/**
	 * positions
	 */
	private leftPosition = null;

	private topPosition = null;

	/**
	 * z-index
	 */
	private stackOrder: number = null;

	private savedState = {
		resizable: false,
		draggable: false,
		height: null,
		minHeight: null,
		maxHeight: null,
		width: null,
		minWidth: null,
		maxWidth: null,
		dimensionUnits: ModalDimensionUnits.PIXEL
	};

	private valueChanged: Subject<IModalConfigurationEvent> = new Subject();

	public readonly valueChanges: Observable<IModalConfigurationEvent> = this.valueChanged.asObservable();

	constructor() {

	}

	public getBoundbox(): { height: number; width: number } {
		return { height: window.innerHeight, width: window.innerWidth };
	}

	public isCloseOnESCEnabled(): boolean {
		return this.escCloseEnabled;
	}

	public setCloseOnESC(enable: boolean): void {
		this.escCloseEnabled = enable;
		this.valueChanged.next({ type: ModalConfigurationEventType.ON_ESC_CHANGE, value: enable });
	}

	public isClickOnDocumentCloseEnabled(): boolean {
		return this.clickOnDocumentCloseEnabled;
	}

	public setClickOnDocumentClose(enabled: boolean = true): void {
		this.clickOnDocumentCloseEnabled = enabled;
	}

	public isOverlayVisible(): boolean {
		return this.displayOverlay;
	}

	public setOverlayVisible(visible: boolean = true): void {
		this.displayOverlay = visible;
		visible ? this.removeClass(ModalClassNames.WITHOUT_OVERLY) : this.addClass(ModalClassNames.WITHOUT_OVERLY);
		this.valueChanged.next({ type: ModalConfigurationEventType.OVERLAY_VISIBILITY_CHANGE, value: visible });
	}

	public isPositionToScreenCenterEnabled(): boolean {
		return this.positionToScreenCenter;
	}

	public setPositionToScreenCenter(center: boolean = true): void {
		this.positionToScreenCenter = center;
	}

	public isVisible(): boolean {
		return this.visible;
	}

	public setVisible(isVisible: boolean = true): void {
		this.visible = isVisible;
		this.valueChanged.next({ type: ModalConfigurationEventType.VISIBILITY_CHANGE, value: isVisible });
	}

	public isDraggable(): boolean {
		return this.draggable;
	}

	public setDraggable(enabled: boolean, saveState: boolean): void {
		if (saveState) {
			this.savedState.draggable = enabled;
		}

		this.draggable = enabled;
		this.valueChanged.next({ type: ModalConfigurationEventType.DRAGGABLE_CHANGE, value: enabled });
	}

	public restoreDraggableState(): void {
		this.setDraggable(this.savedState.draggable, false);
	}

	public isResizable(): boolean {
		return this.resizable;
	}

	public setResizable(enabled: boolean, saveState: boolean): void {
		if (saveState) {
			this.savedState.resizable = enabled;
		}

		this.resizable = enabled;
		this.setMaximizeButtonVisible(true);
		this.valueChanged.next({ type: ModalConfigurationEventType.RESIZABLE_CHANGE, value: enabled });
	}

	public restoreResizableState(): void {
		this.setResizable(this.savedState.resizable, false);
	}

	public isMaximized(): boolean {
		return this.fullscreen;
	}

	public setMaximized(isFullScreen: boolean = true): void {
		if (isFullScreen) {
			this.setDraggable(false, false);
			this.setResizable(false, false);
			this.setDimensionUnits(ModalDimensionUnits.PERCENTAGE, false);
			this.setMaxHeight(100, false);
			if (!this.isCollapsed()) {
				this.setMinHeight(100, false);
			}
			this.setMinWidth(100, false);
			this.setMaxWidth(100, false);
		} else {
			this.restoreDraggableState();
			this.restoreMaxHeight();
			if (!this.isCollapsed()) {
				this.restoreResizableState();
				this.restoreMinHeight();
			}
			this.restoreMinWidth();
			this.restoreMaxWidth();
		}

		this.fullscreen = isFullScreen;

		/**
		 * if draggable is disabled
		 * position modal to center
		 */
		if (!this.isDraggable()) {
			this.setPositionToScreenCenter(true);
		}

		this.restoreDimensionUnits();
		isFullScreen ? this.addClass(ModalClassNames.FULLSCREEN) : this.removeClass(ModalClassNames.FULLSCREEN);
		this.valueChanged.next({ type: ModalConfigurationEventType.FULLSCREEN_CHANGE, value: isFullScreen });
	}

	public toggleMaximize(): void {
		this.setMaximized(!this.fullscreen);
	}

	public isCollapsed(): boolean {
		return this.collapsed;
	}

	public setCollapsed(isCollapsed: boolean): void {
		this.collapsed = isCollapsed;

		/**
		 * update min-height and height
		 * after each change
		 */
		if (isCollapsed) {
			this.setDimensionUnits(ModalDimensionUnits.PIXEL, false);
			this.setHeight(28, false);
			this.setMinHeight(28, false);
			this.setResizable(false, false);
			this.addClass(ModalClassNames.COLLAPSED);
		} else {
			this.restoreHeight();
			this.restoreMinHeight();

			if (!this.isMaximized()) {
				this.restoreResizableState();
			} else {
				this.setDimensionUnits(ModalDimensionUnits.PERCENTAGE, false);
				this.setMinHeight(100, false);
			}
			this.removeClass(ModalClassNames.COLLAPSED);
		}

		this.restoreDimensionUnits();
		this.valueChanged.next({ type: ModalConfigurationEventType.COLLAPSE_CHANGE, value: isCollapsed });
	}

	public toggleCollapse(): void {
		this.setCollapsed(!this.collapsed);
	}

	public isCollapseButtonVisible(): boolean {
		return this.showCollapseButton;
	}

	public setCollapseButtonVisible(isVisible: boolean): void {
		this.showCollapseButton = isVisible;
	}

	/**
	 * showMaximize only if it is enabled and there isn't any max height or width limitation
	 */
	public isMaximizeButtonVisible(): boolean {
		return this.showMaximizeButton && (this.maxWidth == null && this.maxHeight == null);
	}

	public setMaximizeButtonVisible(isVisible: boolean): void {
		this.showMaximizeButton = isVisible;
	}

	/**
	 * Show close button in right top corrner
	 */
	public isCloseButtonVisible(): boolean {
		return this.showCloseButton;
	}

	public setCloseButtonVisible(isVisible: boolean): void {
		this.showCloseButton = isVisible;
	}

	public addClass(className: string): void {
		this.classNameList.add(className);
		this.valueChanged.next({ type: ModalConfigurationEventType.CLASS_ADD_CHANGE, value: className });
	}

	public removeClass(className: string): void {
		this.classNameList.delete(className);
		this.valueChanged.next({ type: ModalConfigurationEventType.CLASS_REMOVE_CHANGE, value: className });
	}

	public getClassNameList(): string[] {
		return Array.from(this.classNameList.values());
	}

	public isDesktopBehaviorPreserved(): boolean {
		return this.desktopBehaviorPreserved;
	}

	public setPreserveDesktopBehavior(isPreserved: boolean = true): void {
		this.desktopBehaviorPreserved = isPreserved;
		isPreserved ? this.addClass(ModalClassNames.BEHAVIOR_PRESERVED)
						: this.removeClass(ModalClassNames.BEHAVIOR_PRESERVED);
		this.valueChanged.next({ type: ModalConfigurationEventType.DESKTOP_BEHAVIOR_CHANGE, value: isPreserved });
	}

	// #region dimensions
	public getDimensionUnits(): string {
		return this.dimensionUnits;
	}

	public setDimensionUnits(units: string = 'px', saveState: boolean = true): void {
		this.dimensionUnits = units as ModalDimensionUnits;
		if (saveState) {
			this.savedState.dimensionUnits = units as ModalDimensionUnits;
		}
	}

	public restoreDimensionUnits(): void {
		this.setDimensionUnits(this.savedState.dimensionUnits);
	}

	public getHeight(): number {
		return this.height;
	}

	public setHeight(height: number, saveState: boolean = true): void {
		if (!this.minHeight) {
			this.setMinHeight(height);
		}

		if (saveState) {
			this.savedState.height = height;
		}

		this.height = height;
		if (height > 0) {
			this.valueChanged.next({ type: ModalConfigurationEventType.HEIGHT_CHANGE, value: height });
		}
	}

	private restoreHeight(): void {
		this.setHeight(this.savedState.height);
	}

	public getMinHeight(): number {
		return this.minHeight;
	}

	public setMinHeight(height: number, saveState: boolean = true): void {
		this.minHeight = height;

		if (this.initMinHeight == null) {
			this.initMinHeight = height;
		}

		if (saveState) {
			this.savedState.minHeight = height;
		}

		if (height > 0) {
			this.valueChanged.next({ type: ModalConfigurationEventType.MIN_HEIGHT_CHANGE, value: height });
		}
	}

	public restoreMinHeight(): void {
		this.setMinHeight(this.savedState.minHeight);
	}

	public getMaxHeight(): number {
		return this.maxHeight;
	}

	public setMaxHeight(height: number, saveState: boolean = true): void {
		this.maxHeight = height;

		if (this.initMaxHeight == null) {
			this.initMaxHeight = height;
		}

		if (saveState) {
			this.savedState.maxHeight = height;
		}

		if (height > 0) {
			this.valueChanged.next({ type: ModalConfigurationEventType.MAX_HEIGHT_CHANGE, value: height });
		}
	}

	public restoreMaxHeight(): void {
		this.setMaxHeight(this.savedState.maxHeight);
	}

	public getWidth(): number {
		return this.width;
	}

	public setWidth(width: number, saveState: boolean = true): void {
		if (!this.minWidth) {
			this.setMinWidth(width);
		}

		if (saveState) {
			this.savedState.width = width;
		}

		this.width = width;
		if (width > 0) {
			this.valueChanged.next({ type: ModalConfigurationEventType.WIDTH_CHANGE, value: width });
		}
	}

	public restoreWidth(): void {
		this.setWidth(this.savedState.width);
	}

	public getMinWidth(): number {
		return this.minWidth;
	}

	public setMinWidth(width: number, saveState: boolean = true): void {
		this.minWidth = width;

		if (this.initMinWidth == null) {
			this.initMinWidth = width;
		}

		if (saveState) {
			this.savedState.minWidth = width;
		}

		if (width > 0) {
			this.valueChanged.next({ type: ModalConfigurationEventType.MIN_WIDTH_CHANGE, value: width });
		}
	}

	public restoreMinWidth(): void {
		this.setMinWidth(this.savedState.minWidth);
	}

	public getMaxWidth(): number {
		return this.maxWidth;
	}

	public setMaxWidth(width: number, saveState: boolean = true): void {
		this.maxWidth = width;

		if (this.initMaxWidth == null) {
			this.initMaxWidth = width;
		}

		if (saveState) {
			this.savedState.maxWidth = width;
		}

		if (width > 0) {
			this.valueChanged.next({ type: ModalConfigurationEventType.MAX_WIDTH_CHANGE, value: width });
		}
	}

	public restoreMaxWidth() {
		this.setMaxWidth(this.savedState.maxWidth);
	}

	public restoreInitialMinSize(): void {
		if (this.initMinHeight != null) {
			this.setMinHeight(this.initMinHeight);
		}

		if (this.initMinWidth != null) {
			this.setMinWidth(this.initMinWidth);
		}
	}

	public clearMinSize(): void {
		this.setMinHeight(null);
		this.setMinWidth(null);
	}
	// #endregion

	// #region position
	public getLeftPosition(): number {
		return this.leftPosition;
	}

	public setLeftPosition(left: number): void {
		this.leftPosition = this.checkBoundBox('left', left);
		this.emitPositionChanged();
	}

	public getTopPosition(): number {
		return this.topPosition;
	}

	public setTopPosition(top: number): void {
		this.topPosition = this.checkBoundBox('top', top);
		this.emitPositionChanged();
	}

	public setPosition(top: number, left: number): void {
		this.topPosition = top;
		this.leftPosition = left;
		this.emitPositionChanged();
	}

	public getOrder(): number {
		return this.stackOrder;
	}

	public setOrder(order: number): void {
		this.stackOrder = order;
		// TODO -> implement stach order change
	}

	private setPsitionToScreenCenter(): void {
		this.setDimensionUnits(ModalDimensionUnits.PERCENTAGE, false);
		this.setPosition(50, 50);
		this.restoreDimensionUnits();
		/**
		 * TODO -> change margin
		 */
	}

	/**
	 * TODO -> emit value + dimension
	 * 120 + px or 100 + %
	 */
	private emitPositionChanged(): void {
		this.valueChanged.next({
			type: ModalConfigurationEventType.POSITION_CHANGE,
			value: { top: this.topPosition, left: this.leftPosition }
		});
	}

	/**
	 * helper method to determinate new postion according to boundbox
	 * max width is mobile size cca 760
	 * then move all modals to center
	 */
	private checkBoundBox(dir: 'left' | 'top', position: number): number {
		if (dir === 'left') {
			const boundboxWidth = this.getBoundbox().width;

			const elWidth = this.getWidth() || this.getMaxWidth() || this.getMinWidth();
			// on mobile move element to center
			if (boundboxWidth < 760 && !this.desktopBehaviorPreserved) {
				return (boundboxWidth / 2) - (elWidth / 2);
			}

			/**
			 * 30px is - element grabbing part when element is out of the
			 * boundbox size
			 */
			if (position > boundboxWidth - 30) {
				return boundboxWidth - 30;
			}

			// 90px is button width
			const n = 0 - elWidth + 90;
			if (position < n && elWidth != null) {
				return n;
			}

			return position;
		} else {
			const boundbox = this.getBoundbox();
			const boundboxHeight = boundbox.height;
			const elHeight = this.getHeight() || this.getMaxHeight() || this.getMinHeight();

			/**
			 * on mobile devices move element to center, but do not go under 0px
			 */
			if (boundbox.width < 760 && !this.desktopBehaviorPreserved) {
				const newPosition = (boundboxHeight / 2) - (elHeight / 2);
				if (newPosition < 0) {
					return 0;
				}
				return newPosition;
			}

			if (position > boundboxHeight - 30) {
				return boundboxHeight - 30;
			}

			if (position < 0) {
				return 0;
			}

			return position;
		}
	}
	// #endregion
}
