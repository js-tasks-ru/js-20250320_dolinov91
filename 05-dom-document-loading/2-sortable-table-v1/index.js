export default class SortableTable {
  element
  subElements = {}

  constructor(config = [], data = []) {
      this.config = config
      this.data = Array.isArray(data) ? [...data] : []
      this.sortedField = null
      this.sortedOrder = null
      this.render()
  }

  createTableHeaderTemplate() {
      return this.config.map(columnConfig => {
          const isSortable = columnConfig.sortable !== false
          const arrowSpan = isSortable
              ? `<span data-element="arrow" class="sortable-table__sort-arrow">
                   <span class="sort-arrow"></span>
                 </span>`
              : ''
          return `
              <div class="sortable-table__cell" data-id="${columnConfig.id}" data-sortable="${isSortable}">
                  <span>${columnConfig.title}</span>
                  ${arrowSpan}
              </div>
          `
      }).join('')
  }

  createTableBodyCellTemplate(item, columnConfig) {
      if (columnConfig.template) {
          return columnConfig.template(item[columnConfig.id])
      }
      return `<div class="sortable-table__cell">${item[columnConfig.id]}</div>`
  }

  createTableBodyRowTemplate(item) {
      const href = item.id ? `/products/${item.id}` : '#'
      return `
          <a href="${href}" class="sortable-table__row">
              ${this.config.map(columnConfig =>
                  this.createTableBodyCellTemplate(item, columnConfig)
              ).join('')}
          </a>
      `
  }

  createTableBodyTemplate(dataToRender) {
      return dataToRender.map(item =>
          this.createTableBodyRowTemplate(item)
      ).join('')
  }

  getTableTemplate() {
      return `
          <div class="sortable-table">
              <div data-element="header" class="sortable-table__header sortable-table__row">
                  ${this.createTableHeaderTemplate()}
              </div>
              <div data-element="body" class="sortable-table__body">
                  ${this.createTableBodyTemplate(this.data)}
              </div>
              <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
              <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
                  <div>
                      <p>No data satisfies your filter criteria</p>
                      <button type="button" class="button-primary-outline">Reset all filters</button>
                  </div>
              </div>
          </div>
      `
  }

  render() {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = this.getTableTemplate()
      this.element = wrapper.firstElementChild
      this.subElements = this.getSubElements(this.element)
      this.addEventListeners()
  }

  getSubElements(element) {
      const result = {}
      const elements = element.querySelectorAll('[data-element]')
      for (const subElement of elements) {
          result[subElement.dataset.element] = subElement
      }
      return result
  }

  sort(field, order) {
      const columnConfig = this.config.find(conf => conf.id === field)
      if (!columnConfig || columnConfig.sortable === false) {
          return
      }
      const sortType = columnConfig.sortType || 'string'
      const sortFunctions = {
          string: (a, b) => order === 'asc'
              ? a[field].localeCompare(b[field], ['ru', 'en'], { caseFirst: 'upper' })
              : b[field].localeCompare(a[field], ['ru', 'en'], { caseFirst: 'upper' }),
          number: (a, b) => order === 'asc'
              ? a[field] - b[field]
              : b[field] - a[field],
          date: (a, b) => {
              const dateA = new Date(a[field])
              const dateB = new Date(b[field])
              return order === 'asc' ? dateA - dateB : dateB - dateA
          }
      }
      if (!sortFunctions[sortType]) {
          return
      }
      const sortedData = [...this.data].sort(sortFunctions[sortType])
      this.data = sortedData
      this.sortedField = field
      this.sortedOrder = order
      this.updateHeaderSortUI(field, order)
      this.subElements.body.innerHTML = this.createTableBodyTemplate(this.data)
  }

  updateHeaderSortUI(field, order) {
      const allHeaderCells = this.subElements.header.querySelectorAll('.sortable-table__cell[data-id]')
      allHeaderCells.forEach(cell => {
          cell.dataset.order = ''
      })
      const currentHeaderCell = this.subElements.header.querySelector(`.sortable-table__cell[data-id="${field}"]`)
      if (currentHeaderCell) {
          currentHeaderCell.dataset.order = order
      }
  }

  destroy() {
      if (this.element) {
          this.element.remove()
      }
  }
}