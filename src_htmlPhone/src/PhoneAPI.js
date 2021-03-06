import store from '@/store'
import VoiceRTC from './VoiceRCT'

const USE_VOICE_RTC = false
const BASE_URL = 'http://gcphone/'

/* eslint-disable camelcase */
class PhoneAPI {
  constructor () {
    window.addEventListener('message', (event) => {
      const eventType = event.data.event
      if (eventType !== undefined && typeof this['on' + eventType] === 'function') {
        this['on' + eventType](event.data)
      } else if (event.data.show !== undefined) {
        store.commit('SET_PHONE_VISIBILITY', event.data.show)
      }
    })
    this.config = null
    this.voiceRTC = new VoiceRTC()
  }

  async post (method, data) {
    const ndata = data === undefined ? '{}' : JSON.stringify(data)
    const response = await window.jQuery.post(BASE_URL + method, ndata)
    return JSON.parse(response)
  }

  async log (...data) {
    if (process.env.NODE_ENV === 'production') {
      return this.post('log', data)
    } else {
      return console.log(...data)
    }
  }

  // === Gestion des messages
  async sendMessage (phoneNumber, message) {
    return this.post('sendMessage', {phoneNumber, message})
  }
  async deleteMessage (id) {
    return this.post('deleteMessage', {id})
  }
  async deleteMessagesNumber (number) {
    return this.post('deleteMessageNumber', {number})
  }
  async deleteAllMessages () {
    return this.post('deleteAllMessage')
  }
  async setMessageRead (number) {
    return this.post('setReadMessageNumber', {number})
  }

  // === Gestion des contacts
  async updateContact (id, display, phoneNumber) {
    return this.post('updateContact', { id, display, phoneNumber })
  }
  async addContact (display, phoneNumber) {
    return this.post('addContact', { display, phoneNumber })
  }
  async deleteContact (id) {
    return this.post('deleteContact', { id })
  }

  // == Gestion des appels
  async startCall (numero) {
    if (USE_VOICE_RTC === true) {
      const rtcOffer = await this.voiceRTC.prepareCall()
      console.log('PhneAPI startCall')
      return this.post('startCall', { numero, rtcOffer })
    } else {
      return this.post('startCall', { numero })
    }
  }
  async acceptCall (infoCall) {
    if (USE_VOICE_RTC === true) {
      console.log('PhneAPI acceptCall' + JSON.stringify(infoCall))
      const rtcAnswer = await this.voiceRTC.acceptCall(infoCall.rtcOffer)
      console.log('PhneAPI acceptCall')
      return this.post('acceptCall', { infoCall, rtcAnswer })
    } else {
      return this.post('acceptCall', { infoCall })
    }
  }
  async rejectCall (infoCall) {
    return this.post('rejectCall', { infoCall })
  }
  async appelsDeleteHistorique (numero) {
    return this.post('appelsDeleteHistorique', { numero })
  }
  async appelsDeleteAllHistorique () {
    return this.post('appelsDeleteAllHistorique')
  }

  // === Autre
  async closePhone () {
    return this.post('closePhone')
  }
  async setGPS (x, y) {
    return this.post('setGPS', {x, y})
  }
  async takePhoto () {
    return this.post('takePhoto')
  }
  async getReponseText (data) {
    if (process.env.NODE_ENV === 'production') {
      return this.post('reponseText', data || {})
    } else {
      return {text: window.prompt()}
    }
  }
  async callEvent (eventName, data) {
    return this.post('callEvent', {eventName, data})
  }
  async deleteALL () {
    localStorage.clear()
    console.log('tchatReset')
    store.dispatch('tchatReset')
    console.log('resetPhone')
    store.dispatch('resetPhone')
    console.log('resetMessage')
    store.dispatch('resetMessage')
    console.log('resetContact')
    store.dispatch('resetContact')
    console.log('resetBourse')
    store.dispatch('resetBourse')
    console.log('resetAppels')
    store.dispatch('resetAppels')
    console.log('event: deleteALL')
    return this.post('deleteALL')
    // store.dispatch('resetbank') //
  }
  async getConfig () {
    if (this.config === null) {
      const response = await window.jQuery.get('/html/static/config/config.json')
      if (process.env.NODE_ENV === 'production') {
        this.config = JSON.parse(response)
      } else {
        this.config = response
      }
      this.voiceRTC = new VoiceRTC(this)
      window.VR = this.voiceRTC
    }
    return this.config
  }

  // === App Tchat
  async tchatGetMessagesChannel (channel) {
    this.post('tchat_getChannel', { channel })
  }
  async tchatSendMessage (channel, message) {
    this.post('tchat_addMessage', { channel, message })
  }

  // ==========================================================================
  //  Gestion des events
  // ==========================================================================
  onupdateMyPhoneNumber (data) {
    store.commit('SET_MY_PHONE_NUMBER', data.myPhoneNumber)
  }
  onupdateMessages (data) {
    store.commit('SET_MESSAGES', data.messages)
  }
  onnewMessage (data) {
    store.commit('ADD_MESSAGE', data.message)
  }
  onupdateContacts (data) {
    store.commit('SET_CONTACTS', data.contacts)
  }
  onhistoriqueCall (data) {
    store.commit('SET_APPELS_HISTORIQUE', data.historique)
  }
  onupdateBankbalance (data) {
    store.commit('SET_BANK_AMONT', data.banking)
  }
  onupdateBourse (data) {
    store.commit('SET_BOURSE_INFO', data.bourse)
  }
  onwaitingCall (data) {
    store.commit('SET_APPELS_INFO_IF_EMPTY', {
      ...data.infoCall,
      initiator: data.initiator
    })
  }
  onacceptCall (data) {
    console.log('onacceptCall ' + data.initiator)
    if (data.initiator === true) {
      this.voiceRTC.onReceiveAnswer(data.infoCall.rtcAnswer)
    }
    store.commit('SET_APPELS_INFO_IS_ACCEPTS', true)
  }
  onrejectCall (data) {
    store.commit('SET_APPELS_INFO', null)
  }
  // Tchat Event
  ontchat_receive (data) {
    store.dispatch('tchatAddMessage', data)
  }
  ontchat_channel (data) {
    store.commit('TCHAT_SET_MESSAGES', data)
  }

  // =====================
  rtcSendOffer (data) {
    this.voiceRTC.prepareCall()
  }
  rtcSendAnswer (data) {
    this.post('gcPhoneRTC_send_answer', data)
  }
  ongcPhoneRTC_receive_offer (data) {
    console.log('')
  }

  ongcPhoneRTC_receive_answer (data) {
    console.log('')
  }

}

const instance = new PhoneAPI()

export default instance
