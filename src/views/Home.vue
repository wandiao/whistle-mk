<template>
  <div class="container">
    <div class="menu">
      <div class="item" @click="handleShowAdd">
        <i class="el-icon-plus"></i>新增接口
      </div>
      <div class="item" @click="handleRefresh">
        <i class="el-icon-refresh-right"></i>刷新
      </div>
      <div class="item" @click="handleClear">
        <i class="el-icon-delete"></i>清空数据
      </div>
    </div>
    <div class="inner">
      <div class="left">
        <el-tree
          :data="apis"
          :props="{ label: 'name', children: 'apis' }"
          @node-click="handleNodeClick"
          node-key="name"
        >
          <span class="custom-tree-node" slot-scope="{ node }">
            <span>{{ node.label | decode }}</span>
          </span>
        </el-tree>
      </div>
      <div class="right" v-if="currApi">
        <div class="pb-10">
          <div class="flex-sb">
            <div>接口名称：{{ currApi.name | decode }}</div>
            <el-button
              v-if="currApi.data.historyList && currApi.data.historyList.length"
              @click="showHistory = true"
              type="primary"
              >查看mock记录</el-button
            >
          </div>
          <div class="flex mt-15">
            <div class="flex">
              <b>是否启用：</b>
              <el-switch
                @change="changeStatus"
                v-model="currApi.data.mock"
                active-color="#13ce66"
                inactive-color="#ff4949"
              >
              </el-switch>
            </div>
            <div class="flex ml-15">
              <b>请求延迟：</b>
              <el-input
                placehoder="单位（ms）"
                @change="changeData"
                size="small"
                style="width: 120px"
                v-model="currApi.data.delay"
              ></el-input>
            </div>
          </div>
        </div>
        <Editor v-model="currApi.data.res.body" class="editor"></Editor>
      </div>
    </div>
    <el-dialog title="mock记录" :visible.sync="showHistory" width="50%">
      <el-collapse v-if="currApi" v-model="activeName" accordion>
        <el-collapse-item
          v-for="(item, index) in currApi.data.historyList"
          :title="item.lastTime"
          :key="index"
          :name="index"
        >
          <template slot="title">
            <div class="flex-sb pr-10" style="width: 100%">
              <span>{{ item.lastTime }}</span>
              <el-button
                @click.stop="useHistory(item)"
                type="primary"
                size="small"
                >使用此数据</el-button
              >
            </div>
          </template>
          <div style="max-height: 200px; overflow: auto">
            {{ item.data }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-dialog>
    <el-dialog title="新增接口" :visible.sync="showAdd" width="30%">
      <el-form
        ref="form"
        :rules="addRules"
        :model="addForm"
        label-width="100px"
      >
        <el-form-item prop="host" label="接口域名">
          <el-select
            style="width: 100%"
            v-model="addForm.host"
            placeholder="请选择接口域名"
          >
            <el-option
              v-for="item in apis"
              :label="item.name"
              :value="item.name"
              :key="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="api" label="接口名称">
          <el-input
            v-model="addForm.api"
            placeholder="请输入接口名称"
          ></el-input>
        </el-form-item>
        <el-form-item prop="body" label="接口返回值">
          <el-input
            type="textarea"
            v-model="addForm.body"
            placeholder="请输入接口返回值"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handlAddApi">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import Editor from '@/components/editor';
import { getFormatDate } from '@/utils';
import { setTimeout } from 'timers';

export default {
  name: 'Home',
  components: {
    Editor,
  },
  data: function () {
    return {
      apis: [],
      currApi: '',
      showHistory: false,
      activeName: '1',
      showAdd: false,
      addForm: {},
      addRules: {
        host: [
          { required: true, message: '请选择接口域名', trigger: 'change' },
        ],
        api: [{ required: true, message: '请填写接口名称', trigger: 'blur' }],
      },
    };
  },
  computed: {
    displayApi() {
      return this.apis.map((i) => {
        i.label = i.name;
        i.children = i.apis.map((i) => {
          i.label = i.name;
        });
        return i;
      });
    },
  },
  filters: {
    decode(val) {
      return decodeURIComponent(val);
    },
  },
  created() {
    this.getData();
  },
  mounted() {
    document.addEventListener('keydown', (e) => {
      if (
        e.keyCode == 83 &&
        (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
        if (this.currApi) {
          this.changeData();
        }
      }
    });
  },
  methods: {
    changeStatus(e) {
      if (!e) {
        const { currApi } = this;
        const data = currApi.data.res.body;
        // 保存历史记录
        const history = {
          data,
          lastTime: getFormatDate('yyyy-MM-dd HH:mm:ss', new Date()),
        };
        currApi.data.historyList = [
          history,
          ...(currApi.data.historyList || []),
        ].slice(0, 3);
      }
      this.changeData();
    },
    changeData() {
      const item = this.currApi;
      axios
        .post('api/modify', {
          host: item.data.req.headers.host,
          api: item.name,
          body: item.data,
        })
        .then(() => {
          this.$message.success('保存成功');
        });
    },
    async getData() {
      const { data } = await axios.get('api/list');
      this.apis = data;
    },
    async handleRefresh() {
      await this.getData();
      this.currApi = null;
      // if (this.currApi) {
      //   const currHost = this.apis.find(
      //     (i) => i.name == this.currApi.data.req.headers.host
      //   );
      //   if (currHost) {
      //     const curr = currHost.apis.find((i) => i.name == this.currApi.name);
      //     if (curr) {
      //       this.currApi = null;
      //       setTimeout(() => {
      //         this.currApi = curr;
      //       });
      //     }
      //   }
      // }
    },
    handleNodeClick(e) {
      if (e.data) {
        this.currApi = null;
        setTimeout(() => {
          this.currApi = e;
        });
      }
    },
    useHistory(item) {
      const tmp = { ...this.currApi };
      tmp.data.res.body = item.data;
      this.currApi = null;
      setTimeout(() => {
        this.currApi = tmp;
      });
      this.showHistory = false;
    },
    handleShowAdd() {
      this.addForm = {};
      this.showAdd = true;
    },
    handleClear() {
      axios.post('api/clear').then(() => {
        this.apis = [];
        this.currApi = null;
      });
    },
    async handlAddApi() {
      await this.$refs.form.validate();
      const { addForm, apis } = this;
      const currHost = apis.find((i) => i.name == addForm.host);
      const existInfo = currHost && currHost.apis[0];
      if (existInfo) {
        const body = {
          req: existInfo.data.req,
          res: {
            body: addForm.body || '',
          },
          mock: false,
          delay: '',
        };
        axios
          .post('api/modify', {
            host: addForm.host,
            api: addForm.api,
            body,
          })
          .then(() => {
            this.getData();
            this.$message.success('保存成功');
            this.showAdd = false;
          });
      } else {
        this.$message.error('无存在接口，无法新增');
      }
    },
  },
};
</script>
<style lang="less">
.container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  .menu {
    display: flex;
    height: 28px;
    line-height: 28px;
    border-top: 1px solid #fcfcfc;
    border-bottom: 1px solid #ccc;
    background: #f1f3f4;
    position: relative;
    z-index: 1001;
    color: #000;
    padding: 0 10px;
    overflow: auto;
    font-size: 12px;
    flex-shrink: 0;
    .item {
      color: #000;
      padding: 0 5px;
      height: 26px;
      margin-right: 5px;
      display: flex;
      align-items: center;
      cursor: pointer;
      i {
        margin-right: 3px;
        font-size: 14px;
      }
    }
  }
  .inner {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .left {
    position: relative;
    width: 250px;
    height: 100%;
    overflow: auto;
    padding-right: 15px;
    border-right: 1px solid #ccc;
    flex-shrink: 0;
  }
  .right {
    flex: 1;
    padding: 15px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    overflow: auto;
    .editor {
      flex: 1;
      overflow: auto;
      background: #002240;
    }
  }
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
</style>
