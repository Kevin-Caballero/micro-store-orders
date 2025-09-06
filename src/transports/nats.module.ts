import { Module } from '@nestjs/common';
import { ClientsModule, Transport, NatsOptions } from '@nestjs/microservices';
import { envs, NATS_SERVICE } from 'src/config';

const natsClientConfig: Array<NatsOptions & { name: string }> = [
  {
    name: NATS_SERVICE,
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers,
    },
  },
];

@Module({
  imports: [ClientsModule.register(natsClientConfig)],
  providers: [],
  exports: [ClientsModule.register(natsClientConfig)],
})
export class NatsModule {}
