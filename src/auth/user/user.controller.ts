import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  //@UseGuards(AuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  //@UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  //@UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: CreateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  //@UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Put('roles/:id/:userId')
  //@UseGuards(AuthGuard)
  addRoleToUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.userService.addRoleToUser(+id, +userId);
  }

  @Put('/reset-password/:id')
  //@UseGuards(AuthGuard)
  resetPassword(@Param('id') id: string) {
    return this.userService.resetPassword(+id);
  }

  @Put('/update-password/:id')
  //@UseGuards(AuthGuard)
  updatePassword(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.changePassword(
      id,
      updateUserDto.oldPassword,
      updateUserDto.newPassword,
    );
  }
}
