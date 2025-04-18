class Tooltip {
  static instance = null
  element = null

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance
    }
    Tooltip.instance = this
    this.initialize()
  }

  initialize() {
    document.addEventListener("pointerover", this.handlePointerOver)
    document.addEventListener("pointerout", this.handlePointerOut)
  }

  render(text = "") {
    if (!this.element) {
      this.element = document.createElement("div")
      this.element.className = "tooltip"
      document.body.appendChild(this.element)
    }
    this.element.textContent = text
  }

  handlePointerOver = (event) => {
    const target = event.target.closest('[data-tooltip]')
    if (!target || !target.dataset.tooltip) return

    const tooltipText = target.dataset.tooltip
    this.render(tooltipText)

    const rect = target.getBoundingClientRect && target.getBoundingClientRect()
    if (
      rect &&
      typeof rect.left === "number" &&
      typeof rect.bottom === "number"
    ) {
      this.element.style.left = `${rect.left + window.scrollX}px`
      this.element.style.top = `${rect.bottom + window.scrollY + 5}px`
    } else {
      this.element.style.left = "0px"
      this.element.style.top = "0px"
    }
    this.element.style.opacity = "1"
  };

  handlePointerOut = (event) => {
    if (!this.element) return;
    this.element.style.opacity = "0"
  };

  destroy() {
    document.removeEventListener("pointerover", this.handlePointerOver)
    document.removeEventListener("pointerout", this.handlePointerOut)
    if (this.element) {
      this.element.remove()
      this.element = null
    }
    Tooltip.instance = null
  }
}

export default Tooltip