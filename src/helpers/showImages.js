// Show thumbnails
import americareports from '../assets/americareports.webp';
import varney from '../assets/varney.webp';
import thefive from '../assets/thefive.jpeg';
import defaultImage from '../assets/foxnews.webp';
import thestory from '../assets/thestory.webp';
import weather from '../assets/weather.jpeg';
import foxandfriends from '../assets/foxandfriends.jpg';
import primetime from '../assets/primetime.jpeg';
import maria from '../assets/moringswithmaria.jpg';
import faulkner from '../assets/faulkner.jpg';
import bottomline from '../assets/bottomline.webp';
import bigmoney from '../assets/bigmoney.jpg';
import an from '../assets/americasnewsroom.jpg';
import foxnation from '../assets/foxnation.png';
import bigweekend from '../assets/bigweekend.webp';
import hannity from '../assets/hannity.jpeg';
import outnumbered from '../assets/outnumbered.jpeg'
import weathercenter from '../assets/weathercenter.jpg'
import makingmoney from '../assets/making money.jpg'
import kudlow from '../assets/kudlow.webp'
import willcain from '../assets/willcain.jpg'

// Brand icons
import businessIcon from '../assets/business.png';
import newsIcon from '../assets/foxnews.webp';
import nationIcon from  '../assets/foxnation.png';
import weatherIcon from'../assets/weather.jpeg';




const showImageList = [
  { keyword: 'americareports', image: americareports, type: 'news' },
  { keyword: 'varney', image: varney, type: 'business' },
  { keyword: 'thefive', image: thefive, type: 'news' },
  { keyword: 'americasweathercenter', image: weathercenter, type: 'weather' }, // ✅ includes "s"
  { keyword: 'weathernow', image: weathercenter, type: 'weather' },
  { keyword: 'weather', image: weather, type: 'weather' },
  { keyword: 'thestory', image: thestory, type: 'news' },
  { keyword: 'foxfriends', image: foxandfriends, type: 'news' },
  { keyword: 'foxfriendsweekend', image: foxandfriends, type: 'news' },
  { keyword: 'primetime', image: primetime, type: 'news' },
  { keyword: 'maria', image: maria, type: 'business' },
  { keyword: 'faulkner', image: faulkner, type: 'news' },
  { keyword: 'bottomline', image: bottomline, type: 'business' },
  { keyword: 'bigmoney', image: bigmoney, type: 'business' },
  { keyword: 'americasnewsroom', image: an, type: 'news' },
  { keyword: 'bigweekend', image: bigweekend, type: 'news' },
  { keyword: 'foxnation', image: foxnation, type: 'nation' },
  { keyword: 'hannity', image: hannity, type: 'news' },
  { keyword: 'outnumbered', image: outnumbered, type: 'news' },
  { keyword: 'kudlow', image: kudlow, type: 'news' },
  { keyword: 'willcain', image: willcain, type: 'news' },
  
  { keyword: 'makingmoney', image: makingmoney, type: 'business' },
];

// helpers/showImages.js

export const getShowMeta = (title) => {
  if (!title) {
    return { image: defaultImage, type: 'news' };
  }

  const key = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

    console.log("Normalized key:", key);

  const match = showImageList.find(entry =>
    key.includes(entry.keyword)
  );

  return {
    image: match?.image || defaultImage,
    type: match?.type || 'news'
  };
};