import { ApiProperty } from '@nestjs/swagger';
import { GetUsers200ResponseOneOfInner } from 'auth0';

export class UserDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  email: string;

  static fromEntity(entity: GetUsers200ResponseOneOfInner): UserDto {
    return entity ? {
      id: entity.user_id,
      name: entity.name,
      email: entity.email,
    } : null;
  }

  static fromEntities(entities: GetUsers200ResponseOneOfInner[]): UserDto[] {
    return entities.map(e => UserDto.fromEntity(e));
  }
}
