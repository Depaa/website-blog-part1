import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BuildConfig } from '../lib/common/config.interface';
import { name } from '../lib/common/utils';
import { AccountRecovery, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';

export class BlogAuthorizerStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: App, id: string, props: StackProps, buildConfig: BuildConfig) {
    super(scope, id, props);

    this.userPool = this.createUserPool(id, buildConfig);

    this.userPoolClient = this.createAppClient(name(id, 'client'));
    this.createUserPoolDomain(name(id, 'domain'));
  }

  private createUserPool(name: string, buildConfig: BuildConfig): UserPool {
    return new UserPool(this, name, {
      userPoolName: name,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true
      },
      autoVerify: { email: true, phone: true },
      signInCaseSensitive: false,
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(3),
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });
  };

  private createAppClient(name: string): UserPoolClient {
    return this.userPool.addClient(name, {
      generateSecret: false,
      userPoolClientName: name,
      authFlows: {
        adminUserPassword: true,
      },
      refreshTokenValidity: Duration.minutes(60),
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
    });
  };

  private createUserPoolDomain(name: string): void {
    this.userPool.addDomain(name, {
      cognitoDomain: {
        domainPrefix: name.replace('cognito-', ''),
      },
    });
  };
}
