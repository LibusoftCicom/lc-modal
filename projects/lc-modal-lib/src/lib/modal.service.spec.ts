import {
	Injectable,
	Component,
	OnInit,
	AfterViewInit,
	DebugElement,
	ViewChild,
	ElementRef
} from '@angular/core';
import {
	ComponentFixture,
	TestBed,
	fakeAsync,
	tick, waitForAsync
} from '@angular/core/testing';

import { ModalModule, IModalResult, Modal, ModalEventType, ModalDimensionUnits, ModalConfiguration, ModalOpeningPositionStrategy } from './modal.module';
import { ModalComponent } from './modal.component';
import { ModalHeaderComponent } from './header/modal-header.component';
import { of } from 'rxjs';

const preCloseSpyFunctions = jasmine.createSpy('preCloseSpyFunctions');

const CONTENT_HEIGHT = 300;
let lifecycleLog: string[] = [];
let lastLifecycleChild: LifecycleChildComponent | null = null;

@Component({
	template: `<div id="lifecycleChild" style="height: 300px">{{ value }}</div>`
})
class LifecycleChildComponent implements OnInit, AfterViewInit {
	public value = 'initial';

	constructor() {
		lastLifecycleChild = this;
	}

	public ngOnInit(): void {
		lifecycleLog.push('child:ngOnInit');
	}

	public ngAfterViewInit(): void {
		lifecycleLog.push('child:ngAfterViewInit');
	}
}

@Component({
	template: `
    <div id="testChild">
        <p>Test child komponenta</p>
    </div>`
})
class ModalChildComponent {
	preClose(modalResult) {
		preCloseSpyFunctions(modalResult);
		return Promise.resolve();
	}
}

@Component({
	template: `<dialog-anchor></dialog-anchor>`
})
class ModalComponentHost {
	constructor(public modal: Modal) {}
}

