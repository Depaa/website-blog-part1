import { Duration } from 'aws-cdk-lib';
import { Runtime, Architecture, ILayerVersion } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IRole, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ILambdaFactory {
  environment?: { [key: string]: string; };
  lambdaLayers?: ILayerVersion[];
  filenamePath: string;
  role: IRole;
  name: string;
  memorySize: number;
}

export const lambdaFactory = (scope: Construct, lambdaConfig: ILambdaFactory, environment: string): NodejsFunction => {
  lambdaConfig.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

  return new NodejsFunction(
    scope,
    lambdaConfig.name,
    {
      memorySize: lambdaConfig.memorySize,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_18_X,
      bundling: {
        minify: environment === 'prod' ? true : false,
        target: 'node18',
        keepNames: true,
        externalModules: [
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/lib-dynamodb',
          '@aws-sdk/util-dynamodb',
          'crypto',
          '@aws-sdk/client-cloudfront',
        ],
      },
      functionName: lambdaConfig.name,
      entry: `src/functions/${lambdaConfig.filenamePath}/index.ts`,
      logRetention: RetentionDays.TWO_WEEKS,
      environment: lambdaConfig.environment,
      role: lambdaConfig.role,
    },
  );
};
