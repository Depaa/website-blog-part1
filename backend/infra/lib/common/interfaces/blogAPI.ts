import { IUserPool, IUserPoolClient } from "aws-cdk-lib/aws-cognito";
import { StackProps } from "aws-cdk-lib/core/lib/stack";

export interface BlogApiStackProps extends StackProps {
  readonly postsTableArn: string;
  readonly postsTableName: string;
  readonly blogUserPool: IUserPool;
  readonly blogUserPoolClient: IUserPoolClient;
}