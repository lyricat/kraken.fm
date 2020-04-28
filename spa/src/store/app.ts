export const state = () => ({
  snackbar: {
    show: false,
    message: '',
    color: 'info'
  },
  chat: {
    rooms: {},
  },
  profile: {
    uid: ''
  },
  appbar: {
    title: '',
    style: '',
    show: true,
    back: false,
    dark: true,
    color: '#111'
  }
})

export const mutations = {
  toast(state, { message, color }) {
    state.snackbar.show = true
    state.snackbar.message = message
    state.snackbar.color = color
  },
  setSnackbar(state, val) {
    state.snackbar.show = val
  },
  SET_PROFILE(state, val) {
    state.profile = val
  },
  SET_APPBAR(state, value) {
    const defaultValue = {
      title: '',
      style: '',
      show: true,
      back: true,
      dark: true,
      color: '#111',
    }
    state.appbar = { ...defaultValue, ...value }
  },
  ADD_ROOM(state, { room, nickname }) {
    if (!state.chat.rooms.hasOwnProperty(room)) {
      state.chat.rooms[room] = { room, nickname }
    }
  },
  REMOVE_ROOM(state, { room }) {
    if (state.chat.rooms.hasOwnProperty(room)) {
      const rms = state.chat.rooms
      delete rms[room]
      state.chat.rooms = Object.assign({}, rms)
    }
  },
  SET_NICKNAME(state, { room, nickname }) {
    state.chat.rooms[room] = { room, nickname }
  }
}
