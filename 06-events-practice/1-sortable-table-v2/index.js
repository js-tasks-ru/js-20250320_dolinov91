export default class SortableTable {
  element
  subElements = {}
  headerConfig = []
  data = []
  isSortLocally = true
  sortedField = null
  sortedOrder = null
  #headerClickHandler = null

  constructor(
    headerConfig = [],
    {
      data = [],
      sorted = {
        id: headerConfig.find((item) => item.sortable === true)?.id,
        order: "asc",
      },
      isSortLocally = true,
    } = {}
  ) {
    this.headerConfig = headerConfig
    this.data = Array.isArray(data) ? [...data] : []
    this.isSortLocally = isSortLocally
    this.sortedField = sorted?.id
    this.sortedOrder = sorted?.order

    const initialSortColumnConfig = this.headerConfig.find(
      (col) => col.id === this.sortedField
    )
    if (!initialSortColumnConfig || initialSortColumnConfig.sortable !== true) {
      const firstSortableColumn = this.headerConfig.find(
        (item) => item.sortable === true
      )
      this.sortedField = firstSortableColumn?.id || null
      this.sortedOrder = this.sortedField ? "asc" : null
    }

    this.render()
  }

  createTableHeaderTemplate() {
    return this.headerConfig
      .map((columnConfig) => {
        const isSortable = columnConfig.sortable === true
        const arrowSpan = isSortable
          ? `<span data-element="arrow" class="sortable-table__sort-arrow">
             <span class="sort-arrow"></span>
           </span>`
          : ""
        const sortableAttr = `data-sortable="${isSortable}"`
        const orderAttr =
          isSortable && columnConfig.id === this.sortedField
            ? `data-order="${this.sortedOrder}"`
            : ""

        return `
        <div class="sortable-table__cell" data-id="${columnConfig.id}" ${sortableAttr} ${orderAttr}>
          <span>${columnConfig.title}</span>
          ${arrowSpan}
        </div>
      `
      })
      .join("")
  }

  createTableBodyCellTemplate(item, columnConfig) {
    if (columnConfig.template && typeof columnConfig.template === "function") {
      return columnConfig.template(item[columnConfig.id], item)
    }
    const value = item[columnConfig.id] ?? ""
    return `<div class="sortable-table__cell">${value}</div>`
  }

  createTableBodyRowTemplate(item) {
    const idValue = item?.id ?? null
    const href = idValue ? `/products/${encodeURIComponent(idValue)}` : "#"

    return `
      <a href="${href}" class="sortable-table__row">
        ${this.headerConfig
        .map((columnConfig) =>
          this.createTableBodyCellTemplate(item, columnConfig)
        )
        .join("")}
      </a>
    `
  }

  createTableBodyTemplate(dataToRender) {
    if (!dataToRender || dataToRender.length === 0) {
      this.element?.classList.add("sortable-table_empty")
      return ""
    }
    this.element?.classList.remove("sortable-table_empty")
    return dataToRender
      .map((item) => this.createTableBodyRowTemplate(item))
      .join("")
  }

  getTableTemplate() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.createTableHeaderTemplate()}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${""}
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
    const wrapper = document.createElement("div")
    wrapper.innerHTML = this.getTableTemplate()
    this.element = wrapper.firstElementChild
    this.subElements = this.getSubElements(this.element)

    if (this.sortedField && this.sortedOrder) {
      this.sort(this.sortedField, this.sortedOrder)
    } else {
      this.updateTableBodyUI(this.data)
    }

    this.addEventListeners()
  }

  getSubElements(element) {
    const result = {}
    if (!element) return result
    const elements = element.querySelectorAll("[data-element]")
    for (const subElement of elements) {
      const name = subElement.dataset.element
      result[name] = subElement
    }
    return result
  }

  updateTableBodyUI(dataToRender) {
    if (this.subElements.body) {
      this.subElements.body.innerHTML =
        this.createTableBodyTemplate(dataToRender)
    }
    if (!dataToRender || dataToRender.length === 0) {
      this.element?.classList.add("sortable-table_empty")
    } else {
      this.element?.classList.remove("sortable-table_empty")
    }
  }

  updateHeaderSortUI(field, order) {
    if (!this.subElements.header) return

    const allHeaderCells = this.subElements.header.querySelectorAll(
      ".sortable-table__cell[data-id]"
    )
    allHeaderCells.forEach((cell) => {
      cell.removeAttribute("data-order")
      if (cell.dataset.id === field && cell.dataset.sortable === "true") {
        cell.dataset.order = order
      }
    })
  }

  sort(field, order) {
    if (order !== "asc" && order !== "desc") {
      order = "asc"
    }

    const columnConfig = this.headerConfig.find((conf) => conf.id === field)

    if (!columnConfig || columnConfig.sortable !== true) {
      return
    }

    this.sortedField = field
    this.sortedOrder = order

    this.updateHeaderSortUI(field, order)

    if (this.isSortLocally) {
      this.sortOnClient(field, order, columnConfig)
    } else {
      this.sortOnServer(field, order)
    }
  }

  sortOnClient(field, order, columnConfig) {
    const sortType = columnConfig.sortType
    const customSortFn = columnConfig.sortFn
    const directions = { asc: 1, desc: -1 }
    const direction = directions[order]

    const sortedData = [...this.data].sort((a, b) => {
      const valueA = a[field]
      const valueB = b[field]

      if (typeof customSortFn === "function") {
        return direction * customSortFn(valueA, valueB, a, b)
      }

      switch (sortType) {
        case "number":
          const numA = parseFloat(valueA)
          const numB = parseFloat(valueB)

          const aIsNaN = isNaN(numA)
          const bIsNaN = isNaN(numB)

          if (aIsNaN && bIsNaN) return 0
          if (aIsNaN) return -1 * direction
          if (bIsNaN) return 1 * direction

          return direction * (numA - numB)

        case "date":
          const dateA = valueA ? new Date(valueA) : null
          const dateB = valueB ? new Date(valueB) : null
          const timeA = dateA?.getTime()
          const timeB = dateB?.getTime()

          const aIsInvalid = dateA === null || isNaN(timeA)
          const bIsInvalid = dateB === null || isNaN(timeB)

          if (aIsInvalid && bIsInvalid) return 0
          if (aIsInvalid) return -1 * direction
          if (bIsInvalid) return 1 * direction

          return direction * (timeA - timeB)

        case "string":
        default:
          const stringA = String(valueA ?? "")
          const stringB = String(valueB ?? "")
          return (
            direction *
            stringA.localeCompare(stringB, ["ru", "en"], { caseFirst: "upper" })
          )
      }
    })

    this.updateTableBodyUI(sortedData)
  }

  sortOnServer(field, order) {
    this.element?.classList.add("sortable-table_loading")

    setTimeout(() => {
      this.element?.classList.remove("sortable-table_loading")
    }, 500)
  }

  addEventListeners() {
    this.removeEventListeners()

    this.#headerClickHandler = (event) => {
      const headerCell = event.target.closest(
        '.sortable-table__cell[data-sortable="true"]'
      )

      if (!headerCell) {
        return
      }

      const field = headerCell.dataset.id
      const isCurrentSortField = field === this.sortedField
      let newOrder

      if (isCurrentSortField) {
        newOrder = this.sortedOrder === "asc" ? "desc" : "asc"
      } else {
        newOrder = "desc"
      }

      this.sort(field, newOrder)
    }

    this.subElements.header?.addEventListener(
      "pointerdown",
      this.#headerClickHandler
    )
  }

  removeEventListeners() {
    if (this.#headerClickHandler && this.subElements.header) {
      this.subElements.header.removeEventListener(
        "pointerdown",
        this.#headerClickHandler
      )
    }
  }

  destroy() {
    this.removeEventListeners()
    if (this.element) {
      this.element.remove()
    }
  }
}