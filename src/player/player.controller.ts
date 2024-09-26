import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerDto } from './dto/player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerService } from './player.service';

@ApiTags('player')
@Controller('player')
export class PlayerController {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private service: PlayerService
  ) {
  }

  @Post()
  @ApiBody({ type: CreatePlayerDto })
  @ApiCreatedResponse({ type: PlayerDto })
  @ApiBadRequestResponse({ description: 'When a player with given name already exists.' })
  public create(@Body() dto: CreatePlayerDto): Observable<PlayerDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: PlayerDto })
  public findOne(@Param('id') id: string): Observable<PlayerDto> {
    return this.service.findOne(id);
  }

  @Get()
  @ApiOkResponse({ type: [PlayerDto] })
  public findAll(@Query('active') active: boolean): Observable<PlayerDto[]> {
    return active ? this.service.findAllActive() : this.service.findAll();
  }

  @Patch(':id')
  @ApiBody({ type: UpdatePlayerDto })
  @ApiOkResponse({ type: PlayerDto })
  @ApiBadRequestResponse({ description: 'When a player with given name already exists.' })
  public update(@Param('id') id: string, @Body() dto: UpdatePlayerDto): Observable<PlayerDto> {
    this.logger.warn('updating', { context: PlayerController.name });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  public remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
