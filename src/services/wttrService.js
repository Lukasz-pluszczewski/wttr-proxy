import _ from 'lodash';
import axios from 'axios';
import cheerio from 'cheerio';

import NotFound from '../errors/NotFound';
import WttrError from '../errors/WttrError';

const DESCRIPTIONS = {
  'Moderate or h': 'heavyRain',
  Clear: 'sun',
  Sunny: 'sun',
  'Partly cloudy': 'sunny',
  Cloudy: 'cloudy',
  Overcast: 'cloudy',
  Mist: 'cloud',
  'Patchy rain po': 'rain',
  'Patchy snow po': 'snow',
  'Patchy sleet p': 'snow',
  'Patchy freezin': 'rain',
  'Thundery outbr': 'thunder',
  'Blowing snow': 'snow',
  Blizzard: 'snow',
  Fog: 'cloud',
  'Freezing fog': 'cloud',
  'Patchy light d': 'rain',
  'Light drizzle': 'rain',
  'Freezing drizz': 'rain',
  'Heavy freezing': 'heavyRain',
  'Patchy light r': 'rain',
  'Light rain': 'Light rain',
  'Moderate rain ': 'rain',
  'Moderate rain': 'Moderate rain',
  'Heavy rain at ': 'heavyRain',
  'Heavy rain': 'heavyRain',
  'Light freezing': 'rain',
  'Moderate or he': 'heavyRain',
  'Light sleet': 'rain',
  'Patchy light s': 'snow',
  'Light snow': 'snow',
  'Patchy moderat': 'Patchy moderate snow',
  'Moderate snow': 'snow',
  'Patchy heavy s': 'snow',
  'Heavy snow': 'snow',
  'Ice pellets': 'snow',
  'Light rain sho': 'rain',
  'Torrential rai': 'heavyRain',
  'Light sleet sh': 'rain',
  'Light snow sho': 'snow',
};

const WIND_DIRECTIONS = {
  '↓': 'S',
  '↙': 'SW',
  '←': 'W',
  '↖': 'NW',
  '↑': 'N',
  '↗': 'NE',
  '→': 'E',
  '↘': 'SE',
};

const UNITS = {
  visibility: 'km',
  speed: 'km/h',
  temperature: '°C',
  rainfall: 'mm',
};

const TEMPERATURE_PATTERN = `((?:\\+|-)?\\d+)\\.?\\.?((?:\\+|-)?\\d+)? ${UNITS.temperature}`;
const WIND_PATTERN = `(\\W) (\\d+)-?(\\d+)? ${UNITS.speed}`;
const VISIBILITY_PATTERN = ` (\\d+) ${UNITS.visibility} `;
const RAINFALL_PATTERN = `(\\d+\\.\\d+) ${UNITS.rainfall}`;
const RAINFALL_PROBABILITY_PATTERN = `(\\d+)%`;
const DESCRIPTION_PATTERN = '(Clear|Sunny|Partly cloudy|Cloudy|Overcast|Mist|Patchy rain po|Patchy snow po|Patchy sleet p|Patchy freezin|Thundery outbr|Blowing snow|Blizzard|Fog|Freezing fog|Patchy light d|Light drizzle|Freezing drizz|Heavy freezing|Patchy light r|Light rain|Moderate rain |Moderate rain|Heavy rain at |Heavy rain|Light freezing|Moderate or he|Light sleet|Patchy light s|Light snow|Patchy moderat|Moderate snow|Patchy heavy s|Heavy snow|Ice pellets|Light rain sho|Torrential rai|Light sleet sh|Light snow sho)';
const LOCATION_PATTERN = 'Weather report: (.+)';

const mergeValue = (target, path, values) => {
  _.set(target, path, { ..._.get(target, path), ...values });
  return target;
};

const execRegexOnText = text => pattern => {
  const regex = new RegExp(pattern, 'g');
  let patternResults;
  const results = [];
  while (patternResults = regex.exec(text)) {
    results.push(patternResults);
  }
  return results;
};

const setValues = (target, getValues, indexMapping, includeNow = true) => {
  const values = getValues();

  values.forEach((value, index) => {
    if (includeNow && !index) {
      return mergeValue(target, 'now', _.mapValues(indexMapping, valuesIndex => {
        if (typeof valuesIndex === 'number') {
          return value[valuesIndex];
        }
        return valuesIndex(value);
      }));
    }
    const offsetIndex = includeNow ? index - 1 : index;

    const day = Math.floor(offsetIndex / 4);
    const timeOfDay = offsetIndex % 4;

    mergeValue(target, `forecast[${day}][${timeOfDay}]`, _.mapValues(indexMapping, valuesIndex => {
      if (typeof valuesIndex === 'number') {
        return value[valuesIndex];
      }
      return valuesIndex(value);
    }));
  });

  return target;
};

const getWindDirection = windDirectionIcon => WIND_DIRECTIONS[windDirectionIcon];

const getDescription = description => {
  if (DESCRIPTIONS[description]) {
    return DESCRIPTIONS[description];
  }

  const found = _.find(DESCRIPTIONS, (value, key) => {
    return ~description.indexOf(key);
  });

  return found || '';
};

const wttrService = () => {
  const wttrInstance = {
    parse: async(html, city) => {
      const $ = cheerio.load(html);

      const text = $('body > pre').text();
      const execRegex = execRegexOnText(text);

      const mappedData = {};

      const [match, locationInterpretedAs] = execRegex(LOCATION_PATTERN);
      if (!match) {
        throw new NotFound(`Location ${city} not found`);
      }
      mappedData.locationInterpretedAs = locationInterpretedAs;

      setValues(mappedData, () => execRegex(TEMPERATURE_PATTERN), { temperatureLow: 1, temperatureHigh: 2 });
      setValues(mappedData, () => execRegex(WIND_PATTERN), { windDirectionIcon: 1, windDirection: values => getWindDirection(values[1]), windLow: 2, windHigh: 3 });
      setValues(mappedData, () => execRegex(VISIBILITY_PATTERN), { visibility: 1 });
      setValues(mappedData, () => execRegex(RAINFALL_PATTERN), { rainfall: 1 });
      setValues(mappedData, () => execRegex(RAINFALL_PROBABILITY_PATTERN), { rainfallProbability: 1 });
      setValues(mappedData, () => execRegex(DESCRIPTION_PATTERN), { description: 1 });
      setValues(mappedData, () => execRegex(DESCRIPTION_PATTERN), { descriptionNormalized: values => getDescription(values[1]) });

      return mappedData;
    },
    getWeather: (city = 'London') => {
      return axios({
        method: 'get',
        url: `https://wttr.in/${city}`,
        params: {
          lang: 'en',
        },
      })
        .catch(error => {
          throw new WttrError('Request to wttr.in failed', error);
        })
        .then(({ data }) => wttrInstance.parse(data, city));
    },
  };

  return wttrInstance;
};

export default wttrService;
