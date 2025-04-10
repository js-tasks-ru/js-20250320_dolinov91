export default class DoubleSlider {
  constructor({
    min,
    max,
    formatValue = (value) => value,
    selected = {},
  } = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = {
      from: selected.from || min,
      to: selected.to || max,
    }
    this.element = null
    this.subElements = {}
    this.activeThumb = null

    this.render()
    this.initEventListeners()
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = this.getTemplate()
    this.element = wrapper.firstElementChild

    this.subElements = {
      inner: this.element.querySelector(".range-slider__inner"),
      progress: this.element.querySelector(".range-slider__progress"),
      thumbLeft: this.element.querySelector(".range-slider__thumb-left"),
      thumbRight: this.element.querySelector(".range-slider__thumb-right"),
      from: this.element.querySelector('span[data-element="from"]'),
      to: this.element.querySelector('span[data-element="to"]'),
    }

    this.update()
  }

  getTemplate() {
    return `
            <div class="range-slider">
                <span data-element="from">${this.formatValue(
                  this.selected.from
                )}</span>
                <div class="range-slider__inner">
                    <span class="range-slider__progress"></span>
                    <span class="range-slider__thumb-left"></span>
                    <span class="range-slider__thumb-right"></span>
                </div>
                <span data-element="to">${this.formatValue(
                  this.selected.to
                )}</span>
            </div>
        `
  }

  update() {
    const range = this.max - this.min;
    const leftPercent = ((this.selected.from - this.min) / range) * 100
    const rightPercent = 100 - ((this.selected.to - this.min) / range) * 100

    this.subElements.thumbLeft.style.left = `${leftPercent}%`
    this.subElements.thumbRight.style.right = `${rightPercent}%`
    this.subElements.progress.style.left = `${leftPercent}%`
    this.subElements.progress.style.right = `${rightPercent}%`

    this.subElements.from.textContent = this.formatValue(this.selected.from)
    this.subElements.to.textContent = this.formatValue(this.selected.to)
  }

  initEventListeners() {
    this.subElements.thumbLeft.addEventListener(
      "pointerdown",
      this.onThumbPointerDown
    );
    this.subElements.thumbRight.addEventListener(
      "pointerdown",
      this.onThumbPointerDown
    )
  }

  onThumbPointerDown = (event) => {
    event.preventDefault()
    this.activeThumb = event.target
    this.element.classList.add("range-slider_dragging")

    document.addEventListener("pointermove", this.onThumbPointerMove)
    document.addEventListener("pointerup", this.onThumbPointerUp, {
      once: true,
    })
  }

  onThumbPointerMove = (event) => {
    event.preventDefault()

    const { left, width } = this.subElements.inner.getBoundingClientRect()
    const position = event.clientX - left
    const percent = Math.max(0, Math.min(100, (position / width) * 100))
    const range = this.max - this.min
    const value = Math.round((percent / 100) * range + this.min)

    if (this.activeThumb === this.subElements.thumbLeft) {
      this.selected.from = Math.min(value, this.selected.to)
    } else {
      this.selected.to = Math.max(value, this.selected.from)
    }

    this.update()
  };

  onThumbPointerUp = () => {
    this.element.classList.remove("range-slider_dragging")
    document.removeEventListener("pointermove", this.onThumbPointerMove)

    this.element.dispatchEvent(
      new CustomEvent("range-select", {
        detail: {
          from: this.selected.from,
          to: this.selected.to,
        },
      })
    )

    this.activeThumb = null
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
    document.removeEventListener("pointermove", this.onThumbPointerMove)
    document.removeEventListener("pointerup", this.onThumbPointerUp)
  }
}
