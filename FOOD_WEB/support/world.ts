import { IWorldOptions, World } from '@cucumber/cucumber';

export class CustomWorld extends World {
  constructor(options: IWorldOptions) {
    super(options);
  }
}