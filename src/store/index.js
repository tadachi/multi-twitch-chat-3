import { combineReducers, createStore } from 'redux'
import channelReducer from '../reducers/channelReducer'
import {mapToJson, jsonToMap} from '../util/JsonMapUtil'
import {LOCAL_STORAGE, CHANNELS} from '../util/localStorageWrapper'

const reducers = combineReducers({
  channelsReducer: channelReducer,
})

const store = createStore(
  reducers,
  // Disable this in production
  // window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

store.subscribe(() => {
  const channels = store.getState().channelsReducer.channels
  // console.log(jsonToMap(LOCAL_STORAGE.getItem(CHANNELS)))
  // console.log(channels)
  // for (let [k,v] of channels.entries()) {
  //   console.log(`    ${k} ${v.joined} ${v.color}`)
  // }
})

export default store
