-- Ajout du rôle DEMO (accès de démonstration à tous les portails)
-- "IF NOT EXISTS" rend la migration idempotente (déjà appliquée manuellement
-- sur certains environnements).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEMO';
