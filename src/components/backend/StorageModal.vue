<template>
  <div
    id="storageModal"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-m" role="document">
      <div class="modal-content border-0">
        <div class="modal-header bg-dark text-white">
          <h5 id="exampleModalLabel" class="modal-title">
            <span>上傳圖片</span>
          </h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="customFile">
              <span
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                v-if="fileUploading"
              ></span>
            </label>
            <input id="customFile" ref="file" type="file" class="form-control"
            @change="uploadFile" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* global $ */

export default {
  name: 'StorageModal',
  data () {
    return {
      fileUploading: false
    }
  },
  props: {},
  methods: {
    async uploadFile () {
      try {
        // 選取 DOM 中的檔案資訊
        const uploadedFile = this.$refs.file.files[0]

        if (!uploadedFile) {
          this.$bus.$emit('message:push', '請選擇檔案', 'info')
          return
        }

        // 檢查檔案大小（限制 2MB）
        if (uploadedFile.size > 2 * 1024 * 1024) {
          this.$bus.$emit('message:push', '上傳不可超過 2 MB', 'info')
          return
        }

        this.fileUploading = true

        // 生成唯一的檔案名稱（使用時間戳）
        const fileExt = uploadedFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`

        // 上傳到 Supabase Storage
        const { error } = await this.$supabase
          .storage
          .from('site-assets')
          .upload(fileName, uploadedFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        this.fileUploading = false
        this.$emit('update') // 更新畫面
        $('#storageModal').modal('hide')
        this.$bus.$emit('message:push', '圖片新增成功囉，好棒ヽ(＾Д＾)ﾉ ', 'success')

        // 清空檔案選擇
        this.$refs.file.value = ''
      } catch (error) {
        console.error('Upload error:', error)
        this.fileUploading = false
        this.$bus.$emit('message:push',
          `出現錯誤惹，好糗Σ( ° △ °|||)︴ ${error.message}`,
          'info')
      }
    }
  }
}
</script>
