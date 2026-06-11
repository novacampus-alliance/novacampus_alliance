import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Adresse email', example: 'admin@novacampus.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mot de passe (min. 6 caractères)', example: 'Novacampus2026!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
