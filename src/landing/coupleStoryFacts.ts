export const STORY_START_DATE = '2025-04-04';

// Approximate straight-line distance between the confirmed city-centre reference points, not GPS locations.
// Gwangju: https://en.wikipedia.org/wiki/Gwangju ; Santo Domingo: https://en.wikipedia.org/wiki/Santo_Domingo
const cityCoordinates = {gwangju:[35.1595,126.8526],santoDomingo:[18.4861,-69.9312]} as const;
const earthRadiusKm = 6371;
const radians = (degrees:number) => degrees * Math.PI / 180;
const [gwangjuLat,gwangjuLon]=cityCoordinates.gwangju.map(radians);
const [santoLat,santoLon]=cityCoordinates.santoDomingo.map(radians);
const haversine=Math.sin((santoLat-gwangjuLat)/2)**2+Math.cos(gwangjuLat)*Math.cos(santoLat)*Math.sin((santoLon-gwangjuLon)/2)**2;
export const storyDistanceKm=2*earthRadiusKm*Math.asin(Math.sqrt(haversine));

type ZonedTime={year:number;month:number;day:number;hour:number;minute:number};
type TimeZone='Asia/Seoul'|'America/Santo_Domingo';

function zonedTime(now:Date,timeZone:TimeZone):ZonedTime {
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(now).map(part=>[part.type,part.value]));
 return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day),hour:Number(parts.hour),minute:Number(parts.minute)};
}

export function storyClockTimes(now:Date) {
 return {seoul:zonedTime(now,'Asia/Seoul'),santoDomingo:zonedTime(now,'America/Santo_Domingo')};
}

export function previewPlayHour(koreanHour:number) {
 const koHour=Number.isFinite(koreanHour)?Math.max(0,Math.min(23,Math.trunc(koreanHour))):0;
 const santoDomingoHour=koHour-13;
 return {koHour,drHour:(santoDomingoHour+24)%24,drDayOffset:santoDomingoHour<0?-1:0};
}

export function relationshipDays(now:Date) {
 const {year,month,day}=zonedTime(now,'Asia/Seoul');
 const [startYear,startMonth,startDay]=STORY_START_DATE.split('-').map(Number);
 return Math.max(0,(Date.UTC(year,month-1,day)-Date.UTC(startYear,startMonth-1,startDay))/86_400_000);
}