describe('ModalComponentHost', () => {
	let componentAnchorEl: any;
	let component: ModalComponentHost;
	let fixture: ComponentFixture<ModalComponentHost>;

	let modalService: Modal;

	let SpyFunctions;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			providers: [],
			imports: [ModalModule.forRoot()],
			declarations: [ModalComponentHost, ModalChildComponent]
		})
			.compileComponents()
			.then(() => {
				fixture = TestBed.createComponent(ModalComponentHost);
				component = fixture.componentInstance;
				componentAnchorEl = fixture.debugElement.nativeElement;
				fixture.detectChanges();

				modalService = <Modal>component.modal;
			});

		SpyFunctions = jasmine.createSpyObj('SpyFunctions', [
			'onConfirm',
			'onCancel',
			'preClose'
		]);
	}));

	// 1
	// testirati kreiranje
	it('should create anchor component', () => {
		expect(component).toBeDefined();
	});
	// 2
	// testirati servis
	it('should inject a `Modal` service', () => {
		expect(modalService instanceof Modal).toBe(true);
	});
	// 3
	// testirati dali je pravilno otvoren modal i kreiran child element
	it(
		'should create modal and his child',
		fakeAsync(() => {
			modalService.component(ModalChildComponent).open();

			fixture.detectChanges();
			tick(150);

			const modal = componentAnchorEl.querySelector('.modal-box');
			const childComponent = componentAnchorEl.querySelector('#testChild');

			expect(modal).not.toBeUndefined();
			expect(childComponent).not.toBeUndefined();
		})
	);
	// 4
	// testirati dali se zatvaraju svi modali istovremeno
	it(
		'should destroy all modals at same time',
		fakeAsync(() => {
			for (let i = 0, l = 10; i < l; i++) {
				modalService.component(ModalChildComponent).open();
			}

			modalService.destroyAll();

			fixture.detectChanges();
			tick(150);

			const modal = componentAnchorEl.querySelector('.modal-box');

			expect(modal).toBeNull();
		})
	);
	// 5
	// testirati akcije confirm i cancel
	it(
		'should call confirm',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.open()
				.then(SpyFunctions.onConfirm, SpyFunctions.onCancel);

			(<Modal>component.modal).active().confirm(null);

			fixture.detectChanges();
			tick(150);

			expect(SpyFunctions.onConfirm).toHaveBeenCalledWith(jasmine.objectContaining({
				modalResult: IModalResult.Confirm,
				type: ModalEventType.Confirm,
				data: null
			}));
			expect(SpyFunctions.onCancel).not.toHaveBeenCalled();
		})
	);

	it(
		'should call cancel',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.open()
				.then(SpyFunctions.onConfirm, SpyFunctions.onCancel);

			(<Modal>component.modal).active().cancel();

			fixture.detectChanges();
			tick(150);

			expect(SpyFunctions.onConfirm).toHaveBeenCalledWith(jasmine.objectContaining({
				modalResult: IModalResult.Cancel,
				type: ModalEventType.Cancel,
				data: null
			}));
			expect(SpyFunctions.onCancel).not.toHaveBeenCalled();
		})
	);
	// 8
	// preclose unutar child komponente dali je pozvan sa pravim parametrima
	it(
		'should call preClose with right arguments in class',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.open()
				.then(SpyFunctions.onConfirm, SpyFunctions.onCancel);

			(<Modal>component.modal).active().cancel();

			fixture.detectChanges();
			tick(150);

			expect(preCloseSpyFunctions).toHaveBeenCalledWith(IModalResult.Cancel);
		})
	);
	// 9
	// preclose iz koda dali je pozvan sa pravim parametrima
	it(
		'should call preClose with right arguments in code',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.preClose(({ modalResult }) => {
					SpyFunctions.preClose(modalResult);
				})
				.open();

			(<Modal>component.modal).active().cancel();

			fixture.detectChanges();
			tick(150);

			expect(SpyFunctions.preClose).toHaveBeenCalledWith(IModalResult.Cancel);
		})
	);

	it(
		'should call preClose with observable return',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.preClose(({ modalResult }) => {
					SpyFunctions.preClose(modalResult);
					return of(true);
				})
				.open()
				.then(SpyFunctions.onConfirm, SpyFunctions.onCancel);

			(<Modal>component.modal).active().cancel();

			fixture.detectChanges();
			tick(150);

			expect(SpyFunctions.preClose).toHaveBeenCalledWith(IModalResult.Cancel);
		})
	);
	// 10
	// testirati dodavanje class-a
	it(
		'should set correct className',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.setClass('test-class')
				.open();

			fixture.detectChanges();
			tick(150);

			const modal = componentAnchorEl.querySelectorAll('.test-class');

			expect(modal).not.toBeUndefined();
		})
	);
	// 11
	// dali pravilno označava element kao aktivan
	it(
		'should set `active` className on current active modal',
		fakeAsync(() => {
			modalService.component(ModalChildComponent).open();
			modalService.component(ModalChildComponent).open();

			fixture.detectChanges();
			tick(150);

			const modal = componentAnchorEl.querySelectorAll(
				'modal-component.active'
			);

			expect(modal.length).toBe(1);
		})
	);
	// 12
	// testirati zatvaranje na klik preko overlay-a
	it(
		'should close modal on click',
		fakeAsync(() => {
			modalService
				.component(ModalChildComponent)
				.closeOnClick()
				.open();

			const modal = componentAnchorEl.querySelector('modal-component.active');

			modal.click();
			fixture.detectChanges();
			tick(150);

			const findModal = componentAnchorEl.querySelector('modal-component');

			expect(findModal).toBeNull();
		})
	);
});

