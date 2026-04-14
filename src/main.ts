import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalHttpExceptionFilter } from "./common/filters/global-http-exception.filter";
import { ConfigService } from "@nestjs/config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const bootstrapLogger = new Logger("Bootstrap");

  const frontendOrigin =
    configService.get<string>("FRONTEND_ORIGIN") ?? "http://localhost:5173";

  app.enableCors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for multipart form data
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const applicationPort = configService.get<number>("PORT") ?? 3000;
  await app.listen(applicationPort);
  bootstrapLogger.log(
    `ContractLens Backend running on http://localhost:${applicationPort}`,
  );
}

bootstrap();
