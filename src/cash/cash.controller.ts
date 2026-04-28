import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { PurchaseService } from './purchase.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CashQueryDto } from './dto/cash-query.dto';
import { RecordPurchaseDto } from './dto/record-purchase.dto';

@ApiTags('Cash')
@Controller('cash')
export class CashController {
  constructor(
    private readonly cashService: CashService,
    private readonly purchaseService: PurchaseService,
  ) {}

  @Post('purchases')
  @ApiOperation({
    summary:
      'Record an inventory purchase: creates inventory transaction + bumps stock in-transit + records cash-out, atomically',
  })
  recordPurchase(@Body() dto: RecordPurchaseDto) {
    return this.purchaseService.recordPurchase(dto);
  }

  @Post('movements')
  @ApiOperation({
    summary:
      'Create a cash movement (manual entry, opening balance, transfer, owner draw, etc.)',
  })
  create(@Body() dto: CreateCashMovementDto) {
    return this.cashService.create(dto);
  }

  @Get('movements')
  @ApiOperation({
    summary: 'List cash movements (filter by date range / method / type / source)',
  })
  findAll(@Query() query: CashQueryDto) {
    return this.cashService.findAll(query);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Current cash balance per method + total' })
  getBalance() {
    return this.cashService.getBalance();
  }

  @Get('movements/:id')
  @ApiOperation({ summary: 'Get a single cash movement' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashService.findOne(id);
  }

  @Put('movements/:id')
  @ApiOperation({ summary: 'Update a cash movement' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCashMovementDto>,
  ) {
    return this.cashService.update(id, dto);
  }

  @Delete('movements/:id')
  @ApiOperation({ summary: 'Soft-delete a cash movement' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cashService.remove(id);
  }
}
