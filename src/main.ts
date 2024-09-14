import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { SpelunkerModule } from 'nestjs-spelunker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  const ignoredModules = ['ConfigModule', 'ConfigHostModule', 'WinstonModule', 'TypeOrmCoreModule', 'TypeOrmModule'];
  const mermaidEdges = edges
    .filter(({ from ,to }) => !ignoredModules.includes(from.module.name) && !ignoredModules.includes(to.module.name))
    .map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`);
  console.log('graph');
  console.log(mermaidEdges.join('\n'));

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
