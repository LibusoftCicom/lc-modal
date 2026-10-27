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

import { ModalModule, IModalResult, Modal, ModalEventType, ModalDimensionUnits, ModalConfiguration } from './modal.module';
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
