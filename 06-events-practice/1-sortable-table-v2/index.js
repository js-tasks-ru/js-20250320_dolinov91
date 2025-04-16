import SortableTableV1 from '../../05-dom-document-loading/2-sortable-table-v1/index.js'

export default class SortableTable extends SortableTableV1 {
    _headerClickHandler = null

    constructor(
        headerConfig = [],
        {
            data = [],
            sorted = {
                id: headerConfig.find((item) => item.sortable === true)?.id,
                order: 'asc'
            },
            isSortLocally = true
        } = {}
    ) {
        super(headerConfig, data)
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
            this.sortedOrder = this.sortedField ? 'asc' : null
        }

        this.render()
    }

    render() {
        super.render()
        if (this.sortedField && this.sortedOrder)
            this.sort(this.sortedField, this.sortedOrder)
        else
            this.updateTableBodyUI(this.data)
        this.addEventListeners()
    }

    createTableHeaderTemplate() {
        return this.headerConfig
            .map((columnConfig) => {
                const isSortable = columnConfig.sortable === true
                const arrowSpan = isSortable
                    ? `<span data-element="arrow" class="sortable-table__sort-arrow">
                         <span class="sort-arrow"></span>
                       </span>`
                    : ''
                const sortableAttr = `data-sortable="${isSortable}"`
                const orderAttr =
                    isSortable && columnConfig.id === this.sortedField
                        ? `data-order="${this.sortedOrder}"`
                        : ''

                return `
                    <div class="sortable-table__cell" data-id="${columnConfig.id}" ${sortableAttr} ${orderAttr}>
                        <span>${columnConfig.title}</span>
                        ${arrowSpan}
                    </div>
                `
            })
            .join('')
    }

    createTableBodyTemplate(dataToRender) {
        if (!dataToRender || dataToRender.length === 0) {
            this.element?.classList.add('sortable-table_empty')
            return ''
        }
        this.element?.classList.remove('sortable-table_empty')
        return super.createTableBodyTemplate(dataToRender)
    }

    sort(field, order) {
        if (order !== 'asc' && order !== 'desc')
            order = 'asc'

        const columnConfig = this.headerConfig.find((conf) => conf.id === field)
        if (!columnConfig || columnConfig.sortable !== true)
            return

        this.sortedField = field
        this.sortedOrder = order
        this.sorted = { id: field, order }

        this.updateHeaderSortUI(field, order)

        if (this.isSortLocally)
            this.sortOnClient(field, order, columnConfig)
        else
            this.sortOnServer(field, order)
    }

    sortOnClient(field, order, columnConfig) {
        const sortType = columnConfig.sortType
        const directions = { asc: 1, desc: -1 }
        const direction = directions[order]

        this.data.sort((a, b) => {
            const valueA = a[field]
            const valueB = b[field]

            switch (sortType) {
                case 'number':
                    const numA = parseFloat(valueA)
                    const numB = parseFloat(valueB)
                    const aIsNaN = isNaN(numA)
                    const bIsNaN = isNaN(numB)
                    if (aIsNaN && bIsNaN) return 0
                    if (aIsNaN) return -1 * direction
                    if (bIsNaN) return 1 * direction
                    return direction * (numA - numB)

                case 'date':
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

                case 'string':
                default:
                    const stringA = String(valueA ?? '')
                    const stringB = String(valueB ?? '')
                    return (
                        direction *
                        stringA.localeCompare(stringB, ['ru', 'en'], {
                            caseFirst: 'upper'
                        })
                    )
            }
        })

        this.updateTableBodyUI(this.data)
    }

    sortOnServer(field, order) {
        this.element?.classList.add('sortable-table_loading')
        setTimeout(() => {
            this.element?.classList.remove('sortable-table_loading')
        }, 500)
    }

    updateTableBodyUI(dataToRender) {
        if (this.subElements.body)
            this.subElements.body.innerHTML = this.createTableBodyTemplate(dataToRender)
        if (!dataToRender || dataToRender.length === 0)
            this.element?.classList.add('sortable-table_empty')
        else
            this.element?.classList.remove('sortable-table_empty')
    }

    handleHeaderClick(event) {
        const headerCell = event.target.closest(
            '.sortable-table__cell[data-sortable="true"]'
        )
        if (!headerCell) return

        const field = headerCell.dataset.id
        const isCurrentSortField = field === this.sortedField
        const newOrder = isCurrentSortField
            ? this.sortedOrder === 'asc'
                ? 'desc'
                : 'asc'
            : 'desc'

        this.sort(field, newOrder)
    }

    addEventListeners() {
        this.removeEventListeners()
        this._headerClickHandler = this.handleHeaderClick.bind(this)
        this.subElements.header?.addEventListener(
            'pointerdown',
            this._headerClickHandler
        )
    }

    removeEventListeners() {
        if (this._headerClickHandler && this.subElements.header)
            this.subElements.header.removeEventListener(
                'pointerdown',
                this._headerClickHandler
            )
    }

    destroy() {
        this.removeEventListeners()
        super.destroy()
    }
}