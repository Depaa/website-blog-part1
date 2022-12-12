import { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { invalidateCache } from '@common/services/cloudfront-connection';

export const handler = async (event: DynamoDBStreamEvent) => {
  console.info(`Received ${event.Records.length} records`);
  /*
  * TODO:
  * invalidate single objects when possibile
  */
  await invalidateCache([`/posts*`]);
}