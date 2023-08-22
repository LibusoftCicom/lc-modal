import { DEFAULT_Z_INDEX, ModalClassNames } from "./modal-configuration.class";
import type { ModalFactory } from "./modal-factory.class";


/**
 * 
 * It's used to track which modal is active.
 * We mark the modal as active by applying a CSS classname
 * of "active" and calculate the zIndex to set its new position.
 */
export class ModalActiveModel {
    private activeModal: ModalFactory = null;

    private lastOverlayModal: ModalFactory = null;

    public set(modal: ModalFactory): void {
        if (modal === this.activeModal) {
            // console.info('You are trying to mark the already active element as active again.');
            return;
        }


        /**
         * If the modal we want to bring into focus has an overlay,
         * and the currently active one doesn't, it's not possible to bring it into focus.
         * This assumption is based on the idea that modals without overlays are opened as
         * child elements to the one with an overlay.
         */
        // if (this.activeModal &&
        //     !this.activeModal.isDestroying &&
        //     modal['configuration'].isOverlayVisible() && 
        //     !(this.activeModal['configuration'].isOverlayVisible())
        //     ) {
        //     return;
        // }


        /**
         * Find the highest zIndex assuming 
         * that the previously active element
         * already has the highest zIndex.
         */
        const zIndex = Math.max(this.activeModal?.getOrder() || 0, modal.getOrder(), DEFAULT_Z_INDEX);

        /**
         * Remove the "active" class from the previously active element.
         */
        this.activeModal?.removeClass(ModalClassNames.ACTIVE);

        /**
         * move only active modal to the top by increasing the maximum z-index by 1
         * and do that only if this modal already has not the highest z-index
         */
        if (modal.getOrder() <= zIndex) {
            modal.setOrder(zIndex + 1);
        }

        /**
         * mark with clas name active element
         */
        modal.addClass(ModalClassNames.ACTIVE);
        /**
         * auto focus element
         */
        modal.hostComponentRef.autoFocus();

        /**
         * mark new element as active
         */
        this.activeModal = modal;

        /**
		 * hide or show overlay on this instance,
         * only last element with overlay can have it
		 *
		 * if element have overlay and if same element is not last
		 * we can't place it above all other with overlay
		 */
        if (modal['configuration'].isOverlayVisible()) {
            /**
             * Remove the overlay only if the element with the overlay is being replaced.
             */
            this.lastOverlayModal?.removeClass(ModalClassNames.OVERLAY_ACTIVE);
            /**
             * Mark the new element as active.
             */
            this.lastOverlayModal = modal;
            this.lastOverlayModal.addClass(ModalClassNames.OVERLAY_ACTIVE);
        }

        /**
         * If there isn't any element before this one,
         * and this element doesn't have an overlay, clear
         * the reference to the last overlay modal to prevent memory leaks
         */
        if (this.lastOverlayModal?.isDestroying) {
            this.lastOverlayModal = null;
        }
    }

    public get(): ModalFactory {
        return this.activeModal;
    }

    public isActive(modal: ModalFactory): boolean {
        return this.activeModal === modal;
    }

    public clear(): void {
        this.lastOverlayModal?.removeClass(ModalClassNames.OVERLAY_ACTIVE);
        this.activeModal?.removeClass(ModalClassNames.ACTIVE);
        this.lastOverlayModal = null;
        this.activeModal = null;
    }
}


export const ACTIVE_MODAL: ModalActiveModel = new ModalActiveModel();