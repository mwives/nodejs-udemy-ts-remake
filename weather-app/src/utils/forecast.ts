import axios from "axios";

async function forecast(lat: number, long: number, scale = "c") {
  let units;

  if (scale === "f") {
    units = "imperial";
  } else if (scale === "c") {
    units = "metric";
  } else {
    throw new Error("Invalid units of measurement provided");
  }

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=hourly,minutely&units=${units}&appid=${process.env.FORECAST_API_KEY}`;
  let response = await axios.get(url);

  const timezone = response.data.timezone_offset;

  response.data.daily.forEach((dailyForecast: any) => {
    const date = new Date(dailyForecast.dt * 1000).toISOString().split("T")[0];
    const sunrise = new Date((dailyForecast.sunrise + timezone) * 1000)
      .toISOString()
      .substring(11, 16);
    const sunset = new Date((dailyForecast.sunset + timezone) * 1000)
      .toISOString()
      .substring(11, 16);

    dailyForecast.dt = date;
    dailyForecast.sunrise = sunrise;
    dailyForecast.sunset = sunset;
    dailyForecast.weather = dailyForecast.weather[0].main;

    delete dailyForecast.moonrise;
    delete dailyForecast.moonset;
    delete dailyForecast.moon_phase;
    delete dailyForecast.temp.day;
    delete dailyForecast.temp.night;
    delete dailyForecast.temp.eve;
    delete dailyForecast.temp.morn;
    delete dailyForecast.feels_like;
    delete dailyForecast.pressure;
    delete dailyForecast.dew_point;
    delete dailyForecast.wind_deg;
    delete dailyForecast.wind_gust;
    delete dailyForecast.clouds;
    delete dailyForecast.pop;
    delete dailyForecast.uvi;
  });

  return response.data.daily;
}

export { forecast };
