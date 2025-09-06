import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  BASE_URL: string;
  NATS_SERVERS: string[];
}

const envSchema = joi
  .object<EnvVars>({
    PORT: joi.number().default(3000),
    BASE_URL: joi.string().uri().required(),
    NATS_SERVERS: joi
      .array()
      .items(joi.string().uri())
      .default(['nats://localhost:4222']),
  })
  .unknown(true);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { error, value } = envSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  baseUrl: envVars.BASE_URL,
  natsServers: envVars.NATS_SERVERS,
};
