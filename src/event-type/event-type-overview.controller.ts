import { Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventTypeOverviewDto } from './dto/event-type-overview.dto';
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeService } from './event-type.service';

@Controller('event-type-overview')
export class EventTypeOverviewController {
  constructor(private readonly service: EventTypeService) {}

  @Get()
  getOverview(@Query('context') context: EventTypeContext): Observable<EventTypeOverviewDto[]> {
    return this.service.getOverviewByContext(context);
  }
}
