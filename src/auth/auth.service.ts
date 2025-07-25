import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user/user.service';
import { JwtService } from '@nestjs/jwt';
import { decodePassword } from '../utils/helper.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role/entities/role.entity';
import { Repository } from 'typeorm';
import { Permission } from './permission/entities/permission.entity';
import { Constants } from '../utils/constants';
import { User } from './user/entities/user.entity';
import { RefreshTokenDto } from './user/dto/refresh.token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    console.log('inside  login now');
    const user = await this.usersService.findOneByUsername(username);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await decodePassword(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = await this.getUserPermissions(user);

    const payload = {
      sub: user.id,
      username: user.name,
      permissions,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '6000s',
        secret: Constants.JWT_SECRET,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: Constants.JWT_REFRESH_TOKEN,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // async refresh(
  //   refreshToken: RefreshTokenDto,
  // ): Promise<{ access_token: string }> {
  //   console.log(refreshToken);
  //   try {
  //     await this.jwtService.verifyAsync(refreshToken.refreshToken, {
  //       secret: Constants.JWT_REFRESH_TOKEN,
  //     });
  //   } catch (error) {
  //     throw new UnauthorizedException('Invalid or expired refresh token');
  //   }
  //
  //   const user = null;
  //
  //   if (!user) {
  //     throw new UnauthorizedException('User not found');
  //   }
  //
  //   const permissions = await this.getUserPermissions(user);
  //
  //   const payload = {
  //     sub: user.id,
  //     username: user.username,
  //     permissions,
  //   };
  //
  //   const accessToken = await this.jwtService.signAsync(payload, {
  //     expiresIn: '600s',
  //     secret: Constants.JWT_SECRET,
  //   });
  //
  //   return {
  //     access_token: accessToken,
  //   };
  // }

  private async getUserPermissions(user: User): Promise<Permission[]> {
    const rolePromises = user.rolesList.map((role) =>
      this.roleRepository.findOne({
        where: { id: role.id },
        relations: ['permissions'],
      }),
    );

    const rolesWithPermissions = await Promise.all(rolePromises);

    const permissionsSet = new Set<Permission>();
    rolesWithPermissions.forEach((role) => {
      if (role?.permissions) {
        role.permissions.forEach((permission) =>
          permissionsSet.add(permission),
        );
      }
    });

    return Array.from(permissionsSet); // Convert Set to array
  }
}
