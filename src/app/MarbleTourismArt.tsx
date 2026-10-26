/** Original compact travel scenes for the five historical World-map tourism tiles. */
export function MarbleTourismArt({name,className=''}:{name:string;className?:string}) {
  const scene=name==='독도'?'dokdo':name==='하와이'?'hawaii':name==='푸켓'?'phuket':name==='발리'?'bali':'tahiti';
  return <svg className={className} viewBox="0 0 128 80" role="img" aria-label={name}>
    <ellipse cx="64" cy="69" rx="55" ry="7" fill="#173c46" opacity=".18"/>
    <path d="M7 62q14-4 28 0t28 0 28 0 30 0v12H7Z" fill="#8cbfc1"/>
    <path d="M9 66q12-3 24 0t23 0 24 0 22 0 20 0" fill="none" stroke="#ecf3de" strokeWidth="2"/>
    {scene==='dokdo'&&<g stroke="#496573" strokeLinejoin="round"><path d="m25 60 9-27 7 4 9-17 10 7 3 33Z" fill="#748c89" strokeWidth="2"/><path d="m66 61 8-20 9-7 8 6 8 21Z" fill="#698583" strokeWidth="2"/><path d="m31 48 10-12 5 3 7-12m21 24 9-10 7 6" fill="none" stroke="#b8c2a9" strokeWidth="3"/><path d="m101 20 5-4 5 4m-82-6 5-4 5 4" fill="none" stroke="#dceadf" strokeWidth="2"/></g>}
    {scene==='hawaii'&&<g><path d="M12 62q28-20 55-16 26 2 49 16Z" fill="#d2b879"/><path d="m36 51 26-39 31 40Z" fill="#566f67" stroke="#365953" strokeWidth="2"/><path d="m55 21 7-9 7 10-7 2Z" fill="#e6d7bc"/><path d="m99 56-5-23" stroke="#674d37" strokeWidth="4"/><path d="M94 33q-16-12-22-2 16-1 22 6 11-13 23-6-12-1-21 8" fill="#4c9271"/></g>}
    {scene==='phuket'&&<g><path d="M12 59q22-22 45-18 15 3 23 18Z" fill="#86a9a0"/><path d="M52 62h58l-12 7H67Z" fill="#9d6249" stroke="#734d40" strokeWidth="2"/><path d="M81 61V23m1 3 24 27H81Z" fill="#f2dbab" stroke="#856044" strokeWidth="2"/><path d="m99 57 12-9" stroke="#6c4b36" strokeWidth="3"/><path d="M25 30q10-5 18 0" fill="none" stroke="#dae9da" strokeWidth="3"/></g>}
    {scene==='bali'&&<g><path d="M19 61h91l-11 8H30Z" fill="#c59b74"/><path d="M30 61V32l13-15 13 15v29m16 0V32l13-15 13 15v29" fill="#a76e5c" stroke="#754f4d" strokeWidth="2"/><path d="m29 32 14-18 14 18m14 0 14-18 14 18" fill="none" stroke="#5c695e" strokeWidth="3"/><path d="M55 62q8-27 18 0" fill="#e4c694"/><path d="M19 63 16 38m92 25 4-25" stroke="#765b3e" strokeWidth="4"/><path d="M16 37q-9-13-15-4 9 0 15 8 6-14 16-9-11 0-16 9m96-4q-9-13-15-4 9 0 15 8 6-14 16-9-11 0-16 9" fill="#579575"/></g>}
    {scene==='tahiti'&&<g><path d="M13 57q23-26 48-20 24 5 45 20Z" fill="#769f9b"/><path d="M44 60h60v7H44Z" fill="#bd9265"/><path d="M51 60V39h45v21" fill="#e4bb80" stroke="#8d6d4f" strokeWidth="2"/><path d="m45 40 28-20 29 20Z" fill="#826b59" stroke="#695444" strokeWidth="2"/><path d="M58 45h12v15H58Zm19 0h11v15H77Z" fill="#b8d7d0"/><path d="M32 63V31m0 3q-14-13-25-6 13 0 25 10 9-16 22-9-13 0-22 9" stroke="#4e8a6e" strokeWidth="3" fill="#4e8a6e"/></g>}
  </svg>;
}
