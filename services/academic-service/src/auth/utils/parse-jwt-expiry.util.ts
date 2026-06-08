/**
 * Convertit une durée JWT (ex. "7d", "24h", "60m") en secondes.
 * Utilisé pour définir le TTL de la liste noire Redis à la déconnexion.
 */
export function parseJwtExpiryToSeconds(expiry: string): number {
  const match = expiry.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60; // défaut : 7 jours
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
}
