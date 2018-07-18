![Logo of the project](https://raw.githubusercontent.com/LibusoftCicom/lc-modal/master/src/assets/logo.png)

# LC Modal

> Angular modal component.

[![npm version](https://badge.fury.io/js/%40libusoftcicom%2Flc-modal.svg)](https://www.npmjs.com/package/@libusoftcicom/lc-modal)

[![Build Status](https://travis-ci.org/LibusoftCicom/lc-modal.svg?branch=master)](https://travis-ci.org/LibusoftCicom/lc-modal)

# Demo

[Click here for preview](https://libusoftcicom.github.io/lc-modal/)

# Description

- LcModal component is an Angular component for displaying custom content in modal
- Compatible with Angular 2+ up to Angular v6.0.0
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
      declarations: [...],
      imports: [
        ModalModule.withComponents([ModalComponentExample]),
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

## Developing

### Built With:

- Angular
- Font Awesome

### Setting up Dev

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.2.

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

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.3.

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

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.3.

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
