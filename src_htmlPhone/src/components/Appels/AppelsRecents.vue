<template>
  <div class="content">
    <div class="elements">
        <div class="element" :class="{'active': selectIndex === key}" v-for='(histo, key) in historique' :key="key"
          >
            <div class="elem-pic" :style="{backgroundColor: histo.color}">{{histo.letter}}</div>
            <div class="elem-content">
              <div class="elem-content-p">{{histo.display}}</div>
              <div class="elem-content-s">
                <div class="elem-histo-pico" 
                    :class="{'reject': hc.accept === false}" 
                    v-for="(hc, i) in histo.lastCall" :key="i">
                    <svg v-if="hc.accepts === 1 && hc.incoming === 1" viewBox="0 0 24 24" fill="#43a047">
                      <path d="M9,5v2h6.59L4,18.59L5.41,20L17,8.41V15h2V5H9z"/>
                    </svg>
                    <svg v-else-if="hc.accepts === 1 && hc.incoming === 0" viewBox="0 0 24 24" fill="#43a047">
                      <path d="M20,5.41L18.59,4L7,15.59V9H5v10h10v-2H8.41L20,5.41z"/>
                    </svg>
                    <svg v-else-if="hc.accepts === 0 && hc.incoming === 1" viewBox="0 0 24 24" fill="#D32F2F">
                      <path d="M3,8.41l9,9l7-7V15h2V7h-8v2h4.59L12,14.59L4.41,7L3,8.41z"/>
                    </svg>
                    <svg v-else-if="hc.accepts === 0 && hc.incoming === 0" viewBox="0 0 24 24" fill="#D32F2F">
                      <path d="M19.59,7L12,14.59L6.41,9H11V7H3v8h2v-4.59l7,7l9-9L19.59,7z"/>
                    </svg>
                </div>
                
                <div v-if="histo.lastCall.length !==0" class="lastCall">
                  <timeago :since='histo.lastCall[0].date' :auto-update="20"></timeago>
                </div>
              </div>
            </div>
            <div class="elem-icon">
              <i class="fa fa-phone"></i>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { groupBy, generateColorForStr } from '@/Utils'
import Modal from '@/components/Modal/index.js'

export default {
  name: 'Recents',
  components: {},
  data () {
    return {
      ignoreControls: false,
      selectIndex: 0
    }
  },
  methods: {
    ...mapActions(['startCall', 'appelsDeleteHistorique', 'appelsDeleteAllHistorique']),
    getUser (num) {
      const find = this.contacts.find(e => e.number === num)
      return find === undefined ? undefined : find.display
    },
    scrollIntoViewIfNeeded: function () {
      this.$nextTick(() => {
        this.$el.querySelector('.active').scrollIntoViewIfNeeded()
      })
    },
    onUp () {
      if (this.ignoreControls === true) return
      this.selectIndex = Math.max(0, this.selectIndex - 1)
      this.scrollIntoViewIfNeeded()
    },
    onDown () {
      if (this.ignoreControls === true) return
      this.selectIndex = Math.min(this.historique.length - 1, this.selectIndex + 1)
      this.scrollIntoViewIfNeeded()
    },
    async onEnter () {
      if (this.ignoreControls === true) return
      const numero = this.historique[this.selectIndex].num
      const isValid = numero.startsWith('#') === false
      this.ignoreControls = true
      let choix = [
        {id: 1, title: 'Effacer', icons: 'fa-circle-o', color: 'orange'},
        {id: 2, title: 'Effacer TOUT.', icons: 'fa-circle-o', color: 'red'},
        {id: 3, title: 'Retour', icons: 'fa-undo'}
      ]
      if (isValid === true) {
        choix = [{id: 0, title: 'Appeler', icons: 'fa-call-o'}, ...choix]
      }
      const rep = await Modal.CreateModal({ choix })
      this.ignoreControls = true
      switch (rep.id) {
        case 0:
          this.startCall({ numero })
          break
        case 1:
          this.appelsDeleteHistorique({ numero })
          break
        case 2 :
          this.appelsDeleteAllHistorique()
      }
    }
  },
  computed: {
    ...mapGetters(['appelsHistorique', 'contacts']),
    historique () {
      let grpHist = groupBy(this.appelsHistorique, 'num')
      let hist = []
      for (let key in grpHist) {
        const hg = grpHist[key]
        const histoByDate = hg.map(e => {
          e.date = new Date(e.time)
          return e
        }).sort((a, b) => {
          return b.date - a.date
        }).slice(0, 6)
        const display = this.getUser(key)
        hist.push({
          num: key,
          display: display || key,
          lastCall: histoByDate,
          letter: display === undefined ? '#' : display[0],
          color: generateColorForStr(key)
        })
      }
      hist.sort((a, b) => {
        return b.lastCall[0].time - a.lastCall[0].time
      })
      return hist
    }
  },
  created: function () {
    this.$bus.$on('keyUpArrowDown', this.onDown)
    this.$bus.$on('keyUpArrowUp', this.onUp)
    this.$bus.$on('keyUpEnter', this.onEnter)
  },
  beforeDestroy: function () {
    this.$bus.$off('keyUpArrowDown', this.onDown)
    this.$bus.$off('keyUpArrowUp', this.onUp)
    this.$bus.$off('keyUpEnter', this.onEnter)
  }
}
</script>

<style scoped>
  .content {
    height: 100%;
  }
  .elements {
    overflow-y: auto;
  }
  .element{
    height: 40px;
    line-height: 40px;
    display: flex;
    align-items: center;
    position: relative;
    margin: 10px;
    border-radius: 2px;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,.14), 0 3px 1px -2px rgba(0,0,0,.2), 0 1px 5px 0 rgba(0,0,0,.12);
  }
  .active.active {
    background: radial-gradient(rgba(3, 168, 244, 0.14), rgba(3, 169, 244, 0.26));
  }
  .elem-pic{
    margin-left: 6px;
    height: 32px;
    width: 32px;
    text-align: center;
    line-height: 32px;
    font-weight: 700;
    border-radius: 50%;
    color: white;
  }

  .elem-content{
    padding-left: 8px;
    width: auto;
    flex-grow: 1
  }

  .elem-content-p{
    font-size: 14px;
    line-height: 14px;
  }
   .elem-content-s{
    font-size: 8px;
    line-height: 14px;
    width: 100%;
    display: flex;
  }
  .elem-histo-pico {
    display: flex;
    flex-direction: column;
  }
  .elem-histo-pico svg {
    width: 10px;
    height: 10px;
  }
  .lastCall {
    padding-left: 4px;
  }
  .elem-icon{
    width: 20px;
  }
</style>
