import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserContextService } from '../../auth/user/dto/user.context';
import { CustomerAuthGuard } from '../../customer-auth/customer-auth.guard';
import { Public } from '../../utils/decorators';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewStatus } from './entities/product-review.entity';
import { ReviewService } from './review.service';
import { StaffOnlyGuard } from './staff-only.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly userContextService: UserContextService,
  ) {}

  // ========== STOREFRONT (PUBLIC) ==========

  @Public()
  @Get('item/:itemId')
  @ApiOperation({ summary: 'Published reviews of a product, with average and breakdown' })
  forItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.reviewService.forItem(itemId, this.userContextService.getBusinessId());
  }

  // ========== CUSTOMER ==========
  // @Public() only steps past the staff AuthGuard; CustomerAuthGuard is what
  // authenticates these.

  @Public()
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @Get('pending')
  @ApiOperation({ summary: 'Delivered products the logged-in customer has not rated yet' })
  pending(@Request() req) {
    return this.reviewService.pendingFor(req.customer);
  }

  @Public()
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Rate a product from a delivered order' })
  async create(@Request() req, @Body() dto: CreateReviewDto) {
    const review = await this.reviewService.create(req.customer, dto);
    return { id: review.id, rating: review.rating, comment: review.comment };
  }

  // ========== STAFF ==========

  @UseGuards(StaffOnlyGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'All reviews, for moderation' })
  list(
    @Query('status', new ParseEnumPipe(ReviewStatus, { optional: true })) status?: ReviewStatus,
  ) {
    return this.reviewService.listForStaff(this.userContextService.getBusinessId(), status);
  }

  @UseGuards(StaffOnlyGuard)
  @ApiBearerAuth()
  @Put(':id/status')
  @ApiOperation({ summary: 'Publish or hide a review' })
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewStatusDto) {
    return this.reviewService.setStatus(id, this.userContextService.getBusinessId(), dto.status);
  }
}
