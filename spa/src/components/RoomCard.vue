<template>
  <div
    v-if="room"
    class="room-card pb-2 px-4"
  >
    <div class="top d-flex py-2">
      <div class="nickname font-weight-bold">
        #{{ room.room }}
      </div>
    </div>
    <v-btn
      class="delete-button"
      icon
      color="#bb1312"
      @click="$emit('delete', room)"
    >
      <v-icon>
        {{ $icons.mdiClose }}
      </v-icon>
    </v-btn>
    <div class="d-flex">
      <v-btn
        text
        block
        color="primary"
        @click="$emit('join', room)"
      >
        {{ 'Join' }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
// import { uuidToColor } from '@/utils/uuid'

@Component
class FLoading extends Vue {
  @Prop() room

  mounted () {
  }

  join () {
    this.$emit('join', this.room)
  }
}
export default FLoading
</script>

<style lang="scss" scoped>
.room-card {
  border-radius: 20px;
  width: 100%;
  background: #000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  position: relative;
  .delete-button {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
  }
  .top {
    text-align: center;
    justify-content: space-between;
    top: 0;
    left: 0;
    right: 0;
  }
}
</style>
