import { Before, After } from '@cucumber/cucumber';

Before(() => {
  console.log('Before each scenario');
});

After(() => {
  console.log('After each scenario');
});