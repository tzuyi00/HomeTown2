<template>
  <div>
    <loading :active.sync="isLoading"></loading>
    <div class="d-flex mb-2">
      <h1 class="h5 mr-auto font-weight-bold">圖片儲存列表</h1>
      <div class>
        <button @click="openModal('new')" class="btn btn-sm btn-outline-dark px-5 font-weight-bold">
          <i class="fas fa-plus mr-1"></i>新增圖片
        </button>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col" width="20px">#</th>
              <th scope="col" width="110px">圖片縮圖</th>
              <th scope="col">網址</th>
              <th scope="col" class="text-center">編輯</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in storages" :key="item.id">
              <th scope="row">{{index + 1}}</th>
              <td>
                <img
                  :src="item.path"
                  width="100px"
                  class="img-fluid"
                >
              </td>
              <td style="max-width:200px">{{item.path}}</td>
              <td class="text-center">
                <div class="btn-group">
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="openModal('delete', item)"
                  >刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 元件中 emitPages() 透過 emit 向外傳遞我們點的分頁並觸發外層的 getProducts -->
        <Pagination :pages="pagination" @emit-pages="getStorages"></Pagination>

        <StorageModal  @update="getStorages" />

        <DeleteModal :temp-product="tempStorage" :del-name="delName" @update="getStorages" />
      </div>
    </div>
  </div>
</template>

<script>
/* global $ */
import Pagination from '@/components/Pagination.vue'
import DeleteModal from '@/components/backend/DeleteModal.vue'
import StorageModal from '@/components/backend/StorageModal.vue'

export default {
  name: 'Storages',
  components: {
    Pagination,
    DeleteModal,
    StorageModal
  },
  data () {
    return {
      isLoading: false,
      storages: [],
      tempStorage: [],
      pagination: {},
      isNew: false, // 判斷是新增(true)或編輯(false)。
      loadingBtn: '',
      delName: '圖片'
    }
  },
  created () {
    this.isLoading = true
    this.getStorages()
  },
  methods: {
    async getStorages (page = 1) {
      try {
        this.isLoading = true

        // 從 Supabase Storage 列出所有檔案
        const { data: files, error } = await this.$supabase
          .storage
          .from('site-assets')
          .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (error) throw error

        // 過濾掉系統檔案（.emptyFolderPlaceholder）
        const validFiles = files.filter(file =>
          file.name &&
          !file.name.startsWith('.') &&
          file.id
        )

        console.log('Valid files:', validFiles) // 除錯用

        // 轉換為前端需要的格式
        this.storages = validFiles.map(file => {
          const publicUrl = this.$supabase
            .storage
            .from('site-assets')
            .getPublicUrl(file.name)

          return {
            id: file.id,
            name: file.name,
            path: publicUrl.publicURL,
            created_at: file.created_at
          }
        })

        console.log('Transformed storages:', this.storages) // 除錯用

        // 暫時使用簡單的分頁（Supabase Storage 沒有內建的分頁資訊）
        this.pagination = {
          current_page: page,
          total_pages: Math.ceil(validFiles.length / 20) || 1,
          has_pre: page > 1,
          has_next: validFiles.length >= 20
        }

        this.isLoading = false
      } catch (error) {
        console.error('Error fetching storage:', error)
        this.$bus.$emit('message:push', `無法載入圖片列表: ${error.message}`, 'danger')
        this.isLoading = false
      }
    },
    openModal (modalStatus, item) {
      switch (modalStatus) {
        case 'new': {
          $('#storageModal').modal('show')
          break
        }
        case 'delete': {
          this.tempStorage = Object.assign({ ...item }) // 由於目前範本僅有一層物件，因此使用淺拷貝
          $('#delModal').modal('show')
          break
        }
        default: {
          break
        }
      }
    }
  }
}
</script>
