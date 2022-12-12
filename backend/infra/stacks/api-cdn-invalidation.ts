import { App, Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Function, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { BuildConfig } from '../lib/common/config.interface';
import { BlogApiCdnInvalidationProps } from '../lib/common/interfaces/blogApiCdnInvalidation';
import { lambdaFactory } from '../lib/common/lambda-factory';

export class ApiCdnInvalidationStack extends Stack {
  public readonly todosTable: Table;

  constructor(scope: App, id: string, props: BlogApiCdnInvalidationProps, buildConfig: BuildConfig) {
    super(scope, id, props);

    const table = Table.fromTableAttributes(this, `${id}-table`, {
      tableArn: props.postsTableArn,
      tableStreamArn: props.postsTableStreamArn,
    });

    const baseEnv = {
      REGION: this.region,
      ENV: buildConfig.environment,
      API_DISTRIBUTION_ID: props.apiCdnId,
    };

    const invalidatePostsCacheFunction = this.createTriggerFunction(`${id}-posts-trigger`, buildConfig, props, baseEnv);

    invalidatePostsCacheFunction.addEventSource(new DynamoEventSource(table, {
      startingPosition: StartingPosition.LATEST,
      maxBatchingWindow: Duration.minutes(1),
      batchSize: 10,
      maxRecordAge: Duration.minutes(5),
    }));
  };

  private createTriggerFunction = (
    name: string,
    buildConfig: BuildConfig,
    props: BlogApiCdnInvalidationProps,
    environment?: { [key: string]: string; }
  ): Function => {
    const createPolicy = new Policy(this, `${name}-policy`, {
      statements: [
        new PolicyStatement({
          actions: ['cloudfront:CreateInvalidation'],
          effect: Effect.ALLOW,
          resources: [
            `arn:${this.partition}:cloudfront::${this.account}:distribution/${props.apiCdnId}`
          ],
        }),
      ],
    });
    const createRole = new Role(this, `${name}-role`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    createRole.attachInlinePolicy(createPolicy);

    return lambdaFactory(this, {
      name,
      filenamePath: 'posts/invalidate-cache',
      role: createRole,
      memorySize: 128,
      environment,
    }, buildConfig.environment);
  }
}