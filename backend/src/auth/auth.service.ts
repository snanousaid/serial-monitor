import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto): Promise<{ access_token: string; username: string }> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (dto.username !== adminUsername) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Comparaison directe (pour hash bcrypt utiliser bcrypt.compare)
    const isValid =
      dto.password === adminPassword ||
      (await bcrypt.compare(dto.password, adminPassword).catch(() => false));

    if (!isValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: 1, username: dto.username };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, username: dto.username };
  }
}
