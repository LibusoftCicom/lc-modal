import { Observable, of } from 'rxjs';
import { ModalEvent } from './modal-event.class';
import type { ModalFactory } from './modal-factory.class';


export enum ModalEventType {
	Cancel = 0,
	Confirm = 1,
	Reject = 2
}

/**
 * @deprecated Use ModalEventType instead
 */
export enum IModalResult {
	Cancel = 0,
	Confirm = 1,
	Reject = 2
}

export type IModalResultData<T> = ModalEvent<ModalEventType, T>;

export interface IModal<T> {
	title: (title: string) => T;
	params: (params: any) => T;
	component: (comp: any) => T;
	loadComponent: (compLoader: () => Promise<any>) => T;
}

export declare interface IModalResolve<T = any> {
	resolve(modal?: ModalFactory): Observable<T> |  Promise<T> | T;
}

export type IPreCloseReturn =
	Observable<boolean> | Promise<boolean> | boolean | Observable<void> | Promise<void> | void;

export type IPreOpen = () => Observable<boolean> | Promise<boolean> | boolean;

export type IPreclose<T = any> = (result: ModalEvent<ModalEventType, T>) => IPreCloseReturn;

export type IClassPreClose = (eventType: ModalEventType) => IPreCloseReturn;

export interface IModalComponent<T> {
	readonly isActive: boolean;
	readonly isModal: boolean;
	readonly params: any;
	readonly title: string;
	confirm(data: T): Observable<void>;
	cancel(): Observable<void>;
	setTitle(title: string): void;
	preClose?(eventType: ModalEventType | IModalResult): IPreCloseReturn;
}
export interface IModalDimensions {
	height?: number;
	width?: number;
}

export abstract class BaseModalComponent<T = any> implements IModalComponent<T> {
	isActive: boolean;
	isModal: boolean;
	params: any;
	title: string;
	public confirm(data: T): Observable<void> {
		return of();
	}
	public cancel(): Observable<void> {
		return of();
	}
	public setTitle(title: string): void {}
}
