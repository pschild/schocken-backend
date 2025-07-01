import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { UserSettings } from '../model/user-settings.entity';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UserSettingsDto } from './dto/user-settings.dto';

@Injectable()
export class UserSettingsService {

  constructor(
    @InjectRepository(UserSettings) private readonly repo: Repository<UserSettings>,
  ) {
  }

  public createOrUpdate(dto: UpdateUserSettingsDto): Observable<UserSettingsDto> {
    return from(this.repo.save(dto));
  }

  public findByUserId(userId: string): Observable<UserSettingsDto> {
    return from(this.repo.findOne({ where: { auth0UserId: userId } }));
  }
}
