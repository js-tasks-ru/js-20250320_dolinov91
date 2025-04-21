import SortableList from '../2-sortable-list/index.js';
import ProductForm from '../../08-forms-fetch-api-part-2/1-product-form-v1/index.js';

export default class ProductFormV2 extends ProductForm {
  constructor(productId) {
    super(productId)
  }

  renderImagesList(images = []) {
    const items = images.map(image => this.getImageItem(image))
    
    const sortableList = new SortableList({
      items
    })
    
    this.subElements.imageListContainer.append(sortableList.element)
  }

  getImageItem(image) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = this.getImageItemTemplate(image)
    return wrapper.firstElementChild
  }

  initEventListeners() {
    super.initEventListeners()
    if (this.subElements.imageListContainer) {
      this.subElements.imageListContainer.removeEventListener('click', this.onImageDelete)
    }
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
        
        const imageItem = this.getImageItem(result)
        
        loadingImage.remove()
        
        const sortableList = imageListContainer.querySelector('.sortable-list')
        
        if (sortableList) {
          sortableList.append(imageItem)
        } else {
          this.renderImagesList([result])
        }
      } catch (error) {
        console.error('Ошибка загрузки изображения', error)
        loadingImage.remove()
      }
    })
    
    fileInput.click()
  }
}