export default class SortableTable {
    element
    subElements = {}
  
    constructor(headerConfig = [], data = []) {
        this.headerConfig = headerConfig
        this.data = Array.isArray(data) ? data : []
        this.sortedField = null
        this.sortedOrder = null
        this.render()
    }
  
    createTableHeaderTemplate() {
        return this.headerConfig
            .map((columnConfig) => {
                const isSortable = columnConfig.sortable !== false
                const arrowSpan = isSortable
                    ? `<span data-element="arrow" class="sortable-table__sort-arrow">
                         <span class="sort-arrow"></span>
                       </span>`
                    : ""
                return `
                    <div class="sortable-table__cell" data-id="${columnConfig.id}" data-sortable="${isSortable}">
                        <span>${columnConfig.title}</span>
                        ${arrowSpan}
                    </div>
                `
            })
            .join("")
    }
  
    createTableBodyCellTemplate(item, columnConfig) {
        if (columnConfig.template && typeof columnConfig.template === "function")
            return columnConfig.template(item[columnConfig.id])
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
        const wrapper = document.createElement("div")
        wrapper.innerHTML = this.getTableTemplate()
        this.element = wrapper.firstElementChild
        this.subElements = this.getSubElements(this.element)
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
  
    sort(field, order) {
        const columnConfig = this.headerConfig.find((conf) => conf.id === field)
        if (!columnConfig || columnConfig.sortable === false)
            return
  
        const sortType = columnConfig.sortType || "string"
        const directions = { asc: 1, desc: -1 }
        const direction = directions[order]
  
        const compareFn = (a, b) => {
            const valueA = a[field]
            const valueB = b[field]
  
            switch (sortType) {
                case "number":
                    return direction * (valueA - valueB)
                case "string":
                    return (
                        direction *
                        String(valueA).localeCompare(String(valueB), ["ru", "en"], {
                            caseFirst: "upper"
                        })
                    )
                case "date":
                    const dateA = new Date(valueA)
                    const dateB = new Date(valueB)
                    return direction * (dateA - dateB)
                default:
                    return 0
            }
        }
  
        this.data.sort(compareFn)
        this.sortedField = field
        this.sortedOrder = order
  
        this.updateHeaderSortUI(field, order)
        if (this.subElements.body)
            this.subElements.body.innerHTML = this.createTableBodyTemplate(this.data)
    }
  
    updateHeaderSortUI(field, order) {
        if (!this.subElements.header) return
  
        const allHeaderCells = this.subElements.header.querySelectorAll(
            ".sortable-table__cell[data-id]"
        )
        allHeaderCells.forEach((cell) => {
            cell.removeAttribute("data-order")
        })
        const currentHeaderCell = this.subElements.header.querySelector(
            `.sortable-table__cell[data-id="${field}"]`
        )
        if (currentHeaderCell && currentHeaderCell.dataset.sortable !== "false")
            currentHeaderCell.dataset.order = order
    }
  
    destroy() {
        this.element?.remove()
    }
}