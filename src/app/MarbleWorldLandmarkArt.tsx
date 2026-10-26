import type { CSSProperties } from 'react';

/** Original silhouette dioramas for historical World cities without a bundled city image. */
export function MarbleWorldLandmarkArt({city,color,className=''}:{city:string;color:string;className?:string}) {
  return <svg className={className} viewBox="0 0 128 128" style={{'--city-accent':color} as CSSProperties} data-building-level="4" role="img" aria-label={`${city} landmark illustration`}>
    <ellipse cx="64" cy="113" rx="51" ry="8" fill="#143e45" opacity=".18"/>
    <path d="m10 97 53-18 55 18-55 20Z" fill="#d6c9a5" stroke="#71857c" strokeWidth="2"/>
    <path d="m16 97 47-15 49 15-49 16Z" fill="#92b7a0" opacity=".7"/>
    {city==='bangkok'&&<g fill="var(--city-accent)" stroke="#604f47" strokeWidth="2"><path d="M27 88h74v13H27Z" fill="#ead7aa"/><path d="M34 53h60l7 36H27Z" fill="#f1ddad"/><path d="m27 52 37-29 37 29-37-8Z"/><path d="m47 22 17-13 17 13-17-4Z"/><path d="M60 7h8v15h-8Z"/><path d="M42 63h8v25h-8Zm19-3h8v28h-8Zm20 3h8v25h-8Z" fill="#89b3b0"/></g>}
    {city==='beijing'&&<g stroke="#654946" strokeWidth="2"><path d="M23 87h82v14H23Z" fill="#d0b274"/><path d="M32 58h64v29H32Z" fill="#bf7461"/><path d="m21 57 43-18 43 18-43-7Z" fill="#566d67"/><path d="M42 36h44v16H42Z" fill="#c78463"/><path d="m34 35 30-16 30 16-30-6Z" fill="#5f7770"/><path d="M58 70h12v18H58Z" fill="#755750"/><path d="M39 67h10v10H39Zm40 0h10v10H79Z" fill="#ecd7a8"/></g>}
    {city==='taipei'&&<g stroke="#557178" strokeWidth="2"><path d="M53 91h22v12H53Z" fill="#9dbab0"/><path d="m55 31 9-9 9 9 7 59H48Z" fill="#82aaa9"/><path d="M64 5v18m-15 22h30m-29 12h28m-27 12h26m-24 13h22" stroke="#e4d8a7" strokeWidth="4"/><path d="m49 42 15-9 15 9m-29 13 14-8 14 8m-26 13 12-7 12 7" fill="none" stroke="#456a71"/></g>}
    {city==='dubai'&&<g stroke="#52717a" strokeWidth="2"><path d="M54 99 62 23l4-16 4 16 8 76Z" fill="#85abb8"/><path d="m60 39 8 0m-10 12h12m-14 13h16m-18 13h20m-23 12h26" stroke="#e6e8d5" strokeWidth="3"/><path d="M25 99V67l11-12 11 12v32Zm57 0V76l11-9 11 9v23Z" fill="#b2c4ba"/><path d="M35 56V39m58 29V52" stroke="#637d82"/></g>}
    {city==='cairo'&&<g stroke="#8c7754" strokeWidth="2"><path d="m16 96 29-53 29 53Z" fill="#d7b475"/><path d="m39 96 28-67 37 67Z" fill="#edcf90"/><path d="m67 29 9 18H58Z" fill="#f8e7b6"/><path d="m26 77 19-34 13 34m-7-11 16-37 23 50" fill="none" stroke="#af9466"/><path d="M15 102h98" stroke="#a28d69" strokeWidth="4"/></g>}
    {city==='quebec'&&<g stroke="#697277" strokeWidth="2"><path d="M27 101V61h74v40Z" fill="#c9c6ae"/><path d="m22 61 42-27 43 27Z" fill="#779293"/><path d="M48 35V21h31v14" fill="#d0c7a9"/><path d="m43 21 21-15 21 15Z" fill="#6b8b8d"/><path d="M60 73h12v28H60Z" fill="#8bb7bd"/><path d="M36 72h10v13H36Zm47 0h10v13H83Z" fill="#83afb6"/></g>}
    {city==='sao-paulo'&&<g stroke="#5e7375" strokeWidth="2"><path d="M20 101V52h23v49Zm25 0V31h28v70Zm30 0V58h30v43Z" fill="#9cb2ab"/><path d="M51 23h16v9H51Z" fill="#bcc4ac"/><path d="M27 65h8m-8 12h8m-8 12h8m26-45h7m-7 14h7m-7 14h7m-7 14h7m18-16h8m-8 13h8" stroke="#ecdfb5" strokeWidth="4"/><path d="M17 101h93" stroke="#688d82" strokeWidth="4"/></g>}
    {city==='prague'&&<g stroke="#6c6259" strokeWidth="2"><path d="M26 101V59h76v42Z" fill="#d3c6a7"/><path d="m23 59 41-22 41 22Z" fill="#b36d59"/><path d="M54 38V19h20v19" fill="#c2b89b"/><path d="m50 19 14-14 14 14Z" fill="#556d70"/><circle cx="64" cy="31" r="7" fill="#f3e4bc"/><path d="m64 31 3-4m-3 4-4 1" stroke="#674d42"/><path d="M36 71h10v16H36Zm46 0h10v16H82Z" fill="#8ba8a6"/></g>}
    {city==='moscow'&&<g stroke="#695a57" strokeWidth="2"><path d="M25 101V59h78v42Z" fill="#d0b3a1"/><path d="M35 62V34h16v28m26 0V34h16v28" fill="#e3c5a7"/><path d="M32 35q11-20 22 0-11 7-22 0Zm42 0q11-20 22 0-11 7-22 0Z" fill="#8caa9a"/><path d="M59 101V25h12v76" fill="#e2c9ab"/><path d="M57 25q7-19 16 0-8 6-16 0Z" fill="#be8470"/><path d="M64 7v10m-4-5h8" stroke="#e8cb82"/><path d="M40 69h9v13h-9Zm40 0h9v13h-9Z" fill="#8baaaa"/></g>}
    {city==='geneva'&&<g stroke="#668f93" strokeWidth="2"><path d="M20 97h89v7H20Z" fill="#b2b9a3"/><path d="M42 85V62h44v23Z" fill="#d6c6a6"/><path d="m38 62 26-15 26 15Z" fill="#718f90"/><path d="M54 70h8v13h-8Zm16 0h8v13h-8Z" fill="#87adb1"/><path d="M63 44q-10-14 1-35 11 21 1 35" fill="#bfdbd2" stroke="#d9ede2" strokeWidth="3"/><path d="M19 103q20-9 40 0m15 0q16-8 33 0" fill="none" stroke="#78b7bd" strokeWidth="4"/></g>}
  </svg>;
}

