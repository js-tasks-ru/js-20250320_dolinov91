import RangePicker from './components/range-picker/src/index.js'
import SortableTable from './components/sortable-table/src/index.js'
import ColumnChart from './components/column-chart/src/index.js'
import header from './bestsellers-header.js'

export default class Page {
  element
  subElements = {}
  components = {}
  
  async render() {
    const element = document.createElement('div')
    element.innerHTML = this.getTemplate()
    this.element = element.firstElementChild
    this.subElements = this.getSubElements(this.element)
    this.initComponents()
    this.renderComponents()
    this.initEventListeners()
    return this.element
  }

  getTemplate() {
    return `
      <div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <div data-element="rangePicker"></div>
        </div>
        <div data-element="chartsRoot" class="dashboard__charts">
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>
        <h3 class="block-title">Best sellers</h3>
        <div data-element="sortableTable"></div>
      </div>
    `
  }

  initComponents() {
    const now = new Date()
    const to = new Date()
    const from = new Date(now.setMonth(now.getMonth() - 1))
    const rangePicker = new RangePicker({ from, to })
    const ordersChart = new ColumnChart({
      url: 'api/dashboard/orders',
      range: {
        from,
        to
      },
      label: 'orders',
      link: '#'
    })
    const salesChart = new ColumnChart({
      url: 'api/dashboard/sales',
      range: {
        from,
        to
      },
      label: 'sales',
      formatHeading: data => `$${data}`
    })
    const customersChart = new ColumnChart({
      url: 'api/dashboard/customers',
      range: {
        from,
        to
      },
      label: 'customers'
    })
    const sortableTable = new SortableTable(header, {
      url: `api/dashboard/bestsellers?from=${from.toISOString()}&to=${to.toISOString()}`,
      isSortLocally: true,
      start: 0,
      step: 30
    })
    this.components = {
      rangePicker,
      ordersChart,
      salesChart,
      customersChart,
      sortableTable
    }
  }
  
  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component]
      const { element } = this.components[component]
      root.append(element)
    })
  }
  
  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')
    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement
      return accum
    }, {})
  }
  
  initEventListeners() {
    this.components.rangePicker.element.addEventListener('date-select', event => {
      const { from, to } = event.detail
      this.updateComponents(from, to)
    })
  }
  
  async updateComponents(from, to) {
    const { ordersChart, salesChart, customersChart, sortableTable } = this.components
    ordersChart.update(from, to)
    salesChart.update(from, to)
    customersChart.update(from, to)
    sortableTable.url.searchParams.set('from', from.toISOString())
    sortableTable.url.searchParams.set('to', to.toISOString())
    sortableTable.sortOnServer(sortableTable.sorted.id, sortableTable.sorted.order, 1, 30)
  }
  
  remove() {
    if (this.element) {
      this.element.remove()
    }
  }
  
  destroy() {
    this.remove()
    for (const component of Object.values(this.components)) {
      component.destroy()
    }
  }
}