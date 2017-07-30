'use strict';

var React = require('react');
var Tree = require('./tree');
var Node = require('./node');

module.exports = React.createClass({
  displayName: 'UITree',

  propTypes: {
    tree: React.PropTypes.object.isRequired,
    paddingLeft: React.PropTypes.number,
    renderNode: React.PropTypes.func.isRequired
  },

  getDefaultProps: function getDefaultProps() {
    return {
      paddingLeft: 20
    };
  },
  getInitialState: function getInitialState() {
    return this.init(this.props);
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (!this._updated) this.setState(this.init(nextProps));else this._updated = false;
  },
  init: function init(props) {
    var tree = new Tree(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    return {
      tree: tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    };
  },
  getDraggingDom: function getDraggingDom() {
    var tree = this.state.tree;
    var dragging = this.state.dragging;

    if (dragging && dragging.id) {
      var draggingIndex = tree.getIndex(dragging.id);
      var draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return React.createElement(
        'div',
        { className: 'm-draggable', style: draggingStyles },
        React.createElement(Node, {
          tree: tree,
          index: draggingIndex,
          paddingLeft: this.props.paddingLeft
        })
      );
    }

    return null;
  },
  render: function render() {
    var tree = this.state.tree;
    var dragging = this.state.dragging;
    var draggingDom = this.getDraggingDom();

    return React.createElement(
      'div',
      { className: 'm-tree' },
      draggingDom,
      React.createElement(Node, {
        tree: tree,
        index: tree.getIndex(1),
        key: 1,
        paddingLeft: this.props.paddingLeft,
        onDragStart: this.dragStart,
        onCollapse: this.toggleCollapse,
        dragging: dragging && dragging.id
      })
    );
  },
  dragStart: function dragStart(id, dom, e) {
    this.dragging = {
      id: id,
      w: dom.offsetWidth,
      h: dom.offsetHeight,
      x: dom.offsetLeft,
      y: dom.offsetTop,
      treeEl: dom.closest('.m-tree'),
      treeElContainer: dom.closest('.m-tree').parentElement
    };

    this._startX = dom.offsetLeft;
    this._startY = dom.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;
    this._changed = false;

    var tree = this.state.tree;
    tree.onDragStart();

    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.dragEnd);
  },


  // oh
  drag: function drag(e) {
    if (this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    var tree = this.state.tree;
    var dragging = this.state.dragging;
    var paddingLeft = this.props.paddingLeft;
    var treeElContainer = dragging.treeElContainer;
    var scrolTop = treeElContainer.scrollTop;
    var newIndex = null;
    var index = tree.getIndex(dragging.id);
    if (!index) {
      //todo: see Bug #1
      return;
    }
    var collapsed = index.node.collapsed;

    var _startX = this._startX;
    var _startY = this._startY;
    var _offsetX = this._offsetX;
    var _offsetY = this._offsetY;

    var pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY + scrolTop
    };
    dragging.x = pos.x;
    dragging.y = pos.y;
    dragging.paddingLeft = paddingLeft;

    newIndex = tree.moveIndex(index, dragging, e, this.props.canMoveNode, this.props.canMoveToCollapaed || false);

    if (newIndex) {
      index = newIndex;
      dragging.id = newIndex.id;
      this._changed = true;
    } else {
      e.preventDefault();
    }

    this.setState({
      tree: tree,
      dragging: dragging
    });
  },
  dragEnd: function dragEnd() {
    this.dragging = {
      id: null,
      x: null,
      y: null,
      w: null,
      h: null
    };
    this.setState({
      dragging: this.dragging
    });

    var tree = this.state.tree;
    tree.onDragEnd();

    if (this._changed) this.change(this.state.tree);

    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.dragEnd);
  },
  change: function change(tree) {
    this._updated = true;
    if (this.props.onChange) this.props.onChange(tree.obj);
  },
  toggleCollapse: function toggleCollapse(nodeId) {
    var tree = this.state.tree;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({
      tree: tree
    });

    this.change(tree);
  }
});