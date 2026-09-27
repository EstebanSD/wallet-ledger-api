import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/account.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), AccountsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
