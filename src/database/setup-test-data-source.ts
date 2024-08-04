import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

/**
 * Setup a data source for in-memory postgres used by integration tests.
 * @param entities Pass your entities
 * @param withMigration If `true` the migrations are run, otherwise entity syncing is enabled.
 */
export const setupDataSource = async (entities: unknown[], withMigration = false) => {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  if (withMigration) {
    db.createSchema('hoptimisten');
  }

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'user',
  });

  db.public.registerFunction({
    name: 'obj_description',
    args: [DataType.text, DataType.text],
    returns: DataType.text,
    implementation: () => 'test',
  });

  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: v4,
      impure: true,
    });
  });

  const source = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    ...(withMigration ? {
      schema: 'hoptimisten',
      migrations: ['src/migration/*.ts']
    } : {}),
    entities,
  });

  await source.initialize();

  if (withMigration) {
    await source.runMigrations();
  } else {
    await source.synchronize();
  }

  return source;
};

export const truncateAllTables = async (source: DataSource) => {
  const entities = source.entityMetadatas;
  const tableNames = entities.map(entity => `"${entity.tableName}"`);
  await Promise.all(tableNames.map(name => source.query(`TRUNCATE ${name} CASCADE;`)));
  console.log("[TEST DATABASE]: Clean");
};
