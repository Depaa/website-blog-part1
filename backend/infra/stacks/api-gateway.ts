import { App, Stack } from 'aws-cdk-lib';
import { ApiKey, ApiKeySourceType, CognitoUserPoolsAuthorizer, Model, RequestValidator, Resource, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { BuildConfig } from '../lib/common/config.interface';
import { BlogApiStackProps } from '../lib/common/interfaces/blogApi';
import { name } from '../lib/common/utils';
import * as fs from 'fs';

export class BlogApiGatewayStack extends Stack {
  public readonly blogApiGateway: RestApi;
  public readonly postsResource: Resource;
  public readonly requestValidator: RequestValidator;
  public readonly blogApiModels: { [model: string]: Model } = {};
  public readonly blogApiKeyId: string;
  public readonly cognitoAuthorizer: CognitoUserPoolsAuthorizer

  constructor(scope: App, id: string, props: BlogApiStackProps, buildConfig: BuildConfig) {
    super(scope, id, props);

    this.blogApiGateway = this.createApiGateway(id, buildConfig);
    this.blogApiKeyId = this.createApiKey(name(id, 'key'), buildConfig.stacks.api.key).keyId;

    this.requestValidator = this.createApiValidator(name(id, 'body-validator'), this.blogApiGateway);

    this.createApiModel(name(id, 'model'), this.blogApiGateway);

    this.cognitoAuthorizer = this.createApiAuthorizer(name(id, 'auth'), props);
    this.cognitoAuthorizer._attachToApi(this.blogApiGateway);
  };

  private createApiGateway = (name: string, buildConfig: BuildConfig): RestApi => {
    return new RestApi(this, name, {
      description: 'Api gateway for blog',
      deploy: true,
      deployOptions: {
        stageName: 'stage',
        description: 'This stage is not mantained',
        throttlingRateLimit: 0,
        throttlingBurstLimit: 0,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      apiKeySourceType: ApiKeySourceType.HEADER,
    });
  };

  private createApiKey = (name: string, value: string): ApiKey => {
    const apiKey = new ApiKey(this, name, {
      value,
    });

    return apiKey;
  };

  private createApiValidator = (name: string, restApi: RestApi): RequestValidator => {
    return new RequestValidator(this, name, {
      restApi,
      requestValidatorName: name,
      validateRequestBody: true,
    });
  };

  private createApiModel = (name: string, restApi: RestApi): void => {
    const filesname = fs.readdirSync(`${__dirname}/models`);
    for (const file of filesname) {
      const fileName = file.replace('.json', '');
      this.blogApiModels[`${fileName}`] = new Model(this, `${name}-${fileName}`, {
        restApi: restApi,
        modelName: `${name}-${fileName}`.replace(/-/g, ''),
        contentType: 'application/json',
        schema: JSON.parse(fs.readFileSync(`${__dirname}/models/${file}`).toString('utf-8')),
      });
    };
  };

  private createApiAuthorizer = (name: string, props: BlogApiStackProps): CognitoUserPoolsAuthorizer => {
    return new CognitoUserPoolsAuthorizer(this, name, {
      cognitoUserPools: [props.blogUserPool],
    });
  };
}
