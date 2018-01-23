export function mapToJson(map) {
  return JSON.stringify([...map]);
}

export function jsonToMap(jsonStr) {
  return new Map(JSON.parse(jsonStr));
}