# react-ui-sortable-tree [![Build Status](https://travis-ci.org/ukrbublik/react-ui-sortable-tree.svg)](https://travis-ci.org/ukrbublik/react-ui-sortable-tree)
React tree component

Forked from [https://github.com/pqx/react-ui-tree](https://github.com/pqx/react-ui-tree). 
Fully reworked sorting (drag-n-drop) of tree to allow control of drop (see prop `canMoveNode`).

This project was initially developed for a webpage builder. It maintains an internal tree structure within the component through [js-tree](https://github.com/wangzuo/js-tree).
### Demo
[https://ukrbublik.github.io/react-ui-sortable-tree/](https://ukrbublik.github.io/react-ui-sortable-tree/)
### Installation
``` sh
npm install react-ui-sortable-tree --save
```
### Usage
``` javascript
<Tree
  paddingLeft={20}               // left padding for children nodes in pixels
  tree={this.state.tree}         // tree object
  onChange={this.handleChange}   // onChange(tree) tree object changed
  renderNode={this.renderNode}   // renderNode(node) return react element
  canMoveNode={this.canMoveNode} // canMoveNode(from, to, placement, parent) return bool
/>

// a sample tree object
// node.children, node.collapsed, node.leaf properties are hardcoded
{
  "module": "react-ui-tree",
  "children": [{
    "collapsed": true,
    "module": "dist",
    "children": [{
      "module": "node.js"
    }]
  }]
}
```
check [app.js](https://github.com/pqx/react-ui-tree/blob/master/example/app.js) for a working example

### Development
- npm install
- npm start
- http://localhost:8888/example

### License
MIT
