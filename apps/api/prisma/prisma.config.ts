import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})