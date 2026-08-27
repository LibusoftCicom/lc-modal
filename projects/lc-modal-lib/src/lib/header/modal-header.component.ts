import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, InputSignal, OnDestroy, OnInit } from '@angular/core';
import { ModalConfiguration, ModalDimensionUnits } from '../modal-configuration.class';
import { NgStyle } from '@angular/common';
import { IModalHeaderComponent } from './modal-header.component.interface';

@Component({	
	selector: `modal-component-header`,
	templateUrl: `./modal-header.component.html`,
	styleUrls: ['./modal-header.component.scss'],
    standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgStyle],
    host: {
        '(dblclick)': 'toggleMaximize()',
        '[class.colored]': 'isHeaderVisible()'
    }
})
export class ModalHeaderComponent implements OnInit, IModalHeaderComponent {

    private closeFn: () => void = () => {};

    constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

    public title: InputSignal<string | null> = input.required<string | null>();

    public configuration: InputSignal<ModalConfiguration> = input.required<ModalConfiguration>();

    public ngOnInit(): void {
    }


    public setCloseFn(fn: () => void): void {
        this.closeFn = fn;
    }

    protected isCloseButtonVisible(): boolean {
        return this.configuration().isCloseButtonVisible();
    }

    protected isMaximizeButtonVisible(): boolean {
        return this.configuration().isMaximizeButtonVisible();
    }

    protected isCollapseButtonVisible(): boolean {
        return this.configuration().isCollapseButtonVisible();
    }

    protected isHeaderVisible(): boolean {
        return this.title() != null && this.title()?.length > 0;
    }

    protected collapsed(): boolean {
        return this.configuration().isCollapsed();
    }

    protected maximized(): boolean {
        return this.configuration().isMaximized();
    }

    protected getControlsWidth(): null | string {
            const modalConfiguration = this.configuration();
            const BUTTON_WIDTH = 28;
            let width = 0;
    
            if (modalConfiguration?.isCloseButtonVisible()) {
                width += BUTTON_WIDTH;
            }
            if (modalConfiguration?.isMaximizeButtonVisible()) {
                width += BUTTON_WIDTH;
            }
            if (modalConfiguration?.isCollapseButtonVisible()) {
                width += BUTTON_WIDTH;
            }
    
            return width === 0 ? null : width + ModalDimensionUnits.PIXEL;
    }

    protected toggleCollapse() {
		const modalConfiguration = this.configuration();
		if (!modalConfiguration?.isCollapseButtonVisible()) {
			return;
		}
		modalConfiguration.toggleCollapse();
	}

    /**
	 * on double click toggle modal size
	 */
	protected toggleMaximize() {
		const modalConfiguration = this.configuration();
		if (!modalConfiguration.isMaximizeButtonVisible()) {
			return;
		}
		modalConfiguration.toggleMaximize();
	}
    
    protected onMouseClose(event: PointerEvent): void {
        event.stopPropagation();
        if (this.closeFn) {
            this.closeFn();
        }
    }


}
