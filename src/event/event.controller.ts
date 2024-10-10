import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventResponse } from './dto/create-event.response';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventService } from './event.service';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ type: CreateEventResponse })
  create(@Body() dto: CreateEventDto): Observable<CreateEventResponse> {
    return this.service.create(dto).pipe(
      map(response => ({ ...response, event: EventDto.fromEntity(response.event) }))
    );
  }

  @Get()
  @ApiOkResponse({ type: [EventDto] })
  findAll(): Observable<EventDto[]> {
    return this.service.findAll().pipe(
      map(EventDto.fromEntities)
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: EventDto })
  findOne(@Param('id') id: string): Observable<EventDto> {
    return this.service.findOne(id).pipe(
      map(EventDto.fromEntity)
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: EventDto })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto): Observable<EventDto> {
    return this.service.update(id, dto).pipe(
      map(EventDto.fromEntity)
    );
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
