export default class RangePicker {
    element = null
    subElements = {}
    selectingFrom = true
  
    static formatDate(date) {
      return date.toLocaleString('ru', {day: '2-digit', month: '2-digit', year: 'numeric'})
    }
  
    constructor({from = new Date(), to = new Date()} = {}) {
      this.showDate = new Date(from)
      this.selected = {from, to}
      
      this.render()
    }
  
    get template() {
      const from = RangePicker.formatDate(this.selected.from)
      const to = RangePicker.formatDate(this.selected.to)
  
      return `<div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from">${from}</span> -
          <span data-element="to">${to}</span>
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>`
    }
  
    render() {
      const element = document.createElement('div')
      element.innerHTML = this.template
  
      this.element = element.firstElementChild
      this.subElements = this.getSubElements(element)
  
      this.initEventListeners()
    }
  
    getSubElements(element) {
      const elements = element.querySelectorAll('[data-element]')
  
      return [...elements].reduce((accum, subElement) => {
        accum[subElement.dataset.element] = subElement
        return accum
      }, {})
    }
  
    initEventListeners() {
      this.subElements.input.addEventListener('click', () => this.toggle())
      document.addEventListener('click', this.onDocumentClick, true)
    }
  
    onDocumentClick = event => {
      const isOpen = this.element.classList.contains('rangepicker_open')
      const isRangePicker = this.element.contains(event.target)
  
      if (isOpen && !isRangePicker) {
        this.close()
      }
    }
  
    toggle() {
      if (this.element.classList.contains('rangepicker_open')) {
        this.close()
      } else {
        this.open()
      }
    }
  
    open() {
      this.element.classList.add('rangepicker_open')
      this.renderDateRangePicker()
    }
  
    close() {
      this.element.classList.remove('rangepicker_open')
    }
  
    renderDateRangePicker() {
      const firstDate = new Date(this.showDate)
      const secondDate = new Date(this.showDate)
      secondDate.setMonth(secondDate.getMonth() + 1)
  
      this.subElements.selector.innerHTML = `
        <div class="rangepicker__selector-arrow"></div>
        <div class="rangepicker__selector-control-left"></div>
        <div class="rangepicker__selector-control-right"></div>
      `
  
      const firstCalendar = this.createCalendar(firstDate)
      const secondCalendar = this.createCalendar(secondDate)
  
      this.subElements.selector.append(firstCalendar, secondCalendar)
  
      this.subElements.selector.querySelectorAll('.rangepicker__cell').forEach(cell => {
        cell.addEventListener('click', this.onCellClick)
      })
  
      const leftArrow = this.element.querySelector('.rangepicker__selector-control-left')
      const rightArrow = this.element.querySelector('.rangepicker__selector-control-right')
      
      leftArrow.addEventListener('click', () => this.prev())
      rightArrow.addEventListener('click', () => this.next())
  
      this.highlightDateRange()
    }
  
    createCalendar(date) {
      const calendar = document.createElement('div')
      calendar.className = 'rangepicker__calendar'
  
      const monthIndicator = this.createMonthIndicator(date)
      const dayOfWeek = this.createDayOfWeek()
      const dateGrid = this.createDateGrid(date)
  
      calendar.append(monthIndicator, dayOfWeek, dateGrid)
      
      return calendar
    }
  
    createMonthIndicator(date) {
      const monthIndicator = document.createElement('div')
      monthIndicator.className = 'rangepicker__month-indicator'
      
      const month = date.toLocaleString('ru', {month: 'long'})
      
      const timeElement = document.createElement('time')
      timeElement.setAttribute('datetime', month)
      timeElement.textContent = month
      
      monthIndicator.append(timeElement)
      
      return monthIndicator
    }
  
    createDayOfWeek() {
      const dayOfWeek = document.createElement('div')
      dayOfWeek.className = 'rangepicker__day-of-week'
      
      for (let i = 1; i <= 7; i++) {
        const day = document.createElement('div')
        
        const currentDay = new Date()
        const diff = currentDay.getDay() - i
        currentDay.setDate(currentDay.getDate() - diff)
        
        day.textContent = currentDay.toLocaleString('ru', {weekday: 'short'}).slice(0, 2)
        dayOfWeek.append(day)
      }
      
      return dayOfWeek
    }
  
    createDateGrid(date) {
      const dateGrid = document.createElement('div')
      dateGrid.className = 'rangepicker__date-grid'
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const totalDays = monthEnd.getDate()
      
      let dayOfWeek = monthStart.getDay()
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
      
      for (let i = 1; i <= totalDays; i++) {
        const currentDate = new Date(date.getFullYear(), date.getMonth(), i)
        
        const cell = document.createElement('button')
        cell.className = 'rangepicker__cell'
        cell.dataset.value = currentDate.toISOString()
        cell.textContent = i
        
        if (i === 1) {
          cell.style.gridColumnStart = dayOfWeek
        }
        
        dateGrid.append(cell)
      }
      
      return dateGrid
    }
  
    prev = () => {
      this.showDate.setMonth(this.showDate.getMonth() - 1)
      this.renderDateRangePicker()
    }
  
    next = () => {
      this.showDate.setMonth(this.showDate.getMonth() + 1)
      this.renderDateRangePicker()
    }
  
    onCellClick = event => {
      const cell = event.target
      
      if (cell.classList.contains('rangepicker__cell')) {
        const value = cell.dataset.value
        
        if (value) {
          const date = new Date(value)
          
          if (this.selectingFrom) {
            this.selected = {
              from: new Date(date),
              to: null
            }
            this.selectingFrom = false
            this.highlightCell(date)
          } else {
            if (date > this.selected.from) {
              this.selected.to = new Date(date)
            } else {
              this.selected.to = new Date(this.selected.from)
              this.selected.from = new Date(date)
            }
            this.selectingFrom = true
            this.highlightDateRange()
            this.dispatchEvent()
            this.subElements.from.innerHTML = RangePicker.formatDate(this.selected.from)
            this.subElements.to.innerHTML = RangePicker.formatDate(this.selected.to)
          }
        }
      }
    }
  
    highlightDateRange() {
      const { from, to } = this.selected
      
      if (!from || !to) {
        return
      }
      
      const cells = this.element.querySelectorAll('.rangepicker__cell')
      
      for (const cell of cells) {
        const date = new Date(cell.dataset.value)
        
        cell.classList.remove('rangepicker__selected-from', 'rangepicker__selected-to', 'rangepicker__selected-between')
        
        if (date.getTime() === from.getTime()) {
          cell.classList.add('rangepicker__selected-from')
        } else if (date.getTime() === to.getTime()) {
          cell.classList.add('rangepicker__selected-to')
        } else if (date > from && date < to) {
          cell.classList.add('rangepicker__selected-between')
        }
      }
    }
  
    highlightCell(date) {
      const cells = this.element.querySelectorAll('.rangepicker__cell')
      
      for (const cell of cells) {
        cell.classList.remove('rangepicker__selected-from', 'rangepicker__selected-to', 'rangepicker__selected-between')
        
        if (new Date(cell.dataset.value).getTime() === date.getTime()) {
          cell.classList.add('rangepicker__selected-from')
        }
      }
    }
  
    dispatchEvent() {
      this.element.dispatchEvent(new CustomEvent('date-select', {
        bubbles: true,
        detail: this.selected
      }))
    }
  
    remove() {
      if (this.element) {
        this.element.remove()
      }
    }
  
    destroy() {
      this.remove()
      document.removeEventListener('click', this.onDocumentClick, true)
    }
}