<template>
  <div class="in-coder-panel">
    <textarea ref="textarea"></textarea>
    <el-select
      v-if="languageTool"
      class="code-mode-select"
      v-model="mode"
      @change="changeMode"
    >
      <el-option
        v-for="mode in modes"
        :key="mode.value"
        :label="mode.label"
        :value="mode.value"
      >
      </el-option>
    </el-select>
  </div>
</template>

<script>
// 引入全局实例
import _CodeMirror from 'codemirror';

// 核心样式
import 'codemirror/lib/codemirror.css';
// 引入主题后还需要在 options 中指定主题才会生效
import 'codemirror/theme/cobalt.css';

// 需要引入具体的语法高亮库才会有对应的语法高亮效果
// codemirror 官方其实支持通过 /addon/mode/loadmode.js 和 /mode/meta.js 来实现动态加载对应语法高亮库
// 但 vue 貌似没有无法在实例初始化后再动态加载对应 JS ，所以此处才把对应的 JS 提前引入
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/clike/clike.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/r/r.js';
import 'codemirror/mode/shell/shell.js';
import 'codemirror/mode/sql/sql.js';
import 'codemirror/mode/swift/swift.js';
import 'codemirror/mode/vue/vue.js';

// 尝试获取全局实例
const CodeMirror = window.CodeMirror || _CodeMirror;

function formatJson(val) {
  let res = '';
  try {
    res = JSON.stringify(JSON.parse(val), '', '\t');
  } catch {
    res = val;
  }
  return res;
}

export default {
  name: 'in-coder',
  props: {
    // 外部传入的内容，用于实现双向绑定
    value: String,
    // 外部传入的语法类型
    language: {
      type: String,
      default: null,
    },
    languageTool: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 内部真实的内容
      code: '',
      // 默认的语法类型
      mode: 'javascript',
      // 编辑器实例
      coder: null,
      // 默认配置
      options: {
        // 缩进格式
        tabSize: 2,
        // 主题，对应主题库 JS 需要提前引入
        theme: 'cobalt',
      },
      // 支持切换的语法高亮类型，对应 JS 已经提前引入
      // 使用的是 MIME-TYPE ，不过作为前缀的 text/ 在后面指定时写死了
      modes: [
        {
          value: 'css',
          label: 'CSS',
        },
        {
          value: 'javascript',
          label: 'Javascript',
        },
        {
          value: 'html',
          label: 'XML/HTML',
        },
        {
          value: 'x-java',
          label: 'Java',
        },
        {
          value: 'x-objectivec',
          label: 'Objective-C',
        },
        {
          value: 'x-python',
          label: 'Python',
        },
        {
          value: 'x-rsrc',
          label: 'R',
        },
        {
          value: 'x-sh',
          label: 'Shell',
        },
        {
          value: 'x-sql',
          label: 'SQL',
        },
        {
          value: 'x-swift',
          label: 'Swift',
        },
        {
          value: 'x-vue',
          label: 'Vue',
        },
        {
          value: 'markdown',
          label: 'Markdown',
        },
      ],
    };
  },
  mounted() {
    // 初始化
    this._initialize();
  },
  methods: {
    // 初始化
    _initialize() {
      this.coder = CodeMirror.fromTextArea(this.$refs.textarea, this.options);
      this.coder.setValue(formatJson(this.value));

      // 支持双向绑定
      this.coder.on('change', (coder) => {
        this.$emit('input', coder.getValue().replace(/\t/g, ''));
      });

      if (this.language) {
        let modeObj = this._getLanguage(this.language);

        if (modeObj) {
          this.mode = modeObj.label;
        }
      }
    },
    _getLanguage(language) {
      return this.modes.find((mode) => {
        let currentLanguage = language.toLowerCase();
        let currentLabel = mode.label.toLowerCase();
        let currentValue = mode.value.toLowerCase();

        return (
          currentLabel === currentLanguage || currentValue === currentLanguage
        );
      });
    },
    // 更改模式
    changeMode(val) {
      this.coder.setOption('mode', `text/${val}`);

      let label = this._getLanguage(val).label.toLowerCase();

      this.$emit('language-change', label);
    },
  },
};
</script>

<style lang="less">
.in-coder-panel {
  flex-grow: 1;
  display: flex;
  position: relative;
  .CodeMirror {
    flex-grow: 1;
    z-index: 1;
    .CodeMirror-code {
      line-height: 19px;
    }
  }

  .code-mode-select {
    position: absolute;
    z-index: 2;
    right: 10px;
    top: 10px;
    max-width: 130px;
  }
  .CodeMirror {
    height: 100%;
  }
}
</style>
