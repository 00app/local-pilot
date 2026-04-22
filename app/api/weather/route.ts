import { NextRequest, NextResponse } from "next/server"

type EnvironmentMode = "rain" | "sun" | "commuter"

interface WeatherPayload {
  postcode: string
  condition: string
  tempC: number
  mode: EnvironmentMode
  isLive: boolean
}

function modeFromCondition(condition: string): EnvironmentMode {
  const lower = condition.toLowerCase()
  if (
    lower.includes("rain") ||
    lower.includes("drizzle") ||
    lower.includes("shower") ||
    lower.includes("thunder")
  ) {
    return "rain"
  }
  return "sun"
}

function mockWeather(postcode: string): WeatherPayload {
  return {
    postcode,
    condition: "Light rain",
    tempC: 14,
    mode: "rain",
    isLive: false,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const postcode = String(body?.postcode || "BN1 4EN")
    const apiKey = process.env.WEATHERAPI_API_KEY
    if (!apiKey) return NextResponse.json(mockWeather(postcode))

    const params = new URLSearchParams({
      key: apiKey,
      q: postcode,
      aqi: "no",
    })
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?${params}`)
    if (!res.ok) {
      console.error("[weather] WeatherAPI error:", res.status)
      return NextResponse.json(mockWeather(postcode))
    }

    const data = await res.json()
    const condition = String(data?.current?.condition?.text || "Clear")
    const tempC = Number(data?.current?.temp_c ?? 0)
    const payload: WeatherPayload = {
      postcode,
      condition,
      tempC,
      mode: modeFromCondition(condition),
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[weather] fetch failed:", err)
    return NextResponse.json(mockWeather("BN1 4EN"))
  }
}
