import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Logger } from 'winston';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { Permissions } from '../auth/decorator/permission.decorator';
import { Permission } from '../auth/model/permission.enum';
import { User } from '../auth/model/user.model';
import { CreateGameDto } from './dto/create-game.dto';
import { GameDetailDto } from './dto/game-detail.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameDetailService } from './game-detail.service';

@ApiTags('game-details')
@Controller('game-details')
export class GameDetailController {
  constructor(
    private readonly service: GameDetailService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @Permissions([Permission.CREATE_GAMES])
  @ApiBody({ type: CreateGameDto })
  @ApiCreatedResponse({ type: GameDetailDto })
  create(@Body() dto: CreateGameDto, @CurrentUser() user: User): Observable<GameDetailDto> {
    return this.service.create(dto).pipe(
      map(GameDetailDto.fromEntity),
      tap(() => this.logger.info(`game created by ${user.userId}`))
    );
  }

  @Get(':id')
  @Permissions([Permission.READ_GAMES])
  @ApiOkResponse({ type: GameDetailDto })
  findOne(@Param('id') id: string): Observable<GameDetailDto> {
    return this.service.findOne(id).pipe(
      map(GameDetailDto.fromEntity)
    );
  }

  @Patch(':id')
  @Permissions([Permission.UPDATE_GAMES])
  @ApiOkResponse({ type: GameDetailDto })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto): Observable<GameDetailDto> {
    return this.service.update(id, dto).pipe(
      map(GameDetailDto.fromEntity)
    );
  }

  @Delete(':id')
  @Permissions([Permission.DELETE_GAMES])
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
