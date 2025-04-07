export default class NotificationMessage {
    static lastShownComponent
    static TIMEOUT = 5_000
  
    constructor(message, options = {}) {
      this.message = message
      this.type = options.type || 'success'
      this.duration = options.duration || NotificationMessage.TIMEOUT
      this.element = this.createElement()
    }
  
    createElement() {
      const div = document.createElement('div')
      div.className = `notification ${this.type}`
      div.style.setProperty('--value', `${this.duration / 1000}s`)
      
      div.innerHTML = `
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">${this.message}</div>
        </div>
      `
      return div
    }
  
    show(target = document.body) {
      if (NotificationMessage.lastShownComponent) {
        NotificationMessage.lastShownComponent.remove()
      }
  
      target.appendChild(this.element)
      NotificationMessage.lastShownComponent = this
  
      this.timerId = setTimeout(() => {
        this.remove()
      }, this.duration)
    }
  
    hide() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
      clearTimeout(this.timerId)
      if (NotificationMessage.lastShownComponent === this) {
        NotificationMessage.lastShownComponent = null
      }
    }
  
    remove() {
      this.hide()
    }
  
    destroy() {
      this.remove()
      clearTimeout(this.timerId)
    }
  }