import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
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

  const swaggerDocumentationTitle = "Revisere Backend API";
  const swaggerDocumentationDescription =
    "AI-powered legal contract analysis API. Upload contracts for extraction, risk analysis, summarization, and comparison.";
  const swaggerDocumentationVersion = "1.0.0";
  const swaggerDocumentationBaseUrl = "/api/docs";

  const swaggerDocumentationConfiguration = new DocumentBuilder()
    .setTitle(swaggerDocumentationTitle)
    .setDescription(swaggerDocumentationDescription)
    .setVersion(swaggerDocumentationVersion)
    .addTag("Contract Analysis", "Upload and analyze single contract documents")
    .addTag("Contract Comparison", "Compare two contract versions")
    .addTag("Health", "Service health check endpoints")
    .build();

  const swaggerDocumentation = SwaggerModule.createDocument(
    app,
    swaggerDocumentationConfiguration,
  );
  SwaggerModule.setup(swaggerDocumentationBaseUrl, app, swaggerDocumentation);

  const applicationPort = configService.get<number>("PORT") ?? 3000;
  await app.listen(applicationPort);
  bootstrapLogger.log(
    `Revisere Backend running on http://localhost:${applicationPort}`,
  );
}

bootstrap();
