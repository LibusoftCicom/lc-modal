export class ModalConfig {
	constructor() {}

	private focusableSelectors =
		'input:not([disabled]):not([readonly]), 	select:not([disabled]),	textarea:not([disabled]):not([readonly]),	button:not([disabled]),	*[tabindex],	*[contenteditable]';

	private ignoreFocusSelectors = '';

	private autoFocusSelectors = '*[autofocus]:not([disabled]):not([readonly])';

	private enableTab = true;

	public set FocusableSelectors(selectors: string) {
		this.focusableSelectors = selectors;
	}

	public get FocusableSelectors() {
		return this.focusableSelectors;
	}

	public set IgnoreFocusSelectors(selectors: string) {
		this.ignoreFocusSelectors = selectors;
	}

	public get IgnoreFocusSelectors() {
		return this.ignoreFocusSelectors;
	}
	public set AutoFocusSelectors(selectors: string) {
		this.autoFocusSelectors = selectors;
	}

	public get AutoFocusSelectors() {
		return this.autoFocusSelectors;
	}

	public set EnableTab(enable: boolean) {
		this.enableTab = enable;
	}

	public get EnableTab() {
		return this.enableTab;
	}

	public getSelectors() {
		return {
			focusableSelectors: this.FocusableSelectors,
			ignoreFocusSelectors: this.IgnoreFocusSelectors,
			autoFocusSelectors: this.AutoFocusSelectors
		};
	}
}
