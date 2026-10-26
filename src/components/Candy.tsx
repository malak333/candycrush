import { useId } from 'react';
export interface CandyArtProps { color: number; special?: string; className?: string }
const palettes = [
  ['#ff8da1', '#f63b62', '#b91242'], ['#91eeff', '#32bdf0', '#0872c4'],
  ['#ffd18a', '#ff9b38', '#e35418'], ['#b7f57e', '#6bcd45', '#279c37'],
  ['#e9b7ff', '#ba70ed', '#803bc1'], ['#fff6a0', '#ffdc50', '#efa122'],
] as const;
const shapes = [
  'M21 22C30 9 53 12 57 29C61 46 47 57 31 54C17 52 10 39 16 28C17 26 19 24 21 22Z',
  'M32 10Q36 8 40 11L61 31Q65 35 61 40L41 60Q36 64 31 60L10 40Q6 36 10 31Z',
  'M22 15H48Q60 15 60 28V43Q60 57 47 57H24Q11 57 11 44V29Q11 15 22 15Z',
  'M22 12Q36 17 50 12Q60 11 59 23Q55 36 59 49Q61 61 49 59Q36 55 23 59Q11 61 13 49Q17 36 13 23Q11 11 22 12Z',
  'M36 10C44 10 49 17 47 24C56 20 63 27 61 35C60 42 54 46 47 44C51 53 44 62 36 60C28 62 21 54 25 45C17 48 10 43 10 35C9 27 17 21 25 24C22 17 28 10 36 10Z',
  'M36 9C40 16 59 32 59 43C59 57 48 63 36 63C23 63 13 56 13 43C13 32 31 17 36 9Z',
];
export function CandyArt({ color, special = 'none', className }: CandyArtProps) {
  const uid = useId().replace(/:/g, '');
  const index = Number.isInteger(color) && color >= 0 && color < 6 ? color : 0;
  const [light, mid, dark] = palettes[index], shape = shapes[index];
  const isBomb = special === 'color-bomb';
  const horizontal = special === 'striped-h', vertical = special === 'striped-v', wrapped = special === 'wrapped';
  const bodyId = `body-${uid}`, glossId = `gloss-${uid}`, clipId = `clip-${uid}`;
  return <svg className={className} viewBox="0 0 72 72" fill="none" aria-hidden="true" focusable="false"><defs>
    <linearGradient id={bodyId} x1="22" y1="12" x2="49" y2="62" gradientUnits="userSpaceOnUse"><stop stopColor={isBomb ? '#a96645' : light}/><stop offset="0.42" stopColor={isBomb ? '#65351f' : mid}/><stop offset="1" stopColor={isBomb ? '#341b22' : dark}/></linearGradient>
    <linearGradient id={glossId} x1="23" y1="13" x2="40" y2="41" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity="0.85"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
    <clipPath id={clipId}><path d={shape}/></clipPath></defs>
    <ellipse cx="36" cy="62" rx="22" ry="5" fill="#57265f" opacity="0.19"/>
    {isBomb ? <><path d="M36 9C51 9 62 21 62 36C62 52 51 63 36 63C21 63 10 52 10 36C10 21 21 9 36 9Z" fill={`url(#${bodyId})`} stroke="#40202a" strokeWidth="2"/><path d="M18 29C20 18 30 13 39 15C47 16 50 19 49 23C48 29 30 24 23 34C20 38 16 35 18 29Z" fill={`url(#${glossId})`}/>
    {[[23,23,'#ffb1ce',-25],[39,19,'#fff276',30],[51,29,'#86efff',-30],[18,38,'#ffb75d',20],[31,34,'#90e88f',-25],[44,39,'#e0a3ff',35],[28,49,'#8ddfff',30],[40,54,'#ff81a9',-25],[53,47,'#ffe375',20]].map(([x,y,fill,angle],i) => <rect key={i} x={Number(x)-1.7} y={Number(y)-4} width="3.4" height="8" rx="1.7" fill={String(fill)} transform={`rotate(${angle} ${x} ${y})`}/>)}<circle cx="21" cy="29" r="2" fill="white" opacity="0.75"/></> : <>
    <path d={shape} fill={`url(#${bodyId})`} stroke={dark} strokeWidth="1.5"/><g clipPath={`url(#${clipId})`}><path d="M10 24Q37 3 64 25L56 34Q35 20 15 36Z" fill={`url(#${glossId})`}/><path d="M14 49Q36 64 59 44" stroke="white" strokeWidth="2" strokeOpacity="0.28" strokeLinecap="round"/>
    {(horizontal || vertical) && <g transform={vertical ? 'rotate(90 36 36)' : undefined}><path d="M7 25H65M7 37H65M7 49H65" stroke="white" strokeWidth="6" strokeOpacity="0.85"/><path d="M7 29H65M7 41H65M7 53H65" stroke={dark} strokeWidth="1" strokeOpacity="0.2"/></g>}
    {wrapped && <><path d="M12 28L60 48M12 48L60 28" stroke={dark} strokeWidth="11" strokeOpacity="0.25"/><path d="M12 26L60 46M12 46L60 26" stroke="white" strokeWidth="7" strokeOpacity="0.8"/><path d="M12 26L60 46M12 46L60 26" stroke={light} strokeWidth="2"/></>}</g>
    <path d={index===1 ? 'M21 29L31 19' : 'M22 26Q26 20 33 20'} stroke="white" strokeWidth="4.4" strokeOpacity="0.78" strokeLinecap="round"/><circle cx="19" cy="34" r="1.6" fill="white" opacity="0.55"/>{wrapped && <path d="M36 29L42 36L36 43L30 36Z" fill="white" fillOpacity="0.9" stroke={light} strokeWidth="2"/>}</>}
  </svg>;
}
