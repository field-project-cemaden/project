// functions
function distance(lat1: number, lat2: number, lon1: number, lon2: number) {
  /*
    Code copied from https://www.geeksforgeeks.org/program-distance-two-points-earth/
    */
  lon1 = (lon1 * Math.PI) / 180;
  lon2 = (lon2 * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  let dLon = lon2 - lon1;
  let dLat = lat2 - lat1;

  let a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dLon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  let r = 6371;

  return c * r;
}

export function invDist(
  lat1: number,
  long1: number,
  data: Array<[number, number, number]>,
) {
  /*
    Returns the prediction for a new point
    using the known data.

    >> lat1: latitude of the prediction point;
    >> long1: longitude of the prediction point;
    >> data: array containing all known data points, each
    row of the array is composed by 3 entries: latitude,
    longitude and measured value of the data point.
    */
  let ponderedSum = 0;
  let invDistSum = 0;

  for (const [lat2, long2, value] of data) {
    // ou of
    if (lat1 == lat2 && long1 == long2) {
      return value;
    }
    const dist = distance(lat1, lat2, long1, long2);
    ponderedSum += (value * 1) / dist;
    invDistSum += 1 / dist;
  }

  return ponderedSum / invDistSum;
}
