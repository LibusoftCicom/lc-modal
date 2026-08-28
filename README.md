![Logo of the project](https://raw.githubusercontent.com/LibusoftCicom/lc-modal/master/src/assets/logo.png)

# LC Modal

> Angular modal component.

[![npm version](https://badge.fury.io/js/%40libusoftcicom%2Flc-modal.svg)](https://www.npmjs.com/package/@libusoftcicom/lc-modal)

[![Build Status](https://travis-ci.org/LibusoftCicom/lc-modal.svg?branch=master)](https://travis-ci.org/LibusoftCicom/lc-modal)

# Demo

[Click here for preview](https://libusoftcicom.github.io/lc-modal/)

# Description

- LcModal component is an Angular component for displaying custom content in modal
- Show any Angular component in modal
- Supports multiple modals and modals inside of a modals
- Has maximize/restore
- Resizable and draggable
- Compatible with Angular 2+ up to Angular v18.0.0
- Only dependency is Font Awesome

# Tested with

- Firefox (latest)
- Chrome (latest)
- Chromium (latest)
- Edge
- IE11

## Installing / Getting started

```shell
npm install @libusoftcicom/lc-modal
```

Register ModalModule in NgModule with components that are opened in modal:

```shell
  import { ModalModule } from '@libusoftcicom/lc-modal';
  import { ModalComponentExample } from '...'; // component used in modal

  @NgModule(
    {
      declarations: [..., ModalComponentExample],
      imports: [
        ModalModule,
        ...
      ],
      providers: [...],
      bootstrap: [...]
      })
  export class AppModule {}
```

Add modal anchor component:

```shell
<dialog-anchor></dialog-anchor>
```

Open modal:

```shell
let modalResult = await this.modal
      .title('Example modal')
      .component(ModalComponentExample)
      .setHeight(370)
      .setWidth(700)
      .draggable(true)
      .showMaximize(true)
      .open();
```

### Customizing styles

Modal styles can be customized with CSS custom properties.

To style a **single modal**, add a custom CSS class with `.addClass()` and define the properties on that class:

```typescript
this.modal
  .component(ModalComponentExample)
  .addClass('my-modal')
  .open();
```

```css
modal-component.my-modal {
  --lc-modal-header-background: #17324d;
  --lc-modal-header-color: #fff;
  --lc-modal-background: #f7f9fb;
  --lc-modal-content-background: #fff;
  --lc-modal-shadow: 0 8px 24px rgba(0, 0, 0, .25);
  --lc-modal-width: 720px;
  --lc-modal-header-height: 36px;
  --lc-modal-header-button-size: 32px;
}
```

To change the look of **every** modal at once, override the same properties on the base `modal-component` selector instead of a modal-specific class:

```css
modal-component {
  --lc-modal-header-background: #17324d;
  --lc-modal-header-color: #fff;
}
```

Available properties include `--lc-modal-overlay-background`,
`--lc-modal-border`, `--lc-modal-min-width`, `--lc-modal-min-height`,
`--lc-modal-top`, `--lc-modal-content-padding`, message-box properties, and
resize handle colors. Existing styles remain the defaults when a property is
not overridden.

### Customizing the header

The default modal header can be replaced with your own component that implements `IModalHeaderComponent`.

To override the header for a **single modal**, call `.header()` on the modal instance:

```typescript
this.modal
  .component(ModalComponentExample)
  .header(CustomHeaderComponent)
  .open();
```

To replace the **default header for every modal**, provide it through the `MODAL_HEADER` token.

With `NgModule`:

```typescript
ModalModule.forRoot({
  header: GlobalModalHeaderComponent
})
```

With a standalone app (`bootstrapApplication`), `ModalModule` is still imported once for its own providers (`Modal`, `ModalHelper`, `ModalConfig`), while `withModalHeader()` is a plain `Provider` that can be added on its own:

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(ModalModule),
    withModalHeader(GlobalModalHeaderComponent)
  ]
});
```

## Developing

### Built With:

- Angular
- Font Awesome

### Setting up Dev

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.1.3.

[Angular CLI](https://github.com/angular/angular-cli) must be installed before building LC Modal component.

```shell
npm install -g @angular/cli
```

```shell
git clone https://github.com/LibusoftCicom/lc-modal.git
cd lc-modal/
npm install
npm run start
```

Open "http://localhost:4200" in browser

### Building

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.1.3.

[Angular CLI](https://github.com/angular/angular-cli) must be installed before building LC Modal component.

```shell
npm install -g @angular/cli
```

```shell
git clone https://github.com/LibusoftCicom/lc-modal.git
cd lc-modal/
npm install
npm run build
```

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [link to tags on this repository](https://github.com/LibusoftCicom/lc-modal/tags).

## Tests

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.1.3.

[Angular CLI](https://github.com/angular/angular-cli) must be installed before building LC modal component.

```shell
npm install -g @angular/cli
```

```shell
git clone https://github.com/LibusoftCicom/lc-modal.git
cd lc-modal/
npm install
npm run test
```

## Contributing

### Want to help?

Want to file a bug, contribute some code, or improve documentation? Excellent! Read up on our [contributing guide](https://github.com/LibusoftCicom/lc-modal/blob/master/CONTRIBUTING.md) and [code of conduct](https://github.com/LibusoftCicom/lc-modal/blob/master/CODE_OF_CONDUCT.md) and then check out one of our [issues](https://github.com/LibusoftCicom/lc-modal/issues).

## Licensing

LC Modal is freely distributable under the terms of the [MIT license](https://github.com/LibusoftCicom/lc-modal/blob/master/LICENSE).
