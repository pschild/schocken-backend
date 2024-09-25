import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { SpelunkerModule } from 'nestjs-spelunker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  printDependencyTree(app);
  configureSwagger(app);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

function printDependencyTree(app: INestApplication) {
  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  const ignoredModules = ['ConfigModule', 'ConfigHostModule', 'WinstonModule', 'TypeOrmCoreModule', 'TypeOrmModule'];
  const mermaidEdges = edges
    .filter(({ from ,to }) => !ignoredModules.includes(from.module.name) && !ignoredModules.includes(to.module.name))
    .map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`);
  console.log('graph');
  console.log(mermaidEdges.join('\n'));
}

function configureSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('schocken-backend API')
    .setVersion('1.0')
    .build();

  const options: SwaggerDocumentOptions =  {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => methodKey
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document);
}
