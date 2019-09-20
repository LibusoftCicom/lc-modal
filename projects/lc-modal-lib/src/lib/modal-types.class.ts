import { Observable, of } from 'rxjs';

export enum IModalResult {
	Cancel = 0,
	Confirm = 1,
	Reject = 2
}

export interface IModalResultData<T> {
	modalResult: IModalResult;
	data?: T;
}

export interface IModal<T> {
	title: (title: string) => T;
	params: (params: any) => T;
	component: (comp: any) => T;
}

export type IPrecloseReturn =
	Observable<boolean> | Promise<boolean> | boolean | Observable<void> | Promise<void> | void;

export type IPreclose<T = any> = (result: IModalResultData<T>) => IPrecloseReturn;

export type IClassPreclose = (result: IModalResult) => IPrecloseReturn;

export interface IModalComponent<T> {
	isActive: boolean;
	isModal: boolean;
	params: any;
	confirm: (data: any) => Observable<void>;
	cancel: () => Observable<void>;
	title: string;
	setTitle: (title: string) => void;
	preClose?: IClassPreclose;
}

export interface IModalDimensions {
	height?: number;
	width?: number;
}


export abstract class BaseModalComponent<T = any> implements IModalComponent<T> {
	public isActive: boolean;
	public isModal: boolean;
	public params: any;
	public title: string;
	public confirm(data: T): Observable<void> { return of(null); }
	public cancel(): Observable<void> { return of(null); }
	public setTitle(title: string): void {}
}
