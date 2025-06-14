import americareports from '../assets/americareports.webp';
import varney from '../assets/varney.webp';
import thefive from '../assets/thefive.jpeg';
import defaultImage from '../assets/foxnews.webp';
import thestory from '../assets/thestory.webp';
import weather from '../assets/weather.jpeg'
import foxandfriends from '../assets/foxandfriends.jpg'
import primetime from '../assets/primetime.jpeg'
import maria from '../assets/moringswithmaria.jpg'
import faulkner from '../assets/faulkner.jpg'
import bottomline from '../assets/bottomline.webp'
import bigmoney from '../assets/bigmoney.jpg'
import an from '../assets/americasnewsroom.jpg'
import foxnation from '../assets/foxnation.png'
import bigweekend from '../assets/bigweekend.webp'
import hannity from '../assets/hannity.jpeg'




const showImageList = [
  { keyword: 'americareports', image: americareports },
  { keyword: 'varney', image: varney },
  { keyword: 'thefive', image: thefive },
  { keyword: 'weather', image: weather },
  { keyword: 'thestory', image: thestory },
  { keyword: 'foxandfriends', image: foxandfriends },
  { keyword: 'primetime', image: primetime },
  { keyword: 'maria', image: maria },
  { keyword: 'faulkner', image: faulkner },
  { keyword: 'bottomline', image: bottomline },
  { keyword: 'bigmoney', image: bigmoney },
  { keyword: 'americareports', image: americareports },
  { keyword: 'americasnewsroom', image: an },
  { keyword: 'bigweekend', image: bigweekend },
  { keyword: 'foxnation', image: foxnation },
  { keyword: 'hannity', image: hannity },

];

export const getShowImageSrc = (title) => {
  if (!title) return defaultImage;

  const key = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

  const match = showImageList.find(entry =>
    key.includes(entry.keyword)
  );

  return match?.image || defaultImage;
};