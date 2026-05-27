import { h } from '../element';
import { cssPrefix } from '../../config';
import tooltip from '../tooltip';
import Item from './item';

export default class UnhideColumns extends Item {
  constructor() {
    super('unhideColumns');
    // 基类构造函数会尝试从locale获取tooltip，如果不存在则使用空字符串
    // 我们需要在基类构造函数之后重新设置tip
    this.tip = 'Unhide Columns';
    // 重新创建元素以应用新的tip
    this.el = this.element();
  }

  element() {
    const { tip } = this;
    const svgIcon = '<svg viewBox="0 0 24 24" width="18" height="18" style="display:block;margin:auto;" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><path d="M5 11h6v2H5z"/></svg>';
    return h('div', `${cssPrefix}-toolbar-btn`)
      .on('mouseenter', (evt) => {
        if (this.tip) tooltip(this.tip, evt.target);
      })
      .attr('data-tooltip', tip)
      .child(h('div', `${cssPrefix}-icon`).html(svgIcon))
      .on('click', () => this.change(this.tag));
  }

  onClick(data) {
    const { cols } = data;
    const hideCols = [];

    cols.each((col, i) => {
      if (cols.isHide(i)) {
        hideCols.push(i);
      }
    });

    if (hideCols.length > 0) {
      cols.show(hideCols);
      data.showColumns();
    }
  }
}
