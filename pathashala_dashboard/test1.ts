// test1.ts
import { TOTP } from 'totp-generator';
import { chromium } from 'playwright';
import loginToDashboard from './login';

loginToDashboard().catch((error) => {
  console.error('Error in loginToDashboard:', error);
});