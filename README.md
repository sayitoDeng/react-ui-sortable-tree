# react-ui-sortable-tree [![Build Status](https://travis-ci.org/ukrbublik/react-ui-sortable-tree.svg)](https://travis-ci.org/ukrbublik/react-ui-sortable-tree)
React tree component

Forked from [https://github.com/ukrbublik/react-ui-sortable-tree](https://github.com/ukrbublik/react-ui-sortable-tree). 
add canDrap to control drap tree (see prop `canDrap`).


This project was initially developed for a webpage builder. It maintains an internal tree structure within the component through [js-tree](https://github.com/wangzuo/js-tree).

### Installation
``` sh
npm install react-ui-sortable-tree-drag --save
```
### Usage
``` javascript
<Tree
  paddingLeft={20}               // left padding for children nodes in pixels
  tree={this.state.tree}         // tree object
  onChange={this.handleChange}   // onChange(tree) tree object changed
  renderNode={this.renderNode}   // renderNode(node) return react element
  canMoveNode={this.canMoveNode} // canMoveNode(from, to, placement, parent) return bool
  canDrag={this.canDrag}         //canDrag() return bool
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
