import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateRoundDto } from './dto/create-round.dto';
import { CreateRoundResponse } from './dto/create-round.response';
import { RoundDto } from './dto/round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { RoundService } from './round.service';

@ApiTags('round')
@Controller('round')
export class RoundController {
  constructor(private readonly service: RoundService) {}

  @Post()
  @ApiBody({ type: CreateRoundDto })
  @ApiCreatedResponse({ type: CreateRoundResponse })
  create(@Body() dto: CreateRoundDto): Observable<CreateRoundResponse> {
    return this.service.create(dto).pipe(
      map(response => ({ ...response, round: RoundDto.fromEntity(response.round) }))
    );
  }

  @Get()
  @ApiOkResponse({ type: [RoundDto] })
  findAll(): Observable<RoundDto[]> {
    return this.service.findAll().pipe(
      map(RoundDto.fromEntities)
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: RoundDto })
  findOne(@Param('id') id: string): Observable<RoundDto> {
    return this.service.findOne(id).pipe(
      map(RoundDto.fromEntity)
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: RoundDto })
  update(@Param('id') id: string, @Body() dto: UpdateRoundDto): Observable<RoundDto> {
    return this.service.update(id, dto).pipe(
      map(RoundDto.fromEntity)
    );
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }

}