export function MarbleWorldHotelArt({color,className=''}:{color:string;className?:string}) {
  return <svg className={className} viewBox="0 0 128 128" style={{'--city-accent':color} as CSSProperties} data-building-level="3" role="img" aria-label="Hotel illustration">
    <ellipse cx="64" cy="113" rx="50" ry="8" fill="#173c46" opacity=".18"/>
    <path d="m15 100 48-14 50 14-50 16Z" fill="#86a89c"/><path d="M31 94V38h66v56Z" fill="#e7d7b8" stroke="#607b76" strokeWidth="3"/>
    <path d="M39 34V24h50v10m-54 1h58" fill="var(--city-accent)" stroke="#686c62" strokeWidth="3"/>
    <path d="m44 48h10v10H44Zm19 0h10v10H63Zm19 0h10v10H82ZM44 66h10v10H44Zm19 0h10v10H63Zm19 0h10v10H82Z" fill="#8ebfc2" stroke="#618087" strokeWidth="1.5"/>
    <path d="M57 93V80h15v13" fill="#9f795d" stroke="#6b665a" strokeWidth="2"/><path d="M39 17h50v7H39Z" fill="var(--city-accent)" stroke="#6a746c" strokeWidth="2"/>
    <path d="M24 101V73m79 28V73" stroke="#695943" strokeWidth="3"/><path d="M24 75q-11-15-19-5 11 0 19 9 7-15 17-9-12 0-17 9m79-4q-11-15-19-5 11 0 19 9 7-15 17-9-12 0-17 9" fill="#6eaa86"/>
  </svg>;
}
