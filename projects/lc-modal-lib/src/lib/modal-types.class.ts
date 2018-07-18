import { Observable, Subject } from 'rxjs';

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

export interface IModalComponent<T> {
	isActive: boolean;
	params: any;
	confirm: (data: any) => Observable<IModalResultData<T>>;
	cancel: () => Observable<IModalResultData<T>>;
	title: string;
	setTitle: (title: string) => void;
	preClose?: (modalResult: IModalResult) => Subject<IModalResultData<T>> | Promise<IModalResultData<T>>;
}

export interface IModalDimensions {
	height?: number;
	width?: number;
}
