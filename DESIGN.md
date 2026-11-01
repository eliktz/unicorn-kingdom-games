# ממלכת חדי הקרן — design notes

Original kid's games (age ~7) inspired by the *world* of the Hebrew "Fairy Unicorns"
series (Zoe, a star-coated flying unicorn, a secret island reached through an oak tree,
a silly mischief pony). **No book text or art is used** — all names in-game are our own
("אסטרה", "זואי", "צל"/Shadow as a silly pony), all art is procedural three.js.

## Palette tokens
| token        | hex       | use                         |
|--------------|-----------|-----------------------------|
| sky-top      | #3a2766   | top of the dreamy sky       |
| sky-mid      | #7d5aa8   | mid lilac band              |
| sky-glow     | #ffc3e3   | rose horizon                |
| bloom-pink   | #ff8fc8   | primary magic accent        |
| lilac        | #c9a9f5   | secondary                   |
| silver       | #e8e6f5   | UI frames, star-coat        |
| mint         | #a9f0d6   | blooming trees / success    |
| star-gold    | #ffe08a   | stars                       |
| ink          | #3a2550   | text on light panels        |

Deliberately avoids the owl games' gold-on-navy chrome. Frosted lilac panels
`rgba(70,45,110,.72)`, silver borders, soft pink outer glow.

## Type
Rubik (vendored woff2, rounded Hebrew+Latin), one family. Headlines soft-white with
pink/lilac shadow + silver glow. Minimal Hebrew, RTL, sentence case.

## Characters (procedural)
- **אסטרה / Astra** — white unicorn, lilac shading, pearlescent spiral horn, layered
  pastel-rainbow mane + tail, translucent feathered wings, twinkling silver star speckles.
- **זואי / Zoe** — girl hero chibi, lilac dress, rides/cheers.
- **צל / Shadow** — silly round grey pony, droopy ears, harmless; runs off when foiled.
- **Props** — bloomable tree (bare → blossom), flower, star, cloud, oak-tunnel.

## Games
1. **מסע הקשת של אסטרה** (astra-rainbow-flight) — fly, collect stars, catch clouds,
   paint rainbows; each milestone makes a wilted tree bloom. No fail state.
2. **מעבדת השיקויים** (potion-math-lab) — drag numbered ingredient bottles into the
   cauldron to hit a target; add/subtract within 20 + ×2,3,4,5,10. Each correct potion
   blooms a tree on the island. Gentle hints, no fail state.
</content>
