<template>
  <normal-page-layout>
    <v-container class="room-page">
      <f-loading :loading="loading" :fullscreen="true" />
      <template>
        <div v-if="isEmpty" class="hint-box empty-hint px-4 py-2 mx-2 mb-4">
          <h2 class="body-1 font-weight-bold">Hey, you are alone.</h2>
          <div class="body-2">
            🎉 share the page with friends and waiting for them to join 🎉
          </div>
        </div>
        <div v-if="noMicPermission" class="hint-box error-hint px-4 py-2 mx-2 mb-4">
          <h2 class="body-1 font-weight-bold">Mornin.fm needs Microphone Permission</h2>
          <div class="body-2">
            🎤Mornin.fm needs Microphone Permission to work properly, please allow it to use your microphone.🎤
          </div>
        </div>
        <div class="cards">
          <div
            v-for="user in participants"
            :key="user.uid"
            :style="{ 'width': cardWidth }"
            class="user-card-wrapper ma-2"
          >
            <user-card
              :user="user"
              @mute="muteUser"
              @unmute="unmuteUser"
              @edit-name="editName"
            />
          </div>
        </div>
      </template>
    </v-container>
    <v-dialog
      v-model="showNameDialog"
      max-width="290"
    >
      <v-card>
        <v-card-title class="title-2">Your name</v-card-title>
        <v-card-text class="mb-0">
          <div class="mb-4">
            <v-text-field
              label="What's your nickname"
              v-model="nickname"
              :hide-details="true"
            >
              <template v-slot:append>
                <v-btn icon @click="genRandomChannelName">
                  <v-icon>
                    {{ $icons.mdiDice3 }}
                  </v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-btn
            color="primary"
            block
            rounded
            @click="join"
          >
            Okay
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </normal-page-layout>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { Mutation, State } from 'vuex-class'
import { uniqueNamesGenerator, Config, adjectives, starWars } from 'unique-names-generator'
import PageView from '@/mixins/page'
import { launch } from '@/services/rpc'
import { uuidv4 } from '@/utils/uuid'
import UserCard from '@/components/UserCard.vue'

const randomNameConfig: Config = {
  dictionaries: [adjectives, starWars],
  separator: ' ',
  length: 2
}

@Component({
  head () {
    return {
      title: this.title,
      meta: [
        {
          hid: 'theme-color',
          name: 'theme-color',
          content: '#111'
        }
      ]
    }
  },
  components: {
    UserCard
  }
})
class RoomPage extends Mixins(PageView) {
  @State(state => state.app.profile) profile
  @State(state => state.app.chat) chat
  @Mutation('app/SET_NICKNAME') setNickname
  @Mutation('app/SET_PROFILE') setProfile
  @Mutation('app/SET_APPBAR') setAppbar

  loading = false

  showNameDialog = false

  noMicPermission:boolean = false

  nickname = ''

  roomName = ''

  uid = ''

  participantMap = {}

  participantTrackIdMap = {}

  participants:any = []

  streams = {}

  get cardWidth () {
    const winWidth = window.innerWidth
    if (winWidth < 400) {
      const cw = Math.round((winWidth - 12 * 2 - 8 * 4) / 2)
      console.log(cw)
      return `${cw}px`
    }
    return '200px'
  }

  get isEmpty () {
    return this.participants.length === 1
  }

  get title () {
    return `#${this.roomName}`
  }

  genRandomChannelName () {
    const name: string = uniqueNamesGenerator(randomNameConfig)
    this.nickname = name.slice(0, 1).toUpperCase() + name.slice(1)
  }

  mounted () {
    setTimeout(() => {
      this.reload()
      if (this.nickname) {
        launch(this.roomName, this.nickname, this.uid, this.onConnect, this.onDisconnect, this.onError)
      }
    }, 100)
  }

  reload () {
    this.loading = true
    const rname = this.$route.params.name

    if (!this.chat.rooms.hasOwnProperty(rname)) {
      this.showNameDialog = true
    } else {
      this.nickname = this.chat.rooms[rname].nickname
    }
    this.uid = this.profile.uid || uuidv4()
    this.setProfile({ uid: this.uid })

    console.log(rname, this.chat.rooms, this.profile)
    this.roomName = rname
    this.setAppbar({
      title: `#${this.roomName}`
    })
    this.loading = false
  }

