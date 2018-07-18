import {
  Component,
  ViewContainerRef,
  ViewChild,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Modal } from './modal.service';

@Component({
  selector: 'dialog-anchor',
  template: `<ng-template #content></ng-template>`
})
export class ModalAnchor implements OnInit, OnDestroy {

  @ViewChild('content', { read: ViewContainerRef })
  private viewContainerRef: ViewContainerRef;

  constructor(private modal: Modal) {}

  public ngOnInit(): void {
    this.modal.setViewContainerRef(this.viewContainerRef);
  }

  public ngOnDestroy() {
    this.modal.closeAll();
  }
}
