export default class SortableList {
    element
    draggedItem = null
    placeholder = null
    shiftX = 0
    shiftY = 0
  
    constructor({ items = [] } = {}) {
      this.items = items
      this.render()
      this.initEventListeners()
    }
  
    render() {
      this.element = document.createElement('ul')
      this.element.className = 'sortable-list'
  
      this.items.forEach(item => {
        item.classList.add('sortable-list__item')
        this.element.append(item)
      })
    }
  
    initEventListeners() {
      this.element.addEventListener('pointerdown', this.onPointerDown)
    }
  
    onPointerDown = (event) => {
      const grabHandle = event.target.closest('[data-grab-handle]')
      const deleteHandle = event.target.closest('[data-delete-handle]')
  
      if (deleteHandle) {
        event.preventDefault()
        const item = deleteHandle.closest('.sortable-list__item')
        if (item) {
          item.remove()
        }
      } else if (grabHandle) {
        event.preventDefault()
        const listItem = grabHandle.closest('.sortable-list__item')
        if (listItem) {
          this.dragStart(listItem, event)
        }
      }
    }
  
    dragStart(element, event) {
      this.draggedItem = element
      
      const { left, top, width, height } = element.getBoundingClientRect()
      
      this.shiftX = event.clientX - left
      this.shiftY = event.clientY - top
      
      this.draggedItem.style.width = `${width}px`
      this.draggedItem.style.height = `${height}px`
      
      this.createPlaceholder(width, height)
      
      this.moveDraggedElementTo(event.clientX, event.clientY)
      
      this.draggedItem.classList.add('sortable-list__item_dragging')
      
      document.addEventListener('pointermove', this.onPointerMove)
      document.addEventListener('pointerup', this.onPointerUp)
    }
  
    createPlaceholder(width, height) {
      this.placeholder = document.createElement('li')
      this.placeholder.className = 'sortable-list__placeholder'
      this.placeholder.style.width = `${width}px`
      this.placeholder.style.height = `${height}px`
      
      this.draggedItem.after(this.placeholder)
    }
    
    moveDraggedElementTo(clientX, clientY) {
      if (!this.draggedItem) return
      
      this.draggedItem.style.position = 'fixed'
      this.draggedItem.style.zIndex = '1000'
      this.draggedItem.style.left = `${clientX - this.shiftX}px`
      this.draggedItem.style.top = `${clientY - this.shiftY}px`
    }
  
    onPointerMove = (event) => {
      if (!this.draggedItem) return
      
      this.moveDraggedElementTo(event.clientX, event.clientY)
      
      this.draggedItem.style.visibility = 'hidden'
      
      const elementBelow = document.elementFromPoint(event.clientX, event.clientY)
      this.draggedItem.style.visibility = 'visible'
      
      if (!elementBelow) return
      
      const droppableItem = elementBelow.closest('.sortable-list__item')
      
      if (droppableItem && droppableItem !== this.draggedItem) {
        const { top, height } = droppableItem.getBoundingClientRect()
        const middleY = top + height / 2
        
        if (event.clientY < middleY) {
          droppableItem.before(this.placeholder)
        } else {
          droppableItem.after(this.placeholder)
        }
      }
    }
  
    onPointerUp = () => {
      if (!this.draggedItem) return
      
      this.placeholder.replaceWith(this.draggedItem)
      
      this.draggedItem.style.position = ''
      this.draggedItem.style.top = ''
      this.draggedItem.style.left = ''
      this.draggedItem.style.width = ''
      this.draggedItem.style.height = ''
      this.draggedItem.style.zIndex = ''
      this.draggedItem.classList.remove('sortable-list__item_dragging')
      
      this.draggedItem = null
      
      document.removeEventListener('pointermove', this.onPointerMove)
      document.removeEventListener('pointerup', this.onPointerUp)
    }
  
    remove() {
      if (this.element) {
        this.element.remove()
      }
    }
  
    destroy() {
      this.remove()
      document.removeEventListener('pointermove', this.onPointerMove)
      document.removeEventListener('pointerup', this.onPointerUp)
      this.element.removeEventListener('pointerdown', this.onPointerDown)
    }
  }