import _ from 'lodash';
import axios from 'axios';
import cheerio from 'cheerio';

import windDirections from '../constants/windDirections';

const UNITS = {
  length: 'km',
  speed: 'km/h',
  temperature: '°C',
  rainfall: 'mm',
};

// whole text patterns
const TEMPERATURE_PATTERN = `((?:\\+|-)?\\d+)\\.?\\.?((?:\\+|-)?\\d+)? ${UNITS.temperature}`;
const WIND_PATTERN = `(\\W) (\\d+)-?(\\d+)? ${UNITS.speed}`;
const WTF_PATTERN = ` (\\d+) ${UNITS.length} `;
const RAINFALL_PATTERN = `(\\d+\\.\\d+) ${UNITS.rainfall}`;
const RAINFALL_PROBABILITY_PATTERN = `(\\d+)%`;
const DESCRIPTION_PATTERN = '(Clear|Sunny|Partly cloudy|Cloudy|Overcast|Mist|Patchy rain po|Patchy snow po|Patchy sleet p|Patchy freezin|Thundery outbr|Blowing snow|Blizzard|Fog|Freezing fog|Patchy light d|Light drizzle|Freezing drizz|Heavy freezing|Patchy light r|Light rain|Moderate rain |Moderate rain|Heavy rain at |Heavy rain|Light freezing|Moderate or he|Light sleet|Patchy light s|Light snow|Patchy moderat|Moderate snow|Patchy heavy s|Heavy snow|Ice pellets|Light rain sho|Torrential rai|Light sleet sh|Light snow sho)';

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

const getWindDirection = windDirectionIcon => windDirections[windDirectionIcon];

const wttrService = () => {

  const wttrInstance = {
    parse: html => {
      const $ = cheerio.load(html);
      const text = $('body > pre').text();
      const execRegex = execRegexOnText(text);

      const mappedData = {};

      setValues(mappedData, () => execRegex(TEMPERATURE_PATTERN), { temperatureLow: 1, temperatureHigh: 2 });
      setValues(mappedData, () => execRegex(WIND_PATTERN), { windDirectionIcon: 1, windDirection: values => getWindDirection(values[1]), windLow: 2, windHigh: 3 });
      setValues(mappedData, () => execRegex(WTF_PATTERN), { wtf: 1 });
      setValues(mappedData, () => execRegex(RAINFALL_PATTERN), { rainfall: 1 });
      setValues(mappedData, () => execRegex(RAINFALL_PROBABILITY_PATTERN), { rainfallProbability: 1 });
      setValues(mappedData, () => execRegex(DESCRIPTION_PATTERN), { description: 1 });

      // console.log('MappedData', JSON.stringify(mappedData, null, 2));

      return mappedData;
    },
    getWeather: (city = 'Warszawa') => {
      return axios({
        method: 'get',
        url: `https://wttr.in/${city}`,
        params: {
          lang: 'en',
        },
      })
        .then(({ data }) => wttrInstance.parse(data));
    },
  };

  return wttrInstance;
};

export default wttrService;
