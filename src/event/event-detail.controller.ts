import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateDetailEventResponse } from './dto/create-detail-event.response';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDetailDto } from './dto/event-detail.dto';
import { EventService } from './event.service';

@ApiTags('event-details')
@Controller('event-details')
export class EventDetailsController {
  constructor(private readonly service: EventService) {}

  @Post()
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ type: CreateDetailEventResponse })
  create(@Body() dto: CreateEventDto): Observable<CreateDetailEventResponse> {
    return this.service.create(dto).pipe(
      map(response => ({ ...response, event: EventDetailDto.fromEntity(response.event) }))
    );
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
