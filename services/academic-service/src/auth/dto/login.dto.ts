import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO (Data Transfer Object) = définit la forme des données attendues au login.
 *
 * Les décorateurs @IsEmail, @MinLength, etc. sont vérifiés automatiquement
 * par le ValidationPipe configuré dans main.ts.
 * Si les données sont invalides → erreur 400 Bad Request.
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
