import {
  Directive,
  Optional,
  Host,
  OnDestroy,
  SkipSelf,
  ElementRef,
  Renderer2,
  HostListener,
  AfterViewInit,
  NgZone
} from '@angular/core';
import { ModalHelper } from '../modal-helper.service';
import { Draggable } from './draggable.directive';

export enum MouseEventButton {
  Main,
  Auxiliary,
  Secondary,
  Fourth, // Browse back
  Fifth // browse forward
}

@Directive({ selector: '[draggable-handle]' })
export class DraggableHandle implements AfterViewInit, OnDestroy {
  private modalComponentHost: ElementRef;

  private pseudoEl: HTMLElement;

  private mouseDown = false;

  private mouseXDif = 0;

  private mouseYDif = 0;

  private left: number;

  private top: number;

  private dragging = false;

  private eventDestroyHooks: Function[] = [];

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private parent: Draggable,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private modalHelper: ModalHelper,
    private zone: NgZone
  ) {
    this.modalComponentHost = parent.hostElement;
  }

  public ngAfterViewInit(): void {
    // don't run it in zone because it will trigger detect changes in component
    this.zone.runOutsideAngular(() => {
      const mouseMoveFn = this.renderer.listen(
        'document',
        'mousemove',
        (event: MouseEvent) => this.onMouseMove(event)
      );

      const toucheMoveFn = this.renderer.listen(
        'document',
        'touchmove',
        (event: MouseEvent) => this.onMouseMove(event)
      );

      const mouseUpFn = this.renderer.listen(
        'document',
        'mouseup',
        (event: MouseEvent) => this.onMouseUp(event)
      );

      const toucheUpFn = this.renderer.listen(
        'document',
        'touchend',
        (event: MouseEvent) => this.onMouseUp(event)
      );

      this.eventDestroyHooks.push(mouseMoveFn);
      this.eventDestroyHooks.push(mouseUpFn);
      this.eventDestroyHooks.push(toucheMoveFn);
      this.eventDestroyHooks.push(toucheUpFn);
    });
  }

  public ngOnDestroy(): void {
    this.eventDestroyHooks.forEach(destroyFn => destroyFn());
  }

  private timeout;

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.parent.focusOnChange = document.activeElement;

    // enable moving only if width is greater than 600px
    if (
      this.modalHelper.viewport.width > 600 &&
      event.button !== MouseEventButton.Secondary
    ) {
      this.timeout = setTimeout(() => {
        this.preparePseudoEl();
        this.mouseDown = true;
        this.calcPseudoDifOnMouse(this.modalHelper.getMousePosition(event));
      }, 150);
    }
  }

  public onMouseUp(event: MouseEvent): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    if (this.parent.isActive && this.mouseDown) {
      // remove pseudo element from DOM tree
      this.modalComponentHost.nativeElement.removeChild(this.pseudoEl);
      this.mouseDown = false;

      // clear dif
      this.mouseXDif = this.mouseYDif = 0;

      // promijeni pozicije na parent elementu
      if (this.left) {
        this.parent.setLeftPosition(this.left);
      }

      if (this.top) {
        this.parent.setTopPosition(this.top);
      }

      if (this.dragging) {
        this.onStopDragging();
      }
    }
  }

  public onMouseMove(event: MouseEvent): void {
    // prati poziciju i pomići toliko pseudo element
    if (this.mouseDown) {
      this.dragging = true;
      this.parent.setClass();

      this.calcNewPosition(event);
    }
  }

  private onStopDragging(): void {
    // ako bude potrebe za fokusiranjem grida
    // to bi trebalo biti riješeno unutar autoFocus metode
    this.parent.autoFocus();
    // resetirat fokus element možemo iz razloga što je ovo
    // zadnje otvoreni modal
    this.parent.focusOnChange = null;

    this.parent.removeClass();
    this.dragging = false;
  }

  private preparePseudoEl(): void {
    if (!this.pseudoEl) {
      this.pseudoEl = this.renderer.createElement('div');
      this.renderer.appendChild(
        this.modalComponentHost.nativeElement,
        this.pseudoEl
      );
    } else {
      this.modalComponentHost.nativeElement.appendChild(this.pseudoEl);
    }

    this.renderer.addClass(this.pseudoEl, 'modal-pseudo');

    const height = this.parent.height();
    const width = this.parent.width();

    this.renderer.setStyle(this.pseudoEl, 'height', height.toString() + 'px');
    this.renderer.setStyle(this.pseudoEl, 'width', width.toString() + 'px');

    const top = this.top || this.parent.top();
    const left = this.left || this.parent.left();

    this.renderer.setStyle(this.pseudoEl, 'top', top.toString() + 'px');
    this.renderer.setStyle(this.pseudoEl, 'left', left.toString() + 'px');
  }

  /**
   * calculate pseudo modal element position depending on mouse position
   */
  private calcPseudoDifOnMouse({ x, y }: { x: number; y: number }): void {
    const top = this.parent.top();
    const left = this.parent.left();

    this.mouseXDif = x - left;
    this.mouseYDif = y - top;
  }

  private calcNewPosition(event: MouseEvent) {
    const mousePos = this.modalHelper.getMousePosition(event);

    this.top = mousePos.y - this.mouseYDif;
    this.left = mousePos.x - this.mouseXDif;

    this.renderer.setStyle(this.pseudoEl, 'top', this.top.toString() + 'px');
    this.renderer.setStyle(this.pseudoEl, 'left', this.left.toString() + 'px');
  }
}
