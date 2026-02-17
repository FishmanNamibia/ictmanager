// Used by TypeORM CLI for migrations (run with node -r ts-node/register or tsconfig-paths)
const { DataSource } = require('typeorm');
require('dotenv').config();

module.exports = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