  join () {
    this.setNickname({ room: this.roomName, nickname: this.nickname })
    this.showNameDialog = false
    if (this.participants.length !== 0) {
      window.location.reload()
      return
    }
    launch(this.roomName, this.nickname, this.uid, this.onConnect, this.onDisconnect, this.onError)
  }

  onConnect (stream:any, analyser:any, trackId:string, targetUid:string, targetNickname:string) {
    console.log(stream, targetUid, targetNickname)
    this.addParticipant(stream, analyser, trackId, targetUid, targetNickname)
    this.streams[targetUid] = stream
  }

  onDisconnect (trackId:string) {
    const user:any = this.removeParticipant(trackId)
    if (user !== null) {
      delete this.streams[user.uid]
    }
  }

  onError (err:any) {
    // constraint: ""
    // message: "The request is not allowed by the user agent or the platform in the current context."
    // name: "NotAllowedError"
    // stack: ""
    if (err && err.name === 'NotAllowedError') {
      console.log('no permission')
      this.noMicPermission = true
    } else {
      console.log(err)
    }
  }

  findParticipant (uid) {
    for (let ix = 0; ix < this.participants.length; ix++) {
      if (this.participants[ix].uid === uid) {
        return { user: this.participants[ix], index: ix }
      }
    }
    return null
  }

  addParticipant (stream:any, analyser:any, trackId:string, targetUid:string, targetNickname:string) {
    const incoming:any = {
      stream,
      analyser,
      trackId,
      isMuted: false,
      uid: targetUid,
      nickname: targetNickname
    }
    if (!this.participantMap.hasOwnProperty(targetUid)) {
      this.participants.push(incoming)
    }
    console.log('addParticipant', targetUid, targetNickname, trackId)
    this.participantMap[targetUid] = incoming
    this.participantTrackIdMap[trackId] = incoming
  }

  removeParticipant (trackId:string) {
    if (!this.participantTrackIdMap.hasOwnProperty(trackId)) {
      return null
    }
    const user:any = this.participantTrackIdMap[trackId]
    if (user) {
      const ret:any = this.findParticipant(user.uid)
      if (ret && ret.user) {
        console.log('removeParticipant', user, trackId)
        this.participants.splice(ret.index, 1)
        delete this.participantMap[user.uid]
      }
    }
    delete this.participantTrackIdMap[trackId]
    return user
  }

  editName (user) {
    if (user && this.uid === user.uid) {
      this.nickname = user.nickname
      this.showNameDialog = true
    }
  }

  muteUser (user) {
    if (!this.participantMap.hasOwnProperty(user.uid)) {
      return
    }
    const ret:any = this.findParticipant(user.uid)
    if (ret && ret.user) {
      ret.user.isMuted = true
      this.participants.splice(ret.index, 1, ret.user)
      this.setStream(user.uid, !user.isMuted)
    }
  }

  unmuteUser (user) {
    if (!this.participantMap.hasOwnProperty(user.uid)) {
      return
    }
    const ret:any = this.findParticipant(user.uid)
    if (ret && ret.user) {
      ret.user.isMuted = false
      this.participants.splice(ret.index, 1, ret.user)
      this.setStream(user.uid, !user.isMuted)
    }
  }

  setStream (uid, val) {
    const stream = this.streams[uid]
    if (stream && stream.getTracks().length > 0) {
      stream.getTracks()[0].enabled = val
    }
  }
}
export default RoomPage
</script>

<style lang="scss" scoped>
.cards {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  .user-card-wrapper {
  }
}
.hint-box {
  border-radius: 20px;
  &.empty-hint {
    background: linear-gradient(-15deg, rgb(153, 0, 255) 0%, #0057fa 100%) !important;
  }
  &.error-hint {
    background: linear-gradient(-15deg, rgb(236, 87, 0) 0%, #be1d00 100%) !important;
  }
}
</style>
