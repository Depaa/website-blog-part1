import { StackProps } from "aws-cdk-lib/core/lib/stack";

export interface BlogApiCdnInvalidationProps extends StackProps {
  readonly postsTableArn: string;
  readonly apiCdnId: string;
  readonly postsTableStreamArn?: string;
}