import { PartialType } from '@nestjs/mapped-types';
import { CreateItemStockDistributionDto } from './create-item-stock-distribution.dto';

export class UpdateItemStockDistributionDto extends PartialType(CreateItemStockDistributionDto) {}
