import { App } from 'aws-cdk-lib';
import { CDKRestAPI } from './stack';

const app = new App();

new CDKRestAPI(app, 'CDKRestAPI', {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});
