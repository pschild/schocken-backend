import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeDto } from './dto/event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventTypeService } from './event-type.service';

@ApiTags('event-type')
@Controller('event-type')
export class EventTypeController {
  constructor(private readonly service: EventTypeService) {}

  @Post()
  @ApiBody({ type: CreateEventTypeDto })
  @ApiCreatedResponse({ type: EventTypeDto })
  create(@Body() dto: CreateEventTypeDto): Observable<EventTypeDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [EventTypeDto] })
  findAll(): Observable<EventTypeDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: EventTypeDto })
  findOne(@Param('id') id: string): Observable<EventTypeDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: EventTypeDto })
  update(@Param('id') id: string, @Body() dto: UpdateEventTypeDto): Observable<EventTypeDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
