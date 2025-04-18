import ColumnChart from '../../04-oop-basic-intro-to-dom/1-column-chart/index.js'
import fetchJson from './utils/fetch-json.js'

const BACKEND_URL = 'https://course-js.javascript.ru'

export default class ColumnChartV2 extends ColumnChart {
  constructor(options = {}) {
    super(options);
    this.url = options.url || ''
    this.initSubElements()
  }

  initSubElements() {
    const header = this.element.querySelector('.column-chart__header')
    const body = this.element.querySelector('.column-chart__chart')
    if (header) header.setAttribute('data-element', 'header')
    if (body) body.setAttribute('data-element', 'body')
    this.subElements = this.getSubElements(this.element)
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')
    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;
      return accum
    }, {})
  }

  async update(from, to) {
    this.element.classList.add('column-chart_loading')

    const response = await this.fetchData(from, to);
    const data = Object.values(response);
    const validData = data.filter(item => typeof item === 'number' && !isNaN(item));
    this.value = validData.reduce((sum, val) => sum + val, 0);
    this.data = validData;

    this.element.classList.remove('column-chart_loading')

    if (this.subElements.header) {
      this.subElements.header.innerHTML = this.formatHeading(this.value)
    }

    if (this.subElements.body) {
      this.subElements.body.innerHTML = this.data.length > 0 ? this.renderChartBars() : ''
    }

    return response
  }

  async fetchData(from, to) {
    const url = new URL(`${BACKEND_URL}/${this.url}`)
    url.searchParams.set('from', from.toISOString())
    url.searchParams.set('to', to.toISOString())
    return await fetchJson(url.toString())
  }
}