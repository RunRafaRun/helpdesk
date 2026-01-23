import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Configure UTF-8 charset for proper Spanish character support
  const fastifyInstance = app.getHttpAdapter().getInstance();

    // Configure JSON serialization with UTF-8
    fastifyInstance.setSerializerCompiler(({ schema, method, url, httpStatus }) => {
      return (data) => {
        return JSON.stringify(data); // Compact JSON.stringify with UTF-8 support
      };
    });

  // Set UTF-8 headers for all JSON responses
  fastifyInstance.addHook('onSend', (request, reply, payload, done) => {
    if (reply.getHeader('content-type')?.toString().includes('application/json')) {
      reply.header('content-type', 'application/json; charset=utf-8');
    }
    done(null, payload);
  });

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );



  const config = new DocumentBuilder()
    .setTitle("Helpdesk API")
    .setDescription("API del sistema de tickets (V1 fixed3) - con Auth y maestros")
    .setVersion("0.3.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/docs", app, document);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, "0.0.0.0");
}
bootstrap();
