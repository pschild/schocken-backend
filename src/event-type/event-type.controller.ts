import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Permissions } from '../auth/decorator/permission.decorator';
import { Permission } from '../auth/model/permission.enum';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeDto } from './dto/event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventTypeService } from './event-type.service';

@ApiTags('event-type')
@Controller('event-type')
export class EventTypeController {
  constructor(private readonly service: EventTypeService) {}

  @Post()
  @Permissions([Permission.CREATE_EVENT_TYPES])
  @ApiBody({ type: CreateEventTypeDto })
  @ApiCreatedResponse({ type: EventTypeDto })
  create(@Body() dto: CreateEventTypeDto): Observable<EventTypeDto> {
    return this.service.create(dto).pipe(
      map(EventTypeDto.fromEntity)
    );
  }

  @Get()
  @Permissions([Permission.READ_EVENT_TYPES])
  @ApiOkResponse({ type: [EventTypeDto] })
  findAll(): Observable<EventTypeDto[]> {
    return this.service.findAll().pipe(
      map(EventTypeDto.fromEntities)
    );
  }

  @Patch(':id')
  @Permissions([Permission.UPDATE_EVENT_TYPES])
  @ApiOkResponse({ type: EventTypeDto })
  update(@Param('id') id: string, @Body() dto: UpdateEventTypeDto): Observable<EventTypeDto> {
    return this.service.update(id, dto).pipe(
      map(EventTypeDto.fromEntity)
    );
  }

  @Delete(':id')
  @Permissions([Permission.DELETE_EVENT_TYPES])
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
