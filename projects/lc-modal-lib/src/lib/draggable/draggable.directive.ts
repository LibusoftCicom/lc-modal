import { Directive, Optional, Host, SkipSelf, ElementRef } from '@angular/core';
import { ModalComponent } from '../modal.component';

@Directive({ selector: '[draggable]' })
export class Draggable {
  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private parent: ModalComponent
  ) {}

  public isActive(): boolean {
    return this.parent.isActive;
  }

  public autoFocus(): void {
    this.parent.autoFocus();
  }

  public height(): number {
    return this.parent.getHeight();
  }

  public width(): number {
    return this.parent.getWidth();
  }

  public get hostElement(): ElementRef {
    return <ElementRef>(<any>this.parent).hostElementRef;
  }

  public left(): number {
    return this.parent.getPositionLeft();
  }

  public top(): number {
    return this.parent.getPositionTop();
  }

  public setLeftPosition(pos: number): void {
    this.parent.setLeftPosition(pos);
  }

  public setTopPosition(pos: number): void {
    this.parent.setTopPosition(pos);
  }

  public setClass(): void {
    this.parent.setClass('dragging');
  }

  public removeClass(): void {
    this.parent.removeClass('dragging');
  }

  public set focusOnChange(el: Element) {
    this.parent.focusOnChange = el;
  }
}
