import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventTypeOverviewDto } from './dto/event-type-overview.dto';
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeService } from './event-type.service';

@ApiTags('event-type-overview')
@Controller('event-type-overview')
export class EventTypeOverviewController {
  constructor(private readonly service: EventTypeService) {}

  @Get()
  @ApiOkResponse({ type: [EventTypeOverviewDto] })
  getOverview(@Query('context') context: EventTypeContext): Observable<EventTypeOverviewDto[]> {
    return this.service.getOverviewByContext(context).pipe(
      map(EventTypeOverviewDto.fromEntities)
    );
  }
}
