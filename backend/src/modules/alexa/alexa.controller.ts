import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlexaService } from './alexa.service';
import { Public } from '../../common/decorators';

@ApiTags('Alexa')
@Controller('api/v1/alexa')
export class AlexaController {
  private readonly logger = new Logger(AlexaController.name);

  constructor(private readonly alexaService: AlexaService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Alexa skill webhook endpoint' })
  async handleAlexaRequest(@Body() body: any) {
    this.logger.log(`Alexa request type: ${body?.request?.type}`);
    return this.alexaService.handleRequest(body);
  }
}
