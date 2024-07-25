import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { CreatePlayerDto } from './create-player.dto';
import { PlayerDto } from './player.dto';
import { PlayerService } from './player.service';
import { UpdatePlayerDto } from './update-player.dto';

@Controller('player')
export class PlayerController {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private service: PlayerService
  ) {
  }

  @Post()
  public create(@Body() dto: Partial<CreatePlayerDto>): Observable<PlayerDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  public findOne(@Param('id') id: string): Observable<PlayerDto> {
    return this.service.findOne(id);
  }

  @Get()
  public getAll(): Observable<PlayerDto[]> {
    return this.service.getAll();
  }

  @Get('active')
  public getAllActive(): Observable<PlayerDto[]> {
    return this.service.getAllActive();
  }

  @Put(':id')
  public update(@Param('id') id: string, @Body() dto: Partial<UpdatePlayerDto>): Observable<PlayerDto> {
    this.logger.warn('updating', { context: PlayerController.name });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  public remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
