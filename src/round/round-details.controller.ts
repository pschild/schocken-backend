import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoundDetailDto } from './dto/round-detail.dto';
import { UpdateFinalistsDto } from './dto/update-finalists.dto';
import { RoundService } from './round.service';

@ApiTags('round-details')
@Controller('round-details')
export class RoundDetailsController {
  constructor(private readonly service: RoundService) {}

  @Get(':gameId')
  @ApiOkResponse({ type: [RoundDetailDto] })
  getByGameId(@Param('gameId') gameId: string): Observable<RoundDetailDto[]> {
    return this.service.getByGameId(gameId).pipe(
      map(RoundDetailDto.fromEntities)
    );
  }

  @Get(':id/details')
  @ApiOkResponse({ type: RoundDetailDto })
  getDetails(@Param('id') id: string): Observable<RoundDetailDto> {
    return this.service.getDetails(id).pipe(
      map(RoundDetailDto.fromEntity)
    );
  }

  @Patch(':id/finalists')
  @ApiOkResponse({ type: RoundDetailDto })
  updateFinalists(@Param('id') id: string, @Body() dto: UpdateFinalistsDto): Observable<RoundDetailDto> {
    return this.service.updateFinalists(id, dto).pipe(
      map(RoundDetailDto.fromEntity)
    );
  }

}
