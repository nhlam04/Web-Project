import { FulfillmentStatus } from '../../../shared/constants';

export class UpdateFulfillmentStatusDto {
  status: FulfillmentStatus;
  trackingCode?: string;
  carrier?: string;
}
