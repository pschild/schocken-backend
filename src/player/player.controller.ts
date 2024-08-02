import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerDto } from './dto/player.dto';
import { PlayerService } from './player.service';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('player')
export class PlayerController {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private service: PlayerService
  ) {
  }

  @Post()
  public create(@Body() dto: CreatePlayerDto): Observable<PlayerDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  public findOne(@Param('id') id: string): Observable<PlayerDto> {
    return this.service.findOne(id);
  }

  @Get()
  public findAll(): Observable<PlayerDto[]> {
    return this.service.findAll();
  }

  @Get('active')
  public getAllActive(): Observable<PlayerDto[]> {
    return this.service.findAllActive();
  }

  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdatePlayerDto): Observable<PlayerDto> {
    this.logger.warn('updating', { context: PlayerController.name });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  public remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
