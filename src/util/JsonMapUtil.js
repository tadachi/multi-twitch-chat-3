export function mapToJson(map) {
  return JSON.stringify([...map]);
}

export function jsonToMap(jsonStr) {
  return new Map(JSON.parse(jsonStr));
}

export function arrayToJson(array) {
  return JSON.stringify(array)
}

export function jsonToArray(jsonString) {
  return Array.from(JSON.parse(jsonString))
}

export function reactObjToBlob(reactObj) {
  const blob =  new Blob([reactObj], {type: 'text/plain'})
  // return URL.createObjectURL(blob)
  return blob
}