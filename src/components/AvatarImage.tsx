import React from 'react';

interface AvatarImageProps {
  avatar?: string;
  name?: string;
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  avatar,
  name = '',
  className = 'w-12 h-12',
}) => {
  const normalized = (avatar || name).toLowerCase();

  let creature = 'wolf';
  if (normalized.includes('goblin')) creature = 'goblin';
  else if (normalized.includes('tiger')) creature = 'tiger';
  else if (normalized.includes('falcon') || normalized.includes('hawk') || normalized.includes('eagle')) creature = 'falcon';
  else if (normalized.includes('fox')) creature = 'fox';
  else if (normalized.includes('dolphin')) creature = 'dolphin';
  else if (normalized.includes('dragon')) creature = 'dragon';
  else if (normalized.includes('bear')) creature = 'bear';
  else if (normalized.includes('wolf')) creature = 'wolf';
  else {
    const list = ['wolf', 'goblin', 'tiger', 'falcon', 'fox', 'dolphin', 'dragon', 'bear'];
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) hash += normalized.charCodeAt(i);
    creature = list[hash % list.length];
  }

  switch (creature) {
    case 'goblin':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="goblin-grad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="0.5" stopColor="#10b981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
            <filter id="goblin-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#goblin-glow)">
            {/* Long Pointed Goblin Ears */}
            <path d="M 20 28 C 10 24 2 18 3 8 C 10 14 16 20 22 24 Z" fill="#34d399" />
            <path d="M 18 26 C 12 23 5 18 7 12 C 11 16 15 20 19 23 Z" fill="#a7f3d0" opacity="0.75" />
            <path d="M 44 28 C 54 24 62 18 61 8 C 54 14 48 20 42 24 Z" fill="#34d399" />
            <path d="M 46 26 C 52 23 59 18 57 12 C 53 16 49 20 45 23 Z" fill="#a7f3d0" opacity="0.75" />
            {/* Head Silhouette */}
            <path d="M 17 22 C 17 12 23 6 32 6 C 41 6 47 12 47 22 C 47 34 44 48 32 58 C 20 48 17 34 17 22 Z" fill="url(#goblin-grad)" />
            {/* Forehead Ridge & Piercing Eyes */}
            <path d="M 21 24 Q 26 21 32 23 Q 38 21 43 24" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="26" cy="30" rx="4.5" ry="3.2" fill="#fef08a" transform="rotate(-6 26 30)" />
            <ellipse cx="38" cy="30" rx="4.5" ry="3.2" fill="#fef08a" transform="rotate(6 38 30)" />
            <circle cx="26" cy="30" r="1.8" fill="#022c22" />
            <circle cx="38" cy="30" r="1.8" fill="#022c22" />
            <circle cx="24.8" cy="29" r="1" fill="#ffffff" />
            <circle cx="36.8" cy="29" r="1" fill="#ffffff" />
            {/* Gold Nose Ring */}
            <path d="M 29 35 L 32 39 L 35 35" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="41" r="3" stroke="#facc15" strokeWidth="1.5" fill="none" />
            {/* Grinning Fangs */}
            <path d="M 24 45 Q 32 50 40 45" stroke="#022c22" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="26,45 28,50 30,45" fill="#ffffff" />
            <polygon points="34,45 36,50 38,45" fill="#ffffff" />
          </g>
        </svg>
      );

    case 'tiger':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="tiger-grad" x1="14" y1="8" x2="50" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
            <filter id="tiger-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#tiger-glow)" transform="translate(0, 3.5)">
            {/* Ears */}
            <circle cx="17" cy="17" r="9" fill="url(#tiger-grad)" />
            <circle cx="17" cy="17" r="5" fill="#1e1b4b" />
            <circle cx="47" cy="17" r="9" fill="url(#tiger-grad)" />
            <circle cx="47" cy="17" r="5" fill="#1e1b4b" />
            {/* Head Face */}
            <ellipse cx="32" cy="35" rx="19" ry="18" fill="url(#tiger-grad)" />
            {/* Fierce Cyber Stripes */}
            <path d="M 32 18 L 32 27 M 26 21 L 32 24 L 38 21 M 27 28 L 32 30 L 37 28" stroke="#1e1b4b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 15 31 L 22 32 M 14 38 L 21 38 M 49 31 L 42 32 M 50 38 L 43 38" stroke="#1e1b4b" strokeWidth="2.2" strokeLinecap="round" />
            {/* Piercing Cyan Eyes */}
            <ellipse cx="24.5" cy="34" rx="4" ry="2.8" fill="#38bdf8" />
            <ellipse cx="39.5" cy="34" rx="4" ry="2.8" fill="#38bdf8" />
            <circle cx="24.5" cy="34" r="1.4" fill="#0f172a" />
            <circle cx="39.5" cy="34" r="1.4" fill="#0f172a" />
            <circle cx="23.5" cy="33" r="0.8" fill="#ffffff" />
            <circle cx="38.5" cy="33" r="0.8" fill="#ffffff" />
            {/* Snout */}
            <ellipse cx="32" cy="44" rx="8" ry="5.5" fill="#fef9c3" />
            <polygon points="30,41 34,41 32,44" fill="#1e1b4b" />
            <path d="M 32 44 L 32 48 M 28 47 Q 32 49 36 47" stroke="#1e1b4b" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'falcon':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="falcon-grad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a5b4fc" />
              <stop offset="0.5" stopColor="#6366f1" />
              <stop offset="1" stopColor="#312e81" />
            </linearGradient>
            <filter id="falcon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#falcon-glow)" transform="translate(0, 2)">
            {/* Crown Plumes */}
            <path d="M 26 8 L 36 14 L 30 18 L 42 17 L 35 24" stroke="#c7d2fe" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Head Crest */}
            <path d="M 21 21 C 21 12 30 10 41 15 C 49 19 51 30 47 41 C 42 50 29 54 23 45 C 17 36 21 25 21 21 Z" fill="url(#falcon-grad)" />
            {/* Eye Ring & Fierce Eye */}
            <circle cx="36" cy="27" r="5.5" fill="#f59e0b" />
            <circle cx="36" cy="27" r="2.8" fill="#0f172a" />
            <circle cx="35" cy="26" r="1.1" fill="#ffffff" />
            {/* Sharp Curved Beak */}
            <path d="M 47 28 C 56 31 60 38 56 46 C 51 44 46 40 44 39 Z" fill="#fbbf24" />
            <path d="M 47 28 C 52 31 56 36 53 42" stroke="#d97706" strokeWidth="1.8" />
            {/* Cheek Accent */}
            <path d="M 33 36 C 38 42 41 48 39 52" stroke="#1e1b4b" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'fox':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="fox-grad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fdba74" />
              <stop offset="0.5" stopColor="#f97316" />
              <stop offset="1" stopColor="#9a3412" />
            </linearGradient>
            <filter id="fox-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f97316" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#fox-glow)">
            {/* Ears */}
            <polygon points="12,28 8,7 26,19" fill="url(#fox-grad)" />
            <polygon points="14,24 11,11 23,20" fill="#18181b" />
            <polygon points="52,28 56,7 38,19" fill="url(#fox-grad)" />
            <polygon points="50,24 53,11 41,20" fill="#18181b" />
            {/* Head Crest */}
            <polygon points="16,21 32,13 48,21 52,36 32,56 12,36" fill="url(#fox-grad)" />
            {/* White Cheek Tufts */}
            <polygon points="12,36 24,34 32,50 20,45" fill="#fff7ed" />
            <polygon points="52,36 40,34 32,50 44,45" fill="#fff7ed" />
            {/* Eyes */}
            <polygon points="20,31 27,33 23,36" fill="#38bdf8" />
            <polygon points="44,31 37,33 41,36" fill="#38bdf8" />
            <circle cx="23.5" cy="33.5" r="1.3" fill="#ffffff" />
            <circle cx="40.5" cy="33.5" r="1.3" fill="#ffffff" />
            {/* Dark Nose */}
            <circle cx="32" cy="51" r="2.8" fill="#18181b" />
          </g>
        </svg>
      );

    case 'dolphin':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="dolphin-grad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.6" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
            <filter id="dolphin-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#dolphin-glow)" transform="translate(0, 3.5)">
            <path d="M 27 15 C 29 8 36 6 38 10 C 37 15 34 19 29 19 Z" fill="#0284c7" />
            <path d="M 10 39 C 13 25 25 15 42 17 C 51 19 56 26 51 33 C 45 42 26 46 12 43 Z" fill="url(#dolphin-grad)" />
            <path d="M 21 37 C 30 33 41 31 47 35 C 41 41 28 43 19 41 Z" fill="#e0f2fe" opacity="0.85" />
            <path d="M 49 23 C 58 25 60 29 57 32 C 52 33 49 31 47 28 Z" fill="#38bdf8" />
            <circle cx="43" cy="24" r="2.5" fill="#0f172a" />
            <circle cx="42.3" cy="23.3" r="1" fill="#ffffff" />
            <path d="M 8 48 Q 15 44 22 48 T 36 48" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>
        </svg>
      );

    case 'dragon':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="dragon-grad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c084fc" />
              <stop offset="0.5" stopColor="#9333ea" />
              <stop offset="1" stopColor="#581c87" />
            </linearGradient>
            <filter id="dragon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#dragon-glow)">
            <path d="M 19 18 C 14 9 9 5 5 7 C 10 14 17 21 21 25 Z" fill="#fbbf24" />
            <path d="M 45 18 C 50 9 55 5 59 7 C 54 14 47 21 43 25 Z" fill="#fbbf24" />
            <polygon points="18,20 32,11 46,20 50,36 32,58 14,36" fill="url(#dragon-grad)" />
            <polygon points="25,32 32,23 39,32 37,47 32,50 27,47" fill="#7e22ce" />
            <polygon points="22,28 29,29 25,33" fill="#facc15" />
            <polygon points="42,28 35,29 39,33" fill="#facc15" />
            <circle cx="25.5" cy="30.5" r="1.4" fill="#ffffff" />
            <circle cx="38.5" cy="30.5" r="1.4" fill="#ffffff" />
            <circle cx="29.5" cy="46" r="1.2" fill="#f43f5e" />
            <circle cx="34.5" cy="46" r="1.2" fill="#f43f5e" />
          </g>
        </svg>
      );

    case 'bear':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="bear-grad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="0.5" stopColor="#2563eb" />
              <stop offset="1" stopColor="#1e3a8a" />
            </linearGradient>
            <filter id="bear-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.5" />
            </filter>
          </defs>
          <g filter="url(#bear-glow)" transform="translate(0, 3.5)">
            <circle cx="17" cy="17" r="9" fill="url(#bear-grad)" />
            <circle cx="17" cy="17" r="5" fill="#93c5fd" opacity="0.75" />
            <circle cx="47" cy="17" r="9" fill="url(#bear-grad)" />
            <circle cx="47" cy="17" r="5" fill="#93c5fd" opacity="0.75" />
            <ellipse cx="32" cy="35" rx="19" ry="18" fill="url(#bear-grad)" />
            <circle cx="24" cy="32" r="3.2" fill="#60a5fa" />
            <circle cx="40" cy="32" r="3.2" fill="#60a5fa" />
            <circle cx="24" cy="32" r="1.4" fill="#ffffff" />
            <circle cx="40" cy="32" r="1.4" fill="#ffffff" />
            <ellipse cx="32" cy="43" rx="9" ry="7" fill="#dbeafe" />
            <ellipse cx="32" cy="40.5" rx="3.8" ry="2.8" fill="#0f172a" />
            <path d="M 32 43 L 32 46 M 28 46 Q 32 48 36 46" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'wolf':
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="wolf-head-grad" x1="16" y1="6" x2="48" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.4" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="wolf-snout-grad" x1="24" y1="26" x2="40" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0c4a6e" />
              <stop offset="1" stopColor="#082f49" />
            </linearGradient>
            <filter id="wolf-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.65" />
            </filter>
          </defs>
          <g filter="url(#wolf-glow)">
            {/* Bold Pointed Ears */}
            <polygon points="12,28 7,5 26,17" fill="url(#wolf-head-grad)" />
            <polygon points="13,24 9,9 23,17" fill="#7dd3fc" opacity="0.8" />
            <polygon points="52,28 57,5 38,17" fill="url(#wolf-head-grad)" />
            <polygon points="51,24 55,9 41,17" fill="#7dd3fc" opacity="0.8" />
            {/* Main Head Structure */}
            <polygon points="16,20 32,10 48,20 54,34 32,58 10,34" fill="url(#wolf-head-grad)" />
            {/* Faceted Cheek & Muzzle Plates */}
            <polygon points="22,28 32,22 42,28 46,38 32,56 18,38" fill="url(#wolf-snout-grad)" />
            <polygon points="27,37 32,32 37,37 32,50" fill="#0284c7" />
            {/* Bright Piercing Glowing Eyes */}
            <polygon points="20,29 28,31 23,34" fill="#e0f2fe" />
            <polygon points="44,29 36,31 41,34" fill="#e0f2fe" />
            <circle cx="24.5" cy="31.5" r="1.5" fill="#ffffff" />
            <circle cx="39.5" cy="31.5" r="1.5" fill="#ffffff" />
            {/* Dark Nose Tip */}
            <polygon points="29,48 35,48 32,52" fill="#082f49" />
          </g>
        </svg>
      );
  }
};
