import { ToolCallResult, ToolDefinition } from "../../types";

export interface WeatherPluginInput {
  location: string;
}

export class WeatherPlugin {
  private static readonly NAME = "weather_tool";

  static getName() {
    return this.NAME;
  }

  static getToolDetails(): ToolDefinition {
    return {
      type: "function",
      function: {
        name: "weather_tool",
        description: "Get current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "Location to get weather for",
            },
          },
          required: ["location"],
        },
      },
    };
  }

  static async execute(input: WeatherPluginInput): Promise<
    ToolCallResult<
      { location: string },
      {
        temperature: number;
        description: string;
        humidity?: number;
        windSpeed?: number;
      }
    >
  > {
    console.log("execute weather plugin -> ", input);

    const { location } = input;

    try {
      // Use Open-Meteo API (free weather service)
      const weatherData = await this.fetchWeatherData(location);

      return {
        tool_name: this.NAME,
        success: true,
        data: {
          input,
          output: {
            temperature: weatherData.temperature,
            description: weatherData.description,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
          },
        },
      };
    } catch (error: any) {
      console.error(`Weather plugin error for ${location}:`, error);

      return {
        tool_name: this.NAME,
        success: false,
        error: "Weather data unavailable",
        data: {
          input,
        },
      };
    }
  }

  private static async fetchWeatherData(location: string): Promise<{
    temperature: number;
    description: string;
    humidity?: number;
    windSpeed?: number;
  }> {
    try {
      // First, geocode the location to get coordinates
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          location
        )}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location not found: ${location}`);
      }

      const { latitude, longitude } = geoData.results[0];

      // Get current weather data
      const weatherUrl =
        process.env.WEATHER_API_URL || "https://api.open-meteo.com/v1/forecast";
      const weatherResponse = await fetch(
        `${weatherUrl}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,wind_speed_10m&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error(`Weather API failed: ${weatherResponse.statusText}`);
      }

      const weatherData = await weatherResponse.json();
      const current = weatherData.current_weather;

      // Map weather codes to descriptions
      const description = this.getWeatherDescription(current.weathercode);

      return {
        temperature: Math.round(current.temperature),
        description,
        humidity: weatherData.hourly?.relative_humidity_2m?.[0],
        windSpeed: Math.round(current.windspeed * 10) / 10,
      };
    } catch (error: any) {
      console.error("Weather API error:", error);
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  private static getWeatherDescription(weatherCode: number): string {
    // Open-Meteo weather code mappings
    const weatherCodes: Record<number, string> = {
      0: "clear sky",
      1: "mainly clear",
      2: "partly cloudy",
      3: "overcast",
      45: "fog",
      48: "depositing rime fog",
      51: "light drizzle",
      53: "moderate drizzle",
      55: "dense drizzle",
      61: "slight rain",
      63: "moderate rain",
      65: "heavy rain",
      71: "slight snow fall",
      73: "moderate snow fall",
      75: "heavy snow fall",
      80: "slight rain showers",
      81: "moderate rain showers",
      82: "violent rain showers",
      95: "thunderstorm",
      96: "thunderstorm with slight hail",
      99: "thunderstorm with heavy hail",
    };

    return weatherCodes[weatherCode] || "unknown conditions";
  }
}
