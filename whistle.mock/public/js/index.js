const app = new Vue({
  el: '#app',
  data: {
    apis: [],
    currHost: '',
    currApi: '',
  },
  computed: {
    currApis() {
      return this.apis.find((i) => i.name === this.currHost);
    },
  },
  filters: {
    formatJson(val) {
      let res = '';
      try {
        res = JSON.stringify(JSON.parse(val), '', '\t');
      } catch {
        res = val;
      }
      return res;
    },
    decode(val) {
      return decodeURIComponent(val);
    },
  },
  created() {
    this.getData();
  },
  methods: {
    changeData(item) {
      axios
        .post('api/modify', {
          host: this.currHost,
          api: item.name,
          body: item.data,
        })
        .then((res) => {
          console.log(res);
        });
    },
    getData() {
      axios.get('api/list').then((res) => {
        this.apis = res.data;
        if (this.apis.length && !this.currHost) {
          this.currHost = this.apis[0].name;
        }
      });
    },
  },
});
