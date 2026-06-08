/**
 * Script de seed = remplit la BDD avec des données de test.
 * Commande : npm run prisma:seed (depuis services/academic-service/)
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Novacampus2026!';

const users = [
  {
    email: 'etudiant@novacampus.fr',
    role: Role.STUDENT,
    first_name: 'Marie',
    last_name: 'Dupont',
  },
  {
    email: 'enseignant@novacampus.fr',
    role: Role.INSTRUCTOR,
    first_name: 'Jean',
    last_name: 'Martin',
  },
  {
    email: 'admin@novacampus.fr',
    role: Role.ADMIN,
    first_name: 'Sophie',
    last_name: 'Bernard',
  },
  {
    email: 'direction@novacampus.fr',
    role: Role.DIRECTION,
    first_name: 'Pierre',
    last_name: 'Leroy',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password_hash: passwordHash,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: true,
      },
      create: {
        email: user.email,
        password_hash: passwordHash,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: true,
      },
    });
  }

  console.log('Seed termine — 4 utilisateurs de test crees');
  console.log(`Mot de passe commun : ${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
