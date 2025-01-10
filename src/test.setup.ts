import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { getDockerDataSource } from './test.utils';

const init = async () => {
  const container = await new PostgreSqlContainer('postgres:15.7').withEnvironment({ TZ: 'Europe/Berlin' }).start();

  process.env.DATABASE_HOST = container.getHost();
  process.env.DATABASE_PORT = container.getPort().toString();
  process.env.DATABASE_USER = container.getUsername();
  process.env.DATABASE_PASSWORD = container.getPassword();
  process.env.DATABASE_DB = container.getDatabase();

  global.container = container;

  global.source = await getDockerDataSource();
};

export default init;
