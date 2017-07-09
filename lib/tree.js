var Tree = require('js-tree');
var proto = Tree.prototype;

proto.updateNodesPosition = function() {
  var top = 1;
  var left = 1;
  var root = this.getIndex(1);
  var self = this;

  root.top = top++;
  root.left = left++;

  if(root.children && root.children.length) {
    walk(root.children, root, left, root.node.collapsed);
  }

  function walk(children, parent, left, collapsed) {
    var height = 1;
    children.forEach(function(id) {
      var node = self.getIndex(id);
      if(collapsed) {
        node.top = null;
        node.left = null;
      } else {
        node.top = top++;
        node.left = left;
      }
      node.lev = left-1;

      if(node.children && node.children.length) {
        height += walk(node.children, node, left+1, collapsed || node.node.collapsed);
      } else {
        node.height = 1;
        height += 1;
      }
    });

    if(parent.node.collapsed) parent.height = 1;
    else parent.height = height;
    return parent.height;
  }
};

proto._getNodeElById = function (treeEl, indexId) {
  if (indexId == null)
    return null;
  if (!this._cacheEls)
    this._cacheEls = {};
  var el = this._cacheEls[indexId];
  if (el && document.contains(el))
    return el;
  el = treeEl.querySelector('.m-node[data-id="'+indexId+'"]');
  this._cacheEls[indexId] = el;
  return el;
};

proto._getDraggableNodeEl = function (treeEl) {
  if (!this._cacheEls)
    this._cacheEls = {};
  var el = this._cacheEls['draggable'];
  if (el && document.contains(el))
    return el;
  var els = treeEl.getElementsByClassName('m-draggable');
  el = els.length ? els[0] : null;
  this._cacheEls['draggable'] = el;
  return el;
};

proto._getPlaceholderNodeEl = function (treeEl) {
  if (!this._cacheEls)
    this._cacheEls = {};
  var el = this._cacheEls['placeholder'];
  if (el && document.contains(el))
    return el;
  var els = treeEl.getElementsByClassName('placeholder');
  el = els.length ? els[0] : null;
  this._cacheEls['placeholder'] = el;
  return el;
};

