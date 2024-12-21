import path from 'node:path';
import { type App, Stack, type StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, Model, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { userSchema } from './src/schema/user';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CDKRestAPI extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    /* ----------------- Lambda ----------------- */

    const lambdaExample = new NodejsFunction(this, 'LambdaExample', {
      functionName: 'lambda-example',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './src/lambdaExample.ts'),
      architecture: Architecture.ARM_64,
    });

    const myRequestJsonSchema = zodToJsonSchema(userSchema, {
      target: 'openApi3',
    });

    /* ----------------- API Gateway ----------------- */

    const myAPI = new RestApi(this, 'MyAPI', {
      restApiName: 'myAPI',
    });

    const lambdaIntegration = new LambdaIntegration(lambdaExample);

    myAPI.root.addMethod('POST', lambdaIntegration, {
      requestValidatorOptions: {
        requestValidatorName: 'rest-api-validator',
        validateRequestBody: true,
      },
      requestModels: {
        'application/json': new Model(this, 'my-request-model', {
          restApi: myAPI,
          contentType: 'application/json',
          description: 'Validation model for the request body',
          modelName: 'myRequestJsonSchema',
          schema: myRequestJsonSchema,
        }),
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': Model.ERROR_MODEL,
          },
        },
      ],
    });

    myAPI.addGatewayResponse('ValidationError', {
      type: apigateway.ResponseType.BAD_REQUEST_BODY,
      statusCode: '400',
      templates: {
        'application/json': JSON.stringify({
          errors: '$context.error.validationErrorString',
          details: '$context.error.message',
        }),
      },
    });
  }
}
