import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RegisterDto, LoginDto, UpdateProfileDto, LinkAlexaDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.usersRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    const token = this.generateToken(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      ...token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'phone', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      ...token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['caregiverProfiles', 'caregiverProfiles.baby'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);
    const updatedUser = await this.usersRepository.save(user);

    return this.sanitizeUser(updatedUser);
  }

  async linkAlexa(userId: string, dto: LinkAlexaDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.alexaUserId = dto.alexaUserId;
    await this.usersRepository.save(user);

    return { message: 'Alexa account linked successfully' };
  }

  async findByAlexaUserId(alexaUserId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { alexaUserId } });
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
