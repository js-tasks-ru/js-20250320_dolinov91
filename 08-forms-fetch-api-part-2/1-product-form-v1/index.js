import escapeHtml from './utils/escape-html.js'
import fetchJson from './utils/fetch-json.js'

const IMGUR_CLIENT_ID = '28aaa2e823b03b1'
const BACKEND_URL = 'https://course-js.javascript.ru'

export default class ProductForm {
  element
  subElements = {}
  defaultFormData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    price: 100,
    discount: 0,
    images: []
  }

  constructor(productId) {
    this.productId = productId
  }

  async render() {
    const element = document.createElement('div')
    element.innerHTML = this.getFormTemplate()
    this.element = element.firstElementChild
    
    this.subElements = this.getSubElements()
    
    await this.initFormData()
    this.initEventListeners()
    
    return this.element
  }

  async initFormData() {
    const categoriesPromise = this.fetchCategories()
    const productPromise = this.productId
      ? this.fetchProductData(this.productId)
      : Promise.resolve([this.defaultFormData])

    const [categoriesData, productResponse] = await Promise.all([
      categoriesPromise,
      productPromise
    ])

    const [productData] = productResponse

    this.renderCategories(categoriesData)
    this.renderProductData(productData)
  }

  renderCategories(categoriesData) {
    const select = this.subElements.productForm.querySelector('[name="subcategory"]')
    
    for (const category of categoriesData) {
      for (const subcategory of category.subcategories) {
        select.append(new Option(`${category.title} > ${subcategory.title}`, subcategory.id))
      }
    }
  }

  renderProductData(productData) {
    const form = this.subElements.productForm
    const excludedFields = ['images']
    
    for (const [key, value] of Object.entries(productData)) {
      if (!excludedFields.includes(key)) {
        const input = form.querySelector(`#${key}`)
        if (input) {
          input.value = value
        }
      }
    }
    
    if (productData.images && productData.images.length) {
      this.subElements.imageListContainer.innerHTML = this.getImagesTemplate(productData.images)
    }
  }

  getImagesTemplate(images = []) {
    return `
      <ul class="sortable-list">
        ${images.map(image => this.getImageItemTemplate(image)).join('')}
      </ul>
    `
  }

  getImageItemTemplate({ url, source }) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item">
        <input type="hidden" name="url" value="${escapeHtml(url)}">
        <input type="hidden" name="source" value="${escapeHtml(source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle alt="grab">
          <img class="sortable-table__cell-img" alt="${escapeHtml(source)}" src="${escapeHtml(url)}">
          <span>${escapeHtml(source)}</span>
        </span>
        <button type="button" class="sortable-list__item-delete" data-delete-handle>
          <img src="icon-trash.svg" alt="delete">
        </button>
      </li>
    `
  }

  async save() {
    const formData = this.getFormData()
    
    try {
      const result = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      this.dispatchEvent(this.productId ? 'product-updated' : 'product-saved')
      
      return result
    } catch (error) {
      console.error('Ошбика сохранения продукта', error)
    }
  }

  getFormData() {
    const { productForm, imageListContainer } = this.subElements
    const excludedFields = ['images']
    const formatFields = [
      { name: 'price', type: 'number' },
      { name: 'quantity', type: 'number' },
      { name: 'discount', type: 'number' },
      { name: 'status', type: 'number' }
    ]
    
    const formData = {}
    
    for (const field of productForm.elements) {
      if (field.tagName === 'BUTTON') continue
      if (!excludedFields.includes(field.name)) {
        formData[field.name] = field.value
      }
    }
    
    for (const { name, type } of formatFields) {
      if (formData[name]) {
        formData[name] = type === 'number' ? Number(formData[name]) : formData[name]
      }
    }
    
    if (this.productId) {
      formData.id = this.productId
    }
    
    formData.images = []
    const images = imageListContainer.querySelectorAll('.sortable-list__item')
    
    for (const image of images) {
      const url = image.querySelector('[name="url"]').value
      const source = image.querySelector('[name="source"]').value
      
      formData.images.push({ url, source })
    }
    
    return formData
  }

  initEventListeners() {
    const { productForm } = this.subElements
    
    productForm.addEventListener('submit', this.onSubmit)
    
    const uploadImageButton = productForm.querySelector('[name="uploadImage"]')
    uploadImageButton.addEventListener('click', this.onUploadImage)
    
    this.subElements.imageListContainer.addEventListener('click', this.onImageDelete)
  }

  async fetchCategories() {
    return fetchJson(`${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`)
  }

  async fetchProductData(productId) {
    return fetchJson(`${BACKEND_URL}/api/rest/products?id=${productId}`)
  }

  async uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
        },
        body: formData,
        referrer: ''
      })
      
      return await response.json()
    } catch (error) {
      console.error('Не удалось загрузить изображение', error)
    }
  }

  onSubmit = async (event) => {
    event.preventDefault()
    await this.save()
  }

  onUploadImage = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files.length) return
      
      const [file] = fileInput.files
      
      if (!file.type.startsWith('image/')) {
        console.error('Пожалуйста выберите файл')
        return
      }
      
      const { imageListContainer } = this.subElements
      
      const loadingImage = document.createElement('span')
      loadingImage.textContent = 'Loading...'
      imageListContainer.append(loadingImage)
      
      try {
        const { data } = await this.uploadImage(file)
        
        const result = {
          url: data.link,
          source: file.name
        }
        
        const imageItem = document.createElement('div')
        imageItem.innerHTML = this.getImageItemTemplate(result)
        
        loadingImage.remove()
        
        if (imageListContainer.querySelector('.sortable-list')) {
          imageListContainer.querySelector('.sortable-list').append(imageItem.firstElementChild)
        } else {
          imageListContainer.innerHTML = this.getImagesTemplate([result])
        }
      } catch (error) {
        console.error('Ошибка загрузки изображения', error)
        loadingImage.remove()
      }
    })
    
    fileInput.click()
  }

  onImageDelete = (event) => {
    const deleteButton = event.target.closest('[data-delete-handle]')
    
    if (deleteButton) {
      const imageItem = deleteButton.closest('.sortable-list__item')
      imageItem.remove()
    }
  }

  getFormTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required type="text" id="title" name="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required id="description" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer"></div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select id="subcategory" class="form-control" name="subcategory"></select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required type="number" id="price" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required type="number" id="discount" name="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required type="number" id="quantity" class="form-control" name="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select id="status" class="form-control" name="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>
    `
  }

  getSubElements() {
    const result = {}
    const elements = this.element.querySelectorAll('[data-element]')
    
    for (const subElement of elements) {
      const name = subElement.dataset.element
      result[name] = subElement
    }
    
    return result
  }

  dispatchEvent(eventName) {
    this.element.dispatchEvent(new CustomEvent(eventName))
  }

  remove() {
    if (this.element) {
      this.element.remove()
    }
  }

  destroy() {
    this.remove()

    const { productForm } = this.subElements
    if (productForm) {
      productForm.removeEventListener('submit', this.onSubmit)
      const uploadImageButton = productForm.querySelector('[name="uploadImage"]')
      if (uploadImageButton) {
        uploadImageButton.removeEventListener('click', this.onUploadImage)
      }
    }
  }
}