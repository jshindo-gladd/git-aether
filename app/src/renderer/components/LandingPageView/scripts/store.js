import Vue from 'vue';

const emptyData = {
  rep: null,
  github: '',
  index: 0,
  pathName: '',
  // diffSummary: null,
  // hasDiff: false,
  statusSummary: null,
  hasChanges: false,
  localBranches: [],
  trackingBranches: [],
  logText: '',
  isFetching: false,
};

export default new Vue({
  data: {
    tableData: [],
    commandList: JSON.parse(localStorage.getItem('commandList')) || [],
  },
  methods: {
    /**
     * リポジトリの配列からtableDataを作成する
     * @public
     * @param {array} repos リポジトリの配列
     */
    initTable(repos) {
      const tableData = repos.map((rep, i) => Object.assign({}, emptyData, rep, {
        index: i,
      }));

      this.$set(this, 'tableData', tableData);
    },

    /**
     * ブランチを取得してリストを更新する
     * @public
     * @param {number} i リポジトリの番号
     * @return {promise}
     */
    getBranch(i) {
      return new Promise((resolve) => {
        this.tableData[i].rep.branch((err, sm) => {
          if (!err) {
            const localBranches = [];
            const trackingBranches = [];

            Object.values(sm.branches).forEach((branch) => {
              if (branch.name.substr(0, 8) === 'remotes/') {
                branch.name = branch.name.substr(8);
                trackingBranches.push(branch);
              } else {
                localBranches.push(branch);
              }
            });

            this.$set(this.tableData[i], 'localBranches', localBranches);
            this.$set(this.tableData[i], 'trackingBranches', trackingBranches);
          }

          resolve();
        });
      });
    },

    /**
     * 全リポジトリでgetBranchを実行する
     * @public
     * @return {promise}
     */
    getBranchAll() {
      return this.tableData.map((v, i) => this.getBranch(i));
    },

    /**
     * ローカルブランチを取得してリストを更新する
     * @public
     * @param {number} i リポジトリの番号
     * @return {promise}
     */
    getBranchLocal(i) {
      return new Promise((resolve) => {
        this.tableData[i].rep.branchLocal((err, sm) => {
          if (!err) {
            this.$set(this.tableData[i], 'localBranches', sm.branches);
          }

          resolve();
        });
      });
    },

    // /**
    //  * diffの有無を確認する
    //  * @public
    //  * @param {number} i リポジトリの番号
    //  * @return {promise}
    //  */
    // diffSummary(i) {
    //   return new Promise((resolve) => {
    //     this.tableData[i].rep.diffSummary((err, sm) => {
    //       if (!err) {
    //         this.tableData[i].diffSummary = sm;
    //         this.tableData[i].hasDiff = !!sm.files.length;
    //       }
    //
    //       resolve();
    //     });
    //   });
    // },

    // /**
    //  * 全リポジトリでdiffを実行する
    //  * @public
    //  * @return {promise}
    //  */
    // diffSummaryAll() {
    //   return this.tableData.map((v, i) => this.diffSummary(i));
    // },

    /**
     * fetchしてログを更新する
     * @public
     * @param {number} i リポジトリの番号
     * @return {promise}
     */
    fetch(i) {
      return new Promise((resolve) => {
        this.tableData[i].isFetching = true;
        this.tableData[i].logText = '';

        this.tableData[i].rep.fetch({
          '--all': null,
          '--prune': null,
        }, (err, sm) => {
          if (!err) {
            this.tableData[i].logText = sm.raw;
            this.getBranch(i);
          }

          this.tableData[i].isFetching = false;
          resolve();
        });
      });
    },

    /**
     * 全リポジトリでfetchを実行する
     * @public
     * @return {promise}
     */
    fetchAll() {
      return this.tableData.map((v, i) => (
        setTimeout(() => {
          this.fetch(i);
        }, i * 800)
      ));
    },

    /**
     * statusを取得
     * @public
     * @param {number} i リポジトリの番号
     * @return {promise}
     */
    status(i) {
      return new Promise((resolve) => {
        this.tableData[i].rep.status((err, sm) => {
          if (!err) {
            this.tableData[i].statusSummary = sm;
            this.tableData[i].hasChanges = !!sm.files.length;
          }

          resolve();
        });
      });
    },

    /**
     * 全リポジトリでdiffを実行する
     * @public
     * @return {promise}
     */
    statusAll() {
      return this.tableData.map((v, i) => this.status(i));
    },
  },
  created() {
    window.addEventListener('focus', () => {
      this.getBranchAll();
      this.statusAll();
    });
  },
});
