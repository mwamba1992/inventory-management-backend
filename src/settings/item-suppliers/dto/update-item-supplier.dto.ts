import { PartialType } from '@nestjs/mapped-types';
import { CreateItemSupplierDto } from './create-item-supplier.dto';

export class UpdateItemSupplierDto extends PartialType(CreateItemSupplierDto) {}
