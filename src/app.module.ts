import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserService } from './modules/users/services/user.service';
import { UserController } from './modules/users/controllers/user.controller';
import { AuthController } from './modules/auth/controllers/auth.controller';
import { AuthService } from './modules/auth/services/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EmailService } from './modules/auth/services/email.service';
import { PageService } from './modules/page/services/page.service';
import { PageController } from './modules/page/controllers/page.controller';
import { PageModule } from './modules/page/page.module';
import { ChatGateway } from './chat/gateway/chat.gateway';
import { ChatService } from './chat/service/chat.service';
import { ChatModule } from './chat/chat.module';
import { NotificationService } from './modules/notification/services/notification.service';
import { NotificationModule } from './modules/notification/notification.module';
import { RiderTypeModule } from './modules/riderType/riderType.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI', { infer: true }),
      }),
      inject: [ConfigService],
    }), UserModule, AuthModule, PageModule, ChatModule, NotificationModule,RiderTypeModule, PaymentsModule,
  ],
  controllers: [AppController, UserController, AuthController, PageController,],
  providers: [AppService, UserService, JwtService, AuthService, EmailService, PageService, ChatService, NotificationService],
})
export class AppModule { }
