import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { BeemSmsService } from './beem-sms.service';

class SendTestSmsDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @MinLength(1)
  message: string;
}

@ApiTags('SMS')
@Controller('sms')
export class BeemSmsController {
  constructor(private readonly beemSmsService: BeemSmsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a test SMS via Beem (admin only)' })
  async send(@Body() dto: SendTestSmsDto): Promise<{ ok: boolean }> {
    const ok = await this.beemSmsService.sendSms(
      dto.phoneNumber,
      dto.message,
      'admin:test',
    );
    return { ok };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Check Beem SMS credit balance' })
  async balance(): Promise<{ creditBalance: number | null }> {
    const creditBalance = await this.beemSmsService.getBalance();
    return { creditBalance };
  }
}
