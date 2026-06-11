/**
 * Logo NovaCampus Alliance.
 *
 * - <LogoMark/>  : uniquement le losange origami (s'utilise sur fond clair OU sombre).
 * - <LogoFull/>  : le bloc-marque complet (texte anthracite) → fonds clairs uniquement.
 */

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="NovaCampus Alliance"
    >
      <defs>
        <filter
          id="nc-mark-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="1"
            dy="2"
            stdDeviation="2"
            floodColor="#1D1D1B"
            floodOpacity="0.12"
          />
        </filter>
      </defs>
      <g filter="url(#nc-mark-shadow)">
        <polygon points="4,32 32,4 32,32" fill="#FFD500" />
        <polygon points="32,4 60,32 32,32" fill="#1D1D1B" />
        <polygon points="60,32 32,60 32,32" fill="#2D2D2A" />
        <polygon points="32,60 4,32 32,32" fill="#C9960B" />
        <line
          x1="4"
          y1="32"
          x2="32"
          y2="4"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />
        <line
          x1="32"
          y1="4"
          x2="32"
          y2="32"
          stroke="#FFFFFF"
          strokeWidth="0.6"
          opacity="0.18"
        />
        <line
          x1="4"
          y1="32"
          x2="32"
          y2="32"
          stroke="#FFFFFF"
          strokeWidth="0.4"
          opacity="0.12"
        />
      </g>
    </svg>
  );
}

export function LogoFull({ className = 'h-12 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 310 64"
      className={className}
      role="img"
      aria-label="NovaCampus Alliance"
    >
      <title>
        NovaCampus Alliance — Systeme d&apos;Information Academique Centralise
      </title>
      <defs>
        <filter
          id="nc-full-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="1"
            dy="2"
            stdDeviation="2"
            floodColor="#1D1D1B"
            floodOpacity="0.12"
          />
        </filter>
      </defs>

      <g filter="url(#nc-full-shadow)">
        <polygon points="4,32 32,4 32,32" fill="#FFD500" />
        <polygon points="32,4 60,32 32,32" fill="#1D1D1B" />
        <polygon points="60,32 32,60 32,32" fill="#2D2D2A" />
        <polygon points="32,60 4,32 32,32" fill="#C9960B" />
        <line
          x1="4"
          y1="32"
          x2="32"
          y2="4"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />
        <line
          x1="32"
          y1="4"
          x2="32"
          y2="32"
          stroke="#FFFFFF"
          strokeWidth="0.6"
          opacity="0.18"
        />
        <line
          x1="4"
          y1="32"
          x2="32"
          y2="32"
          stroke="#FFFFFF"
          strokeWidth="0.4"
          opacity="0.12"
        />
      </g>

      <text
        y="33"
        fontFamily="'Outfit','Helvetica Neue',Arial,sans-serif"
        fontSize="25"
        fontWeight="800"
        letterSpacing="-0.4"
      >
        <tspan x="76" fill="#FFD500">
          NOVA
        </tspan>
        <tspan fill="#1D1D1B">CAMPUS</tspan>
      </text>

      <text
        x="78"
        y="50"
        fontFamily="'Outfit','Helvetica Neue',Arial,sans-serif"
        fontSize="11.5"
        fontWeight="500"
        fill="#57574F"
        letterSpacing="0.28em"
      >
        ALLIANCE
      </text>

      <text
        x="78"
        y="62"
        fontFamily="'Outfit','Helvetica Neue',Arial,sans-serif"
        fontSize="7.5"
        fontWeight="300"
        fill="#9A9A94"
        letterSpacing="0.04em"
      >
        Systeme d&apos;Information Academique Centralise
      </text>
    </svg>
  );
}