describe('Modal pixel geometry', () => {
	const cases = [
		{ name: 'desktop pixels', viewport: [1200, 900], size: [400, 300], units: 'px', center: [400, 300] },
		{ name: 'desktop percentages', viewport: [1200, 900], size: [50, 40], units: '%', center: [300, 270] },
		{ name: 'mobile percentages', viewport: [400, 800], size: [80, 50], units: '%', center: [40, 200] },
		{ name: 'mobile pixels', viewport: [400, 800], size: [300, 400], units: 'px', center: [50, 200] },
		{ name: 'oversized mobile pixels', viewport: [400, 800], size: [600, 1000], units: 'px', center: [0, 0] }
	];

	cases.forEach(testCase => {
		it('should center ' + testCase.name + ' in pixels', () => {
			const configuration = new ModalConfiguration();
			spyOn(configuration, 'getBoundbox').and.returnValue({ width: testCase.viewport[0], height: testCase.viewport[1] });
			configuration.setWidth({ value: testCase.size[0], units: testCase.units });
			configuration.setHeight({ value: testCase.size[1], units: testCase.units });
			configuration.setToCenter();
			expect(configuration.getLeftPosition()).toEqual({ value: testCase.center[0], units: 'px' });
			expect(configuration.getTopPosition()).toEqual({ value: testCase.center[1], units: 'px' });
		});
	});

	it('should convert percentage offsets before checking desktop bounds', () => {
		const configuration = new ModalConfiguration();
		spyOn(configuration, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		configuration.setWidth({ value: 50, units: '%' });
		configuration.setHeight({ value: 40, units: '%' });
		configuration.setLeftPosition(25, '%');
		configuration.setTopPosition(20, '%');
		expect(configuration.getLeftPosition()).toEqual({ value: 300, units: 'px' });
		expect(configuration.getTopPosition()).toEqual({ value: 180, units: 'px' });
		configuration.setLeftPosition(-1000);
		configuration.setTopPosition(-1000);
		expect(configuration.getLeftPosition().value).toBe(-510);
		expect(configuration.getTopPosition().value).toBe(0);
		configuration.setLeftPosition(2000);
		configuration.setTopPosition(2000);
		expect(configuration.getLeftPosition().value).toBe(1170);
		expect(configuration.getTopPosition().value).toBe(870);
	});
});

describe('Modal lifecycle', () => {
	let anchorEl: HTMLElement;
	let fixture: ComponentFixture<ModalComponentHost>;
	let modalService: Modal;

	beforeEach(waitForAsync(() => {
		lifecycleLog = [];
		lastLifecycleChild = null;

		TestBed.configureTestingModule({
			imports: [ModalModule.forRoot()],
			declarations: [ModalComponentHost, LifecycleChildComponent]
		})
			.compileComponents()
			.then(() => {
				fixture = TestBed.createComponent(ModalComponentHost);
				anchorEl = fixture.debugElement.nativeElement;
				fixture.detectChanges();
				modalService = fixture.componentInstance.modal;
			});
	}));

	afterEach(() => modalService.destroyAll());

	const positionCases = [
		{ name: 'center the first modal', previous: null, left: 400, top: 300 },
		{ name: 'cascade right and down', previous: [100, 100], left: 130, top: 130 },
		{ name: 'allow an exact fit at both edges', previous: [770, 570], left: 800, top: 600 },
		{ name: 'restart both axes at the right edge', previous: [780, 100], left: 30, top: 30 },
		{ name: 'restart both axes at the bottom edge', previous: [100, 580], left: 30, top: 30 },
		{ name: 'restart at the bottom-right corner', previous: [780, 580], left: 30, top: 30 },
		{ name: 'restart after a modal dragged outside the viewport', previous: [-100, 100], left: 30, top: 30 },
		{ name: 'center after a fullscreen modal', previous: [0, 0], fullscreen: true, left: 400, top: 300 },
		{ name: 'center a larger modal after fullscreen', previous: [0, 0], fullscreen: true, width: 1100, height: 850, left: 50, top: 25 },
		{ name: 'keep an oversized first modal origin visible', previous: null, width: 1400, height: 1000, left: 0, top: 0 },
		{ name: 'keep an oversized cascaded modal origin visible', previous: [100, 100], width: 1400, height: 1000, left: 0, top: 0 },
		{ name: 'clamp a restart when only a small margin remains', previous: [100, 100], width: 1190, height: 890, left: 10, top: 10 }
	];

	positionCases.forEach(testCase => {
		it('should ' + testCase.name, fakeAsync(() => {
			spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
			spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(testCase.width || 400);
			spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(testCase.height || 300);
			if (testCase.previous) {
				const previous = modalService.component(LifecycleChildComponent)
					.offsetLeft(testCase.previous[0]).offsetTop(testCase.previous[1]);
				if (testCase.fullscreen) {
					previous.setFullScreen();
				}
				previous.open();
			}
			const modal = modalService.component(LifecycleChildComponent);
			modal.open();
			fixture.detectChanges();
			tick(150);

			expect(modal.getOffsetLeft().value).toBe(testCase.left);
			expect(modal.getOffsetTop().value).toBe(testCase.top);
			const boxes = anchorEl.querySelectorAll('.modal-box');
			const box = boxes[boxes.length - 1] as HTMLElement;
			expect(box.style.left).toBe(testCase.left + 'px');
			expect(box.style.top).toBe(testCase.top + 'px');
		}));
	});

	const strategyCases = [
		{ name: 'use an explicit cascade strategy', strategy: ModalOpeningPositionStrategy.CASCADE, previous: [100, 100], left: 130, top: 130 },
		{ name: 'center on screen despite a previous modal', strategy: ModalOpeningPositionStrategy.SCREEN_CENTER, previous: [100, 100], left: 400, top: 300 },
		{ name: 'center within a larger parent modal', strategy: ModalOpeningPositionStrategy.PARENT_CENTER, previous: [100, 150], left: 200, top: 250 },
		{ name: 'center on screen without a parent', strategy: ModalOpeningPositionStrategy.PARENT_CENTER, previous: null, left: 400, top: 300 },
		{ name: 'center on screen with a fullscreen parent', strategy: ModalOpeningPositionStrategy.PARENT_CENTER, previous: [0, 0], fullscreen: true, left: 400, top: 300 },
		{ name: 'clamp parent centering at the bottom-right edge', strategy: ModalOpeningPositionStrategy.PARENT_CENTER, previous: [900, 700], left: 800, top: 600 },
		{ name: 'clamp parent centering at the top-left edge', strategy: ModalOpeningPositionStrategy.PARENT_CENTER, previous: [-200, -250], left: 0, top: 0 }
	];

	strategyCases.forEach(testCase => {
		it('should ' + testCase.name, fakeAsync(() => {
			let parentWrapper: ModalComponent = null;
			spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
			spyOn(ModalComponent.prototype, 'getWidth').and.callFake(function(this: ModalComponent) {
				return this === parentWrapper ? 600 : 400;
			});
			spyOn(ModalComponent.prototype, 'getHeight').and.callFake(function(this: ModalComponent) {
				return this === parentWrapper ? 500 : 300;
			});
			if (testCase.previous) {
				const parent = modalService.component(LifecycleChildComponent)
					.offsetLeft(testCase.previous[0]).offsetTop(testCase.previous[1]);
				if (testCase.fullscreen) {
					parent.setFullScreen();
				}
				parent.open();
				parentWrapper = parent.hostComponentRef;
				parentWrapper.getConfiguration().setPosition(testCase.previous[1], testCase.previous[0]);
			}
			const modal = modalService.component(LifecycleChildComponent).setOpeningPositionStrategy(testCase.strategy);
			modal.open();
			fixture.detectChanges();
			tick(150);
			expect(modal.getOffsetLeft().value).toBe(testCase.left);
			expect(modal.getOffsetTop().value).toBe(testCase.top);
			const box = modal.hostComponentRef.hostElement.querySelector('.modal-box') as HTMLElement;
			expect(box.style.left).toBe(testCase.left + 'px');
			expect(box.style.top).toBe(testCase.top + 'px');
		}));
	});

	[ModalOpeningPositionStrategy.SCREEN_CENTER, ModalOpeningPositionStrategy.PARENT_CENTER].forEach(strategy => {
		it('should preserve explicit coordinates with ' + strategy, fakeAsync(() => {
			spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
			modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(100).open();
			const modal = modalService.component(LifecycleChildComponent)
				.setOpeningPositionStrategy(strategy).offsetLeft(125).offsetTop(175);
			modal.open();
			fixture.detectChanges();
			tick(150);
			expect(modal.getOffsetLeft().value).toBe(125);
			expect(modal.getOffsetTop().value).toBe(175);
		}));
	});

	it('should use the last visible modal as the parent for centering', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(150).open();
		const hidden = modalService.component(LifecycleChildComponent).offsetLeft(700).offsetTop(500);
		hidden.open();
		hidden.hostComponentRef.getConfiguration().setVisible(false);
		const modal = modalService.component(LifecycleChildComponent)
			.setOpeningPositionStrategy(ModalOpeningPositionStrategy.PARENT_CENTER);
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.getOffsetLeft().value).toBe(100);
		expect(modal.getOffsetTop().value).toBe(150);
	}));

	it('should center within the explicit parent rather than the previous modal', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		const parent = modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(150);
		parent.open();
		modalService.component(LifecycleChildComponent).offsetLeft(700).offsetTop(500).open();
		const modal = modalService.component(LifecycleChildComponent)
			.setOpeningPositionStrategy(ModalOpeningPositionStrategy.PARENT_CENTER);
		modal.parent = parent;
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.getOffsetLeft().value).toBe(100);
		expect(modal.getOffsetTop().value).toBe(150);
	}));

	it('should let the opening strategy override earlier legacy screen centering', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(150).open();
		const modal = modalService.component(LifecycleChildComponent).positionOnScreenCenter()
			.setOpeningPositionStrategy(ModalOpeningPositionStrategy.PARENT_CENTER);
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.getOffsetLeft().value).toBe(100);
		expect(modal.getOffsetTop().value).toBe(150);
	}));

	['px', '%'].forEach(units => {
		[false, true].forEach(draggable => {
			it('should recenter a ' + units + ' modal on desktop and mobile resize, draggable=' + draggable, fakeAsync(() => {
				let viewport = { width: 1200, height: 900 };
				const size = units === '%' ? { width: 50, height: 40 } : { width: 300, height: 200 };
				spyOn(ModalConfiguration.prototype, 'getBoundbox').and.callFake(() => viewport);
				spyOn(ModalComponent.prototype, 'getWidth').and.callFake(() => units === '%' ? viewport.width * size.width / 100 : size.width);
				spyOn(ModalComponent.prototype, 'getHeight').and.callFake(() => units === '%' ? viewport.height * size.height / 100 : size.height);
				const modal = modalService.component(LifecycleChildComponent)
					.setDimensions(size.height, size.width, units).positionOnScreenCenter();
				modal.draggable(draggable);
				modal.open();
				[viewport, { width: 400, height: 800 }, { width: 800, height: 400 }, { width: 1200, height: 900 }].forEach(bounds => {
					viewport = bounds;
					window.dispatchEvent(new Event('resize'));
					const width = units === '%' ? bounds.width * size.width / 100 : size.width;
					const height = units === '%' ? bounds.height * size.height / 100 : size.height;
					expect(modal.getOffsetLeft()).toEqual({ value: (bounds.width - width) / 2, units: 'px' });
					expect(modal.getOffsetTop()).toEqual({ value: (bounds.height - height) / 2, units: 'px' });
				});
				fixture.detectChanges();
				tick(150);
			}));
		});
	});

	it('should center the first modal after initial size constraints change its rendered width', fakeAsync(() => {
		const initializeLayout = ModalComponent.prototype.initializeLayout;
		spyOn(ModalComponent.prototype, 'initializeLayout').and.callFake(function(this: ModalComponent) {
			this.hostElement.style.setProperty('--lc-modal-min-width', '580px');
			initializeLayout.call(this);
		});
		const modal = modalService.component(LifecycleChildComponent).setDimensions(300, 400)
			.preserveDesktopBehavior().positionOnScreenCenter();
		modal.open();
		fixture.detectChanges();
		tick(150);
		const wrapper = modal.hostComponentRef;
		expect(wrapper.getWidth()).toBe(400);
		expect(modal.getOffsetLeft().value).toBe((window.innerWidth - wrapper.getWidth()) / 2);
		expect(modal.getOffsetTop().value).toBe(Math.max(0, (window.innerHeight - wrapper.getHeight()) / 2));
		const box = wrapper.hostElement.querySelector('.modal-box') as HTMLElement;
		expect(box.getBoundingClientRect().left).toBeCloseTo(modal.getOffsetLeft().value, 0);
	}));

	it('should center the rendered percentage modal using its CSS-constrained size', fakeAsync(() => {
		const modal = modalService.component(LifecycleChildComponent).setDimensions(40, 50, '%')
			.setMinWidth(100).setMaxWidth(250).preserveDesktopBehavior().positionOnScreenCenter();
		modal.open();
		fixture.detectChanges();
		tick(150);
		window.dispatchEvent(new Event('resize'));
		const wrapper = modal.hostComponentRef;
		expect(wrapper.getWidth()).toBeGreaterThan(0);
		expect(wrapper.getWidth()).toBeLessThanOrEqual(250);
		expect(wrapper.getHeight()).toBeGreaterThan(0);
		expect(modal.getOffsetLeft().value).toBe(Math.max(0, (window.innerWidth - wrapper.getWidth()) / 2));
		expect(modal.getOffsetTop().value).toBe(Math.max(0, (window.innerHeight - wrapper.getHeight()) / 2));
		const box = wrapper.hostElement.querySelector('.modal-box') as HTMLElement;
		expect(box.style.left).toBe(modal.getOffsetLeft().value + 'px');
		expect(box.style.top).toBe(modal.getOffsetTop().value + 'px');
		expect(wrapper.getConfiguration().getWidth()).toEqual({ value: 50, units: '%' });
	}));

	it('should keep dragged desktop coordinates and center on mobile using percentage geometry', fakeAsync(() => {
		let viewport = { width: 1200, height: 900 };
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.callFake(() => viewport);
		spyOn(ModalComponent.prototype, 'getWidth').and.callFake(() => viewport.width / 2);
		spyOn(ModalComponent.prototype, 'getHeight').and.callFake(() => viewport.height * 0.4);
		const modal = modalService.component(LifecycleChildComponent).setDimensions(40, 50, '%').draggable();
		modal.open();
		const configuration = modal.hostComponentRef.getConfiguration();
		configuration.setPosition(175, 125);
		window.dispatchEvent(new Event('resize'));
		expect(modal.getOffsetLeft().value).toBe(125);
		expect(modal.getOffsetTop().value).toBe(175);
		viewport = { width: 400, height: 800 };
		window.dispatchEvent(new Event('resize'));
		expect(modal.getOffsetLeft().value).toBe(100);
		expect(modal.getOffsetTop().value).toBe(240);
		modal.preserveDesktopBehavior(true);
		configuration.setPosition(175, 125);
		window.dispatchEvent(new Event('resize'));
		expect(modal.getOffsetLeft().value).toBe(125);
		expect(modal.getOffsetTop().value).toBe(175);
		configuration.setPosition(20, 25, '%');
		window.dispatchEvent(new Event('resize'));
		expect(modal.getOffsetLeft()).toEqual({ value: 100, units: 'px' });
		expect(modal.getOffsetTop()).toEqual({ value: 160, units: 'px' });
		fixture.detectChanges();
		tick(150);
	}));

	it('should preserve a dragged desktop modal position during fullscreen and restore', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		const modal = modalService.component(LifecycleChildComponent).setDimensions(300, 400).draggable();
		modal.open();
		const configuration = modal.hostComponentRef.getConfiguration();
		configuration.setPosition(175, 125);
		configuration.setMaximized(true);
		window.dispatchEvent(new Event('resize'));
		expect(modal.getOffsetLeft().value).toBe(125);
		expect(modal.getOffsetTop().value).toBe(175);
		configuration.setMaximized(false);
		window.dispatchEvent(new Event('resize'));
		expect(modal.getOffsetLeft().value).toBe(125);
		expect(modal.getOffsetTop().value).toBe(175);
		fixture.detectChanges();
		tick(150);
	}));

	it('should continue a stable cascade after restarting at an edge', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		modalService.component(LifecycleChildComponent).offsetLeft(780).offsetTop(100).open();
		[30, 60, 90].forEach(position => {
			const modal = modalService.component(LifecycleChildComponent);
			modal.open();
			expect(modal.getOffsetLeft().value).toBe(position);
			expect(modal.getOffsetTop().value).toBe(position);
		});
		fixture.detectChanges();
		tick(150);
	}));

	it('should preserve explicit coordinates after fullscreen', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		modalService.component(LifecycleChildComponent).setFullScreen().open();
		const modal = modalService.component(LifecycleChildComponent).offsetLeft(125).offsetTop(175);
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.getOffsetLeft().value).toBe(125);
		expect(modal.getOffsetTop().value).toBe(175);
	}));

	it('should cascade from the last visible modal rather than a hidden one', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(100).open();
		const hidden = modalService.component(LifecycleChildComponent).offsetLeft(780).offsetTop(580);
		hidden.open();
		hidden.hostComponentRef.getConfiguration().setVisible(false);
		const modal = modalService.component(LifecycleChildComponent);
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.getOffsetLeft().value).toBe(130);
		expect(modal.getOffsetTop().value).toBe(130);
	}));

	it('should preserve explicit screen centering instead of cascading', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		spyOn(ModalComponent.prototype, 'getWidth').and.returnValue(400);
		spyOn(ModalComponent.prototype, 'getHeight').and.returnValue(300);
		modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(100).open();
		const modal = modalService.component(LifecycleChildComponent)
			.setDimensions(300, 400).positionOnScreenCenter();
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.getOffsetLeft().value).toBe(400);
		expect(modal.getOffsetTop().value).toBe(300);
	}));

	it('should not cascade a new fullscreen modal', fakeAsync(() => {
		spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ width: 1200, height: 900 });
		modalService.component(LifecycleChildComponent).offsetLeft(100).offsetTop(100).open();
		const modal = modalService.component(LifecycleChildComponent).setFullScreen();
		modal.open();
		fixture.detectChanges();
		tick(150);
		expect(modal.hostComponentRef.getConfiguration().isMaximized()).toBe(true);
		expect(modal.hostComponentRef.hostElement.classList.contains('fullscreen')).toBe(true);
		expect(modal.getOffsetLeft().value).not.toBe(130);
		expect(modal.getOffsetTop().value).not.toBe(130);
	}));

	it(
		'should run header, content, layout and readiness steps in order',
		fakeAsync(() => {
			const headerNgOnInit = ModalHeaderComponent.prototype.ngOnInit;
			spyOn(ModalHeaderComponent.prototype, 'ngOnInit').and.callFake(function (this: ModalHeaderComponent) {
				lifecycleLog.push('header:ngOnInit');
				return headerNgOnInit.call(this);
			});
			const initializeLayout = ModalComponent.prototype.initializeLayout;
			spyOn(ModalComponent.prototype, 'initializeLayout').and.callFake(function (this: ModalComponent) {
				lifecycleLog.push('modal:initializeLayout');
				return initializeLayout.call(this);
			});

			modalService.openChange.subscribe(() => lifecycleLog.push('service:openChange'));
			const modal = modalService.component(LifecycleChildComponent);
			modal.isReady.subscribe(() => lifecycleLog.push('factory:isReady'));
			modal.open();

			fixture.detectChanges();
			tick(150);

			expect(lifecycleLog).toEqual([
				'header:ngOnInit',
				'child:ngOnInit',
				'child:ngAfterViewInit',
				'modal:initializeLayout',
				'service:openChange',
				'factory:isReady'
			]);
		})
	);

	it(
		'should apply initial sizes only once',
		fakeAsync(() => {
			const setInitialMinSizes = spyOn(<any>ModalComponent.prototype, 'setInitialMinSizes').and.callThrough();

			modalService.component(LifecycleChildComponent).open();

			fixture.detectChanges();
			tick(150);
			fixture.detectChanges();

			expect(setInitialMinSizes).toHaveBeenCalledTimes(1);
		})
	);

	it(
		'should measure height after content is rendered when maximize is visible',
		fakeAsync(() => {
			// The Karma iframe can be shorter than the content, which would switch sizing to 90%.
			spyOn(ModalConfiguration.prototype, 'getBoundbox').and.returnValue({ height: 2000, width: 2000 });
			const modal = modalService.component(LifecycleChildComponent).showMaximize(true);
			modal.open();

			fixture.detectChanges();
			tick(150);

			expect(modal.getHeight().units).toBe(ModalDimensionUnits.PIXEL);
			expect(modal.getHeight().value).toBeGreaterThanOrEqual(CONTENT_HEIGHT);
			expect(modal.getMinHeight().value).toBeGreaterThanOrEqual(CONTENT_HEIGHT);
		})
	);

	it(
		'should refresh content through factory detectChanges once ready',
		fakeAsync(() => {
			const modal = modalService.component(LifecycleChildComponent);
			modal.open();

			fixture.detectChanges();
			tick(150);

			lastLifecycleChild.value = 'changed';
			modal.detectChanges();

			expect(anchorEl.querySelector('#lifecycleChild').textContent.trim()).toBe('changed');
		})
	);
});