proto.moveIndex = function (index, dragInfo, e, canMoveFn) {
  var newIndex = null;
  var collapsed = index.node.collapsed;
  var paddingLeft = dragInfo.paddingLeft;

  var moveInfo = null;
  var treeEl = dragInfo.treeEl;
  var dragId = dragInfo.id;
  var dragEl = this._getDraggableNodeEl(treeEl);
  var plhEl = this._getPlaceholderNodeEl(treeEl);
  if (dragEl && plhEl) {
    var dragRect = dragEl.getBoundingClientRect();
    var plhRect = plhEl.getBoundingClientRect();
    var dragDirs = {hrz: 0, vrt: 0};
    if (dragRect.top < plhRect.top)
      dragDirs.vrt = -1; //up
    else if (dragRect.bottom > plhRect.bottom)
      dragDirs.vrt = +1; //down
    if (dragRect.left > plhRect.left)
      dragDirs.hrz = +1; //right
    else if (dragRect.left < plhRect.left)
      dragDirs.hrz = -1; //left

    var treeRect = treeEl.getBoundingClientRect();
    var trgCoord = {
      x: treeRect.right - 10, 
      y: dragDirs.vrt >= 0 ? dragRect.bottom : dragRect.top,
    };
    var hovMnodeEl = document.elementFromPoint(trgCoord.x, trgCoord.y);
    hovMnodeEl = hovMnodeEl ? hovMnodeEl.closest('.m-node') : null;
    if (!hovMnodeEl) {
      //todo: Bug #1: handle "out of tree bounds" problem; scroll tree viewport
      console.log('out of tree bounds');
    } else {
      var hovNodeId = hovMnodeEl.getAttribute('data-id');
      var hovInnerEls = hovMnodeEl.getElementsByClassName('inner');
      var hovEl = hovInnerEls.length ? hovInnerEls[0] : null;
      if (hovEl) {
        var hovRect = hovEl.getBoundingClientRect();
        var hovHeight = hovRect.bottom - hovRect.top;
        var hovIndex = this.getIndex(hovNodeId);
        var trgRect = null,
            trgEl = null,
            trgIndex = null;
        if (dragDirs.vrt == 0) {
          trgIndex = index;
          trgEl = plhEl;
          if (trgEl)
            trgRect = trgEl.getBoundingClientRect();
        } else {
          var isOverHover = (dragDirs.vrt < 0 //up
            ? ((hovRect.bottom - dragRect.top) > hovHeight/2)
            : ((dragRect.bottom - hovRect.top) > hovHeight/2));
          if (isOverHover) {
            trgIndex = hovIndex;
            trgRect = hovRect;
            trgEl = hovEl;
          } else {
            var trgIndex = dragDirs.vrt <= 0 //up
              ? this.getNodeByTop(hovIndex.top + 1) //below
              : this.getNodeByTop(hovIndex.top - 1); //above
            if (trgIndex) {
              if (trgIndex.id == dragId) {
                trgEl = plhEl;
              } else
                trgEl = this._getNodeElById(treeEl, trgIndex.id);
              trgRect = trgEl.getBoundingClientRect();
            }
          }
        }
        var isSamePos = (trgIndex && trgIndex.id == dragId);
        if (trgRect) {
          var dragLeftOffset = dragRect.left - treeRect.left;
          var trgLeftOffset = trgRect.left - treeRect.left;
          if (isSamePos) {
            //todo: Bug #2: fix 10px offset in css
            dragLeftOffset += 10; //fix, see "padding-left: 10px" at css
          }
          var trgLev = trgLeftOffset / paddingLeft;
          var dragLev = Math.max(0, Math.round(dragLeftOffset / paddingLeft));
          var availMoves = [];
          if (isSamePos) {
            //allow to move only left/right
            var tmp = trgIndex;
            while (tmp.parent && !tmp.next) {
              //can prepend to collapsed
              var par = this.getIndex(tmp.parent);
              if (par.id != 1)
                availMoves.push(['after', par, par.lev]);
              tmp = par;
            }
            if (trgIndex.prev) {
              var tmp = this.getIndex(trgIndex.prev);
              while (!tmp.node.leaf) {
                //can append to collapsed if it's visible
                if (index.parent != tmp.id)
                  availMoves.push(['append', tmp, tmp.lev+1]);
                if (!tmp.children || !tmp.children.length || tmp.collapsed) {
                  break;
                } else {
                  var lastChildId = tmp.children[tmp.children.length - 1];
                  var lastChild = this.getIndex(lastChildId);
                  tmp = lastChild;
                }
              }
            }
          } else {
            //find out where we can move..
            if (dragDirs.vrt < 0) {
              availMoves.push(['before', trgIndex, trgIndex.lev]);
            }
            if (trgIndex.node.leaf && dragDirs.vrt > 0) {
              availMoves.push(['after', trgIndex, trgIndex.lev]);
            }
            if (!trgIndex.node.leaf && dragDirs.vrt > 0) {
              //can prepend to collapsed
              availMoves.push(['prepend', trgIndex, trgIndex.lev+1]);
            }
            if (dragDirs.vrt > 0) {
              var tmp = trgIndex;
              while (tmp.parent && !tmp.next) {
                //can append to collapsed
                var par = this.getIndex(tmp.parent);
                availMoves.push(['append', par, par.lev+1]);
                tmp = par;
              }
            }
            if (dragDirs.vrt < 0) {
              if (trgIndex.prev) {
                var tmp = this.getIndex(trgIndex.prev);
                while (!tmp.node.leaf) {
                  //can append to collapsed if it's visible
                  if (index.parent != tmp.id)
                    availMoves.push(['append', tmp, tmp.lev+1]);
                  if (!tmp.children || !tmp.children.length || tmp.collapsed) {
                    break;
                  } else {
                    var lastChildId = tmp.children[tmp.children.length - 1];
                    var lastChild = this.getIndex(lastChildId);
                    tmp = lastChild;
                  }
                }
              }
            }
          }

          //sanitize
          availMoves = availMoves.filter(am => {
            let placement = am[0];
            let trg = am[1];
            if ((placement == 'before' || placement == 'after') && trg.id == 1)
              return false;

            let isInside = (trg.id == index.id);
            if (!isInside) {
              let tmp = trg;
              while (tmp.parent) {
                tmp = this.getIndex(tmp.parent);
                if (tmp.id == index.id) {
                  isInside = true;
                  break;
                }
              }
            }
            return !isInside;
          });

          var bestMode = null;
          availMoves = availMoves.filter(am => this.canMove(index.id, am[1].id, am[0], canMoveFn));
          var levs = availMoves.map(am => am[2]);
          var curLev = index.lev;
          var allLevs = levs.concat(curLev);
          var closestDragLev = null;
          if (allLevs.indexOf(dragLev) != -1)
            closestDragLev = dragLev;
          else if (dragLev > Math.max(...allLevs))
            closestDragLev = Math.max(...allLevs);
          else if (dragLev < Math.min(...allLevs))
            closestDragLev = Math.min(...allLevs);
          bestMode = availMoves.find(am => am[2] == closestDragLev);
          if (!isSamePos && !bestMode && availMoves.length)
            bestMode = availMoves[0];

          moveInfo = bestMode;
        }
      }
    }
  }

  if (moveInfo) {
    //console.log('move', index, moveInfo);
    newIndex = this.move(index.id, moveInfo[1].id, moveInfo[0]);
  }

  return newIndex;
};

proto.canMove = function (fromId, toId, placement, canMoveFn) {
  if(fromId === toId)
    return false;
  
  var fromIndex = this.getIndex(fromId);
  var toIndex = this.getIndex(toId);
  if(!fromIndex || !toIndex)
    return false;
  var toParentIndex = null;
  if (placement == 'append' || placement == 'prepend')
    toParentIndex = toIndex;
  else
    toParentIndex = this.getIndex(toIndex.parent);
  if (toParentIndex && toParentIndex.id == 1)
    toParentIndex = null;

  var res = true;
  if (canMoveFn)
    res = canMoveFn(fromIndex.node, toIndex.node, placement, toParentIndex ? toParentIndex.node : null);
  return res;
};

proto.move = function(fromId, toId, placement) {
  //if(!this.canMove(fromId, toId, placement))
  //  return;

  var obj = this.remove(fromId);
  var index = null;

  if(placement === 'before') index = this.insertBefore(obj, toId);
  else if(placement === 'after') index = this.insertAfter(obj, toId);
  else if(placement === 'prepend') index = this.prepend(obj, toId);
  else if(placement === 'append') index = this.append(obj, toId);

  // todo: perf
  this.updateNodesPosition();
  return index;
};

proto.getNodeByTop = function(top) {
  var indexes = this.indexes;
  for(var id in indexes) {
    if(indexes.hasOwnProperty(id)) {
      if(indexes[id].top === top) return indexes[id];
    }
  }
};

module.exports = Tree;
