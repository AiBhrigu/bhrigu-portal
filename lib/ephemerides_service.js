export function computeEphemeris(dateInput) {

  const utc = new Date(`${dateInput}T00:00:00Z`)

  const day = utc.getTime() / 86400000

  const sun =
    (day * 0.985647) % 360

  const moon =
    (day * 13.176358) % 360

  const density =
    Math.abs(Math.sin(day * 0.017))

  const eclipse =
    Math.abs(Math.cos(day * 0.011))

  return {
    sun_longitude: sun,
    moon_longitude: moon,
    planetary_density: density,
    eclipse_distance: eclipse
  }

}
