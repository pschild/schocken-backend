import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventTypeDto } from './dto/event-type.dto';
import { EventTypeService } from './event-type.service';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';

@Controller('event-type')
export class EventTypeController {
  constructor(private readonly service: EventTypeService) {}

  @Post()
  create(@Body() dto: CreateEventTypeDto): Observable<EventTypeDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Observable<EventTypeDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<EventTypeDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventTypeDto): Observable<EventTypeDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
