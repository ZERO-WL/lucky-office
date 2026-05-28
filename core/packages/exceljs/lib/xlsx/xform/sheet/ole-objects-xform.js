const BaseXform = require('../base-xform');

class OleObjectXform extends BaseXform {
  get tag() {
    return 'oleObject';
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, {
      shapeId: model.shapeId,
      progId: model.progId,
      'r:id': model.rId,
      dvAspect: model.dvAspect,
    });
  }

  parseOpen(node) {
    if (node.name === this.tag) {
      this.model = {
        shapeId: parseInt(node.attributes.shapeId, 10),
        progId: node.attributes.progId,
        rId: node.attributes['r:id'],
        dvAspect: node.attributes.dvAspect,
      };
      return true;
    }
    if (node.name === 'objectPr') {
      if (this.model) {
        this.model.iconRId = node.attributes['r:id'];
        this.model.defaultSize = node.attributes.defaultSize;
      }
      return true;
    }
    if (node.name === 'anchor') {
      this._inAnchor = true;
      this._anchorData = {};
      return true;
    }
    if (this._inAnchor) {
      if (node.name === 'from' || node.name === 'to') {
        this._anchorDirection = node.name;
        this._anchorData[node.name] = {};
        return true;
      }
      if (node.name === 'xdr:col' || node.name === 'col') {
        this._readingCol = true;
        return true;
      }
      if (node.name === 'xdr:row' || node.name === 'row') {
        this._readingRow = true;
        return true;
      }
    }
    return false;
  }

  parseText(text) {
    if (this._readingCol && this._anchorDirection && this._anchorData[this._anchorDirection]) {
      this._anchorData[this._anchorDirection].col = parseInt(text, 10);
    }
    if (this._readingRow && this._anchorDirection && this._anchorData[this._anchorDirection]) {
      this._anchorData[this._anchorDirection].row = parseInt(text, 10);
    }
  }

  parseClose(name) {
    if (name === 'xdr:col' || name === 'col') {
      this._readingCol = false;
      return true;
    }
    if (name === 'xdr:row' || name === 'row') {
      this._readingRow = false;
      return true;
    }
    if (name === 'from' || name === 'to') {
      this._anchorDirection = null;
      return true;
    }
    if (name === 'anchor') {
      this._inAnchor = false;
      if (this.model && this._anchorData.from) {
        this.model.anchor = this._anchorData;
      }
      return true;
    }
    if (name === 'objectPr') {
      return true;
    }
    if (name === this.tag) {
      return false;
    }
    return true;
  }
}

class OleObjectsXform extends BaseXform {
  get tag() {
    return 'oleObjects';
  }

  constructor() {
    super();
    this.oleObjectXform = new OleObjectXform();
  }

  render(xmlStream, model) {
    if (model && model.length) {
      xmlStream.openNode(this.tag);
      model.forEach(oleObject => {
        this.oleObjectXform.render(xmlStream, oleObject);
      });
      xmlStream.closeNode();
    }
  }

  parseOpen(node) {
    // 处理 mc:AlternateContent 嵌套：只解析 mc:Choice，跳过 mc:Fallback
    if (node.name === 'mc:Fallback' || node.name === 'Fallback') {
      this._inFallback = true;
      return true;
    }
    if (this._inFallback) {
      // 在 Fallback 内，跳过所有内容
      return true;
    }
    
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.model = [];
        return true;
      case 'oleObject':
        this.parser = this.oleObjectXform;
        this.parser.parseOpen(node);
        return true;
      case 'mc:AlternateContent':
      case 'mc:Choice':
      case 'AlternateContent':
      case 'Choice':
        return true;
      default:
        return false;
    }
  }

  parseText(text) {
    if (this._inFallback) return;
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name) {
    if (name === 'mc:Fallback' || name === 'Fallback') {
      this._inFallback = false;
      return true;
    }
    if (this._inFallback) {
      return true;
    }
    
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        if (this.parser.model) {
          // 去重：基于 shapeId 和 rId 判断同一个 oleObject 是否已经存在
          const newModel = this.parser.model;
          const exists = this.model.some(m => 
            m.shapeId === newModel.shapeId || 
            (m.rId && newModel.rId && m.rId === newModel.rId)
          );
          if (!exists) {
            this.model.push(newModel);
          } else {
            console.log('[OleObjectsXform] 跳过重复的 oleObject:', newModel.shapeId, newModel.rId);
          }
        }
        this.parser = null;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        return false;
      case 'mc:AlternateContent':
      case 'mc:Choice':
      case 'AlternateContent':
      case 'Choice':
        return true;
      default:
        return true;
    }
  }
}

module.exports = { OleObjectsXform, OleObjectXform };
