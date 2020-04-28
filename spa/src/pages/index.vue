<template>
  <normal-page-layout>
    <v-container class="room-page">
      <f-loading :loading="loading" :fullscreen="true" />
      <template>
        <div class="intro pa-4">
          <p class="title">Mornin.fm is an anonymous audio conferencing service</p>
          <p class="body-2">Talk with your friends without installing App</p>
          <p class="py-5">
            <v-btn
              color="primary"
              rounded
              @click="showJoinDialog = true"
            >
              {{ 'Create a Room' }}
            </v-btn>
          </p>
        </div>
        <template v-if="!noRecentRooms">
          <v-subheader class="caption ml-2">Recent rooms</v-subheader>
          <div class="rooms">
            <div
              v-for="room in recentRooms"
              :key="`${room.room}-${room.nickname}`"
              :style="{ 'width': cardWidth }"
              class="rooms-card-wrapper ma-2"
            >
              <room-card
                :room="room"
                @join="joinRoom"
                @delete="deleteRoom"
              >
              </room-card>
            </div>
          </div>
        </template>
      </template>
    </v-container>
    <v-dialog
      v-model="showJoinDialog"
      max-width="290"
    >
      <v-card>
        <v-card-title class="title-2">Create or join a room</v-card-title>
        <v-card-text class="mb-0 pb-2">
          <div class="mb-4">
            <v-text-field
              prefix="#"
              label="Room Name"
              v-model="channelName"
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
          <div class="hint">
            <p class="caption"><span class="domain">https://mornin.fm/#/</span><span class="font-weight-bold">ROOM-ID</span> indicate an audio conferencing at <span class="font-weight-bold">ROOM-ID</span></p>
            <p class="caption"><span class="font-weight-bold">ROOM-ID</span> could be alphabets or numbers, a simple word is good for a public room, a random string is good for private room.</p>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-btn
            color="primary"
            block
            rounded
            :disabled="!validated"
            @click="createOrJoin"
          >
            Join
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </normal-page-layout>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { Mutation, State } from 'vuex-class'
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator'
import PageView from '@/mixins/page'
import RoomCard from '@/components/RoomCard.vue'

const randomNameConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: '-',
  length: 3
}

@Component({
  head () {
    return {
      title: this.title
    }
  },
  components: {
    RoomCard
  }
})
class IndexPage extends Mixins(PageView) {
  @State(state => state.app.profile) profile
  @State(state => state.app.chat) chat
  @Mutation('app/SET_APPBAR') setAppbar
  @Mutation('app/REMOVE_ROOM') removeRoom

  showJoinDialog = false

  loading = false

  channelName:string = ''

  get title () {
    return 'Mornin.fm'
  }

  get cardWidth () {
    const winWidth = window.innerWidth
    if (winWidth < 400) {
      return `${winWidth - 12 - 8 * 2}px`
    }
    return '200px'
  }

  get recentRooms () {
    return this.chat.rooms
  }

  get noRecentRooms () {
    return Object.values(this.recentRooms).length === 0
  }

  get validated () {
    return this.channelName.trim().length !== 0 && /[a-zA-Z0-9_\\-]+/.test(this.channelName)
  }

  mounted () {
    setTimeout(() => {
      this.reload()
    }, 100)
  }

  reload () {
    this.setAppbar({
      title: '#mornin.fm',
      back: false
    })
  }

  genRandomChannelName () {
    const name: string = uniqueNamesGenerator(randomNameConfig)
    this.channelName = encodeURI(name.toLowerCase().replace(/ /g, '-'))
  }

  deleteRoom (room) {
    this.removeRoom({ room: room.room })
  }

  joinRoom (room) {
    this.$router.push(`/r/${room.room}`)
  }

  createOrJoin () {
    this.$router.push(`/r/${this.channelName}`)
  }
}
export default IndexPage
</script>

<style lang="scss" scoped>
.intro {
}
.hint {
  color: rgba(255, 255, 255, 0.7);
  p {
    line-height: 1.3;
    margin-bottom: 1em;
  }
}
.domain {
  color: #2196f3;
}
.rooms {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  .room-card-wrapper {
  }
}
</style>
