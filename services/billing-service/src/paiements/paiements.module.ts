import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Paiement, PaiementSchema } from './paiement.schema';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { FactureService } from './facture.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Paiement.name, schema: PaiementSchema }])],
  controllers: [PaiementsController],
  providers: [PaiementsService, FactureService],
  exports: [PaiementsService],
})
export class PaiementsModule {}
