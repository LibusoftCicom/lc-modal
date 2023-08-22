import { ModalEventType } from "./modal-types.class";


export class ModalEvent<T extends ModalEventType, D> {
    /**
	 * @deprecated Use 'type' instead
	 */
    public readonly modalResult: T;
    constructor(public readonly type: T, public readonly data: D = null) {
        this.modalResult = type;
    }
}