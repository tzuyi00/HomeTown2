<template>
  <div id="productModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
  aria-hidden="true">
  <loading :active.sync="isLoading"></loading>
    <div class="modal-dialog modal-xl" role="document">
      <div class="modal-content border-0">
        <div class="modal-header bg-dark text-white">
            <h5 id="exampleModalLabel" class="modal-title">
            <span>新增產品</span>
            </h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            <div class="row">
            <div class="col-sm-4 position-relative">
                <span id="requireIcon"
                class="text-danger position-absolute"
                v-if="isNew">*</span>
                <div v-for="i in 5" :key="i + 'img'" class="form-group">
                  <label :for="'img' + i">輸入圖片網址</label>
                  <input :id="'img' + i" v-model="localProduct.imageUrl[i - 1]" type="text" class="form-control"
                      placeholder="請輸入圖片連結">
                </div>
                <div class="form-group">
                  <label for="customFile">
                      或 上傳圖片
                      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
                      v-if="status.fileUploading"></span>
                  </label>
                  <input id="customFile" ref="file" type="file" class="form-control" @change="uploadFile">
                </div>
                <img class="img-fluid" :src="localProduct.imageUrl[0]" alt />
            </div>
            <div class="col-sm-8">
              <span class="text-danger float-right" v-if="isNew">*必填</span>
              <div class="form-group">
                <label for="title">標題</label>
                <span class="text-danger ml-1"
                v-if="isNew">*</span>
                <input id="title" v-model="localProduct.title" type="text" class="form-control" placeholder="請輸入標題"
                    required>
              </div>

              <div class="form-row">
                <div class="form-group col-md-6">
                    <label for="category">分類</label>
                    <span class="text-danger ml-1"
                    v-if="isNew">*</span>
                    <input id="category" v-model="localProduct.category" type="text" class="form-control"
                    placeholder="請輸入分類" required>
                </div>
                <div class="form-group col-md-6">
                    <label for="price">單位</label>
                    <input id="unit" v-model="localProduct.unit" type="unit" class="form-control" placeholder="請輸入單位">
                </div>
                </div>

                <div class="form-row">
                <div class="form-group col-md-6">
                    <label for="origin_price">原價</label>
                    <input id="origin_price" v-model="localProduct.origin_price" type="number" class="form-control"
                    placeholder="請輸入原價">
                </div>
                <div class="form-group col-md-6">
                    <label for="price">售價</label>
                    <input id="price" v-model="localProduct.price" type="number" class="form-control"
                    placeholder="請輸入售價">
                </div>
                </div>
                <hr>

                <div class="form-group">
                <label for="description">產品說明</label>
                <span class="text-danger ml-1"
                v-if="isNew">*</span>
                <textarea id="description" v-model="localProduct.description" type="text" class="form-control"
                    placeholder="請輸入產品說明" required>
            </textarea>
                </div>
                <div class="form-group">
                <label for="content">產品描述</label>
                <span class="text-danger ml-1"
                v-if="isNew">*</span>
                <textarea id="content" v-model="localProduct.content" type="text" class="form-control"
                    placeholder="請輸入產品描述" required>
            </textarea>
                </div>
                <div class="form-group">
                <div class="form-check">
                    <input id="enabled" v-model="localProduct.enabled" class="form-check-input" type="checkbox">
                    <label class="form-check-label" for="enabled">是否啟用</label>
                </div>
                </div>
            </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">
            取消
            </button>
            <button type="button" class="btn btn-primary" @click="updateProduct">
            確認
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  #requireIcon{
    left: 114px;
  }
</style>

<script>
/* global $ */

export default {
  name: 'ProductModal',
  props: {
    tempProduct: {
      imageUrl: []
    },
    status: {},
    isNew: Boolean
  },
  data () {
    return {
      isLoading: false,
      localProduct: { ...this.tempProduct }, // 商品本體
      localStatus: this.status // 狀態
    }
  },
  methods: {
    async updateProduct () {
      try {
        this.isLoading = true

        // 驗證必填項目
        if (!this.localProduct.title || !this.localProduct.category || !this.localProduct.description) {
          throw new Error('必填項目沒填唷！')
        }

        let status = ''

        if (this.isNew) {
          // 新增商品 - 使用 Supabase insert
          const { error } = await this.$supabase
            .from('products')
            .insert({
              title: this.localProduct.title,
              category: this.localProduct.category,
              description: this.localProduct.description,
              content: this.localProduct.content || '',
              price: parseFloat(this.localProduct.price) || 0,
              origin_price: parseFloat(this.localProduct.origin_price) || 0,
              imageUrl: this.localProduct.imageUrl || [],
              enabled: this.localProduct.enabled || false,
              unit: this.localProduct.unit || ''
            })

          if (error) throw error
          status = '新增成功囉，好棒ヽ(＾Д＾)ﾉ '
        } else {
          // 編輯商品 - 使用 Supabase update
          const { error } = await this.$supabase
            .from('products')
            .update({
              title: this.localProduct.title,
              category: this.localProduct.category,
              description: this.localProduct.description,
              content: this.localProduct.content || '',
              price: parseFloat(this.localProduct.price) || 0,
              origin_price: parseFloat(this.localProduct.origin_price) || 0,
              imageUrl: this.localProduct.imageUrl || [],
              enabled: this.localProduct.enabled || false,
              unit: this.localProduct.unit || ''
            })
            .eq('id', this.localProduct.id)

          if (error) throw error
          status = '更新成功囉，好棒ヽ(＾Д＾)ﾉ '
        }

        this.isLoading = false
        $('#productModal').modal('hide')
        this.$bus.$emit('message:push', status, 'success')
        this.$emit('update') // 更新畫面
      } catch (error) {
        this.isLoading = false
        this.$bus.$emit('message:push', error.message || '必填項目沒填唷！', 'info')
      }
    },
    async uploadFile () {
      try {
        // 選取 DOM 中的檔案資訊
        const uploadedFile = this.$refs.file.files[0]

        if (!uploadedFile) return

        // 驗證檔案大小 (2MB)
        if (uploadedFile.size > 2 * 1024 * 1024) {
          throw new Error('上傳不可超過 2 MB')
        }

        this.localStatus.fileUploading = true

        // 生成唯一的檔案名稱
        const fileName = `${Date.now()}-${uploadedFile.name}`

        // 上傳到 Supabase Storage
        const { error } = await this.$supabase.storage
          .from('product-images')
          .upload(`products/${fileName}`, uploadedFile)

        if (error) throw error

        // 獲取公開 URL
        const { data: { publicUrl } } = this.$supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${fileName}`)

        this.localProduct.imageUrl.push(publicUrl)
        this.localStatus.fileUploading = false
      } catch (error) {
        console.error('Upload error:', error)
        this.$bus.$emit('message:push', error.message || '上傳不可超過 2 MB', 'info')
        this.localStatus.fileUploading = false
      }
    }
  }
}
</script>
