export function WeaponGlyph({ id }: { id: string }) {
  const paths: Record<string, string> = {
    haruki: 'M15 44 32 8 35 6 35 10 19 45M13 38l9 4M12 49l5-9M15 24l9 4',
    setsuna: 'M14 47 30 12Q36 2 38 5L20 44M13 38l12 5M11 50l5-10',
    lara: 'M14 47 29 16 27 12 37 4 35 17 20 45M12 38l13 6M12 50l6-10',
    iwao: 'M12 43 28 8 39 11 23 46ZM10 40l16 7M12 50l5-7M30 14l-9 23',
    tsumugi: 'M23 47V8M20 8h6M13 20l20 13M33 20 13 33M13 20l10-8 10 8-10 21ZM19 47h8',
    raizo: 'M13 48 24 29 18 29 33 6 29 22 36 20 23 38 22 33ZM11 43l8 5',
    mizuki: 'M24 8C6 22 12 39 24 41c13-2 18-18 0-33ZM24 18c-8 12-5 17 1 17M24 41v9M18 50h12',
    ranmaru: 'M16 48 29 15 34 17 21 50M29 15 25 12 31 4 37 7 36 16M22 24l9 3M18 34l9 3',
    kyoya: 'M14 47V23Q14 6 30 8l9 10-17-3M14 34q20 12 16-2t5-8M10 47h8',
  }
  return <svg className="weapon-glyph" viewBox="0 0 48 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id] ?? paths.haruki} /></svg>
}
