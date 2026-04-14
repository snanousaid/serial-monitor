import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('recent')
  findRecent(@Query('limit') limit = '50') {
    return this.eventsService.findRecent(+limit);
  }

  @Get()
  find(
    @Query('page')     page?:     string,
    @Query('limit')    limit?:    string,
    @Query('deviceId') deviceId?: string,
    @Query('type')     type?:     string,
    @Query('search')   search?:   string,
    @Query('from')     from?:     string,
    @Query('to')       to?:       string,
  ) {
    return this.eventsService.findPaginated({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      deviceId, type, search, from, to,
    });
  }
}
