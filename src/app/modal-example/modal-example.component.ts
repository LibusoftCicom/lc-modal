import { Component } from '@angular/core';
import { Modal, IModalComponent, IModalResultData, IModalResult } from '@libusoftcicom/lc-modal';
import { Observable, of } from 'rxjs';

@Component({
	selector: `modal-component-example`,
	template: `<form class="needs-validation" novalidate (ngSubmit)="confirm(model)" #exampleForm="ngForm">
  <div class="form-group row">
    <label for="validationCustom01"  class="col-sm-2 col-form-label">First name</label>
    <div class="col-sm-10">
      <input autofocus type="text" class="form-control" id="validationCustom01" placeholder="First name" value="Mark" required [(ngModel)]="model.firstName" name="firstName">
      <div class="valid-feedback"> Looks good! </div>
    </div>
  </div>


  <div class="form-group row">
    <label for="validationCustom02"  class="col-sm-2 col-form-label">Last name</label>
    <div class="col-sm-10">
      <input type="text" class="form-control" id="validationCustom02" placeholder="Last name" value="Otto" required [(ngModel)]="model.lastName" name="lastName">
      <div class="valid-feedback"> Looks good! </div>
    </div>
  </div>

  <div class="form-group row">
    <label for="validationCustomUsername"  class="col-sm-2 col-form-label">Username</label>
    <div class="col-sm-10">
      <div class="input-group">
        <div class="input-group-prepend">
          <span class="input-group-text" id="inputGroupPrepend">@</span>
        </div>
        <input type="text" class="form-control" id="validationCustomUsername" placeholder="Username" aria-describedby="inputGroupPrepend" required  [(ngModel)]="model.username" name="username">
        <div class="invalid-feedback">
          Please choose a username.
        </div>
      </div>
    </div>
  </div>

  <div class="form-group row">
    <label for="validationCustom03"  class="col-sm-2 col-form-label">City</label>
    <div class="col-sm-10">
      <input type="text" class="form-control" id="validationCustom03" placeholder="City" required  [(ngModel)]="model.city" name="city">
      <div class="valid-feedback"> Please provide a valid city. </div>
    </div>
  </div>

  <div class="form-group row">
    <label for="validationCustom04"  class="col-sm-2 col-form-label">State</label>
    <div class="col-sm-10">
      <input type="text" class="form-control" id="validationCustom04" placeholder="State" required  [(ngModel)]="model.state" name="state">
      <div class="valid-feedback"> Please provide a valid state. </div>
    </div>
  </div>

  <button class="btn btn-primary" type="submit">Submit form</button>
</form>`,
	styles: [``]
})
export class ModalComponentExample implements IModalComponent<any> {
	public model: any = {};

	public isActive: boolean;
	public params: any;
	public title: string;
	constructor(private modal: Modal) {}

	public confirm(data: any) {
		return of<IModalResultData<any>>({
			data: this.model,
			modalResult: IModalResult.Confirm
		});
	}

	public cancel() {
		return of<IModalResultData<any>>({
			modalResult: IModalResult.Cancel
		});
	}

	public setTitle(title: string) {
		this.title = title;
	}
}
