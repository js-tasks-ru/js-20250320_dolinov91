export default class ColumnChart {
    constructor(options = {}) {
      this.data = options.data || []
      this.label = options.label || ''
      this.value = options.value || 0
      this.link = options.link || ''
      this.formatHeading = options.formatHeading || (value => value)
      this.chartHeight = 50
      this.element = this.createElement()
    }
  
    createElement() {
      const element = document.createElement('div')
      element.className = `column-chart ${this.data.length === 0 ? 'column-chart_loading' : ''}`
      element.innerHTML = `
        <div class="column-chart__title">
          Total ${this.label}
          ${this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : ''}
        </div>
        <div class="column-chart__container">
          <div class="column-chart__header">${this.formatHeading(this.value)}</div>
          <div class="column-chart__chart">
            ${this.data.length > 0 ? this.renderChartBars() : ''}
          </div>
        </div>
      `
      return element
    }
  
    renderChartBars() {
      const maxValue = Math.max(...this.data)
      const scale = this.chartHeight / maxValue
      return this.data
        .map(item => {
          const scaledValue = Math.floor(item * scale)
          const percent = ((item / maxValue) * 100).toFixed(0) + '%'
          return `<div style="--value: ${scaledValue}" data-tooltip="${percent}"></div>`
        })
        .join('')
    }
  
    update(newData) {
      this.data = newData || []
      const container = this.element.querySelector('.column-chart__container')
      const hasData = this.data.length > 0
      this.element.classList.toggle('column-chart_loading', !hasData)
      container.innerHTML = `
        <div class="column-chart__header">${this.formatHeading(this.value)}</div>
        <div class="column-chart__chart">
          ${hasData ? this.renderChartBars() : ''}
        </div>
      `
    }
  
    remove() {
      if (this.element) {
        this.element.remove()
      }
    }
  
    destroy() {
      this.remove()
    }
}