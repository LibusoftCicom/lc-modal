import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Modal } from '@libusoftcicom/lc-modal';
import { ModalComponentExample } from './modal-example/modal-example.component';





@Component({
    selector: 'lazy-loaded-component',
    template: `
    <main role='main'>

        <div class='container'>
            <!-- Example row of columns -->
            <div class='card text-center'>
                <div class='card-header'>Lazy loaded modal without 'dialog-anchor'</div>
                <div class='card-body'>
                    <ul class='list-group list-group-flush'>
                        <li class='list-group-item'>
                            <button type='button' (click)='example()' class='btn btn-primary'>Example modal</button>
                        </li>
                        <li class='list-group-item'>
                            <button type='button' (click)='back()' class='btn btn-primary'>Go Back</button>
                        </li>
                        <li class='list-group-item'>
                            <button type='button' (click)='gotToTest()' class='btn btn-primary'>To Test</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </main>
    `,
    styles: [
        `
        :host {
            display: block;
            padding-bottom: 50px;
        }
        `
    ]
})
export class LazyLoadedBaseComponent {

    constructor(private modal: Modal, private readonly router: Router) {
        console.log(this);
    }

    public async example() {
        const modalResult = await this.modal
            .component(ModalComponentExample)
            .title('Example modal')
            .setHeight(370)
            .setWidth(700)
            .draggable(true)
            .open();
    }

    public back(): void {
        this.router.navigateByUrl('');
    }

    public gotToTest(): void {
        this.router.navigateByUrl('/test');
    }
}
