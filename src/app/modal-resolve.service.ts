import { Injectable } from "@angular/core";
import { IModalResolve, Modal, ModalFactory } from "@libusoftcicom/lc-modal";


@Injectable()
export class ModalResolve implements IModalResolve<{ testResolveData: string; }> {

    constructor(private readonly modal: Modal) {}

    public async resolve(modal: ModalFactory): Promise<{ testResolveData: string; }> {
        return new Promise((resolve) => {
            setTimeout(resolve, 100);
        })
        .then(() => {
            return { testResolveData: 'Test title from resolve' };
        });
    }
}