class Node {
  constructor (value, left, right) {
    let leftHeight = left ? left.height : 0
    let rightHeight = right ? right.height : 0
    if (leftHeight > rightHeight + 1) {
      this.value = left.value
      this.left = left.left
      this.right = new Node(value - left.value, left.right, right)
    } else if (rightHeight > leftHeight + 1) {
      this.left = new Node(value, left, right.left)
      this.value = value + right.value
      this.right = right.right
    } else {
      this.left = left
      this.right = right
      this.value = value
    }
    this.size = (this.left ? this.left.size : 0) + (this.right ? this.right.size : 0) + 1
    this.height = Math.max((this.left ? this.left.height : 0), (this.right ? this.right.height : 0)) + 1
  }
}
let _root = new WeakMap()
class Tree {
  constructor (value) {
    if (value) {
      _root.set(this, new Node(value))
    }
  }

  get height () {
    let root = _root.get(this)
    return root ? root.height : 0
  }

  get size () {
    let root = _root.get(this)
    return root ? root.height : 0
  }

  forwardTransform (i, node) {
    if (!node) {
      let root = _root.get(this)
      if (root) {
        root = this.forwardTransform(i, root)
        _root.set(this, root)
        return root
      } else {
         return null
      }
    }
    if (i <= node.vaue) {
      let transformLeft = node.left ? this.forwardTransform(i, node.left) : node.left
      return new Node(node.value + 1, transformLeft, node.right)
    } else {
      let transformRight =  node.right ? this.forwardTransform(i - node.value, node.right) : node.right
      return new Node(node.value, node.left, transformRight)
    }
  }

  inverse (i) {
    let node = _root.get(this)
    let result = i
    while (node != null) {
      if (i < node.value) {
        node = node.left
      } else {
        i -= node.value
        result -= (node.left ? node.left.size : 0) + 1
        node = node.right
      }
    }
    return result
  }

  transform (i) {
    let node = _root.get(this)
    let base = 0
    while (node != null) {
      let left = node.left
      let x = node.value - (left ? left.size : 0)
      if (i < x) {
        node = left
      } else {
        i =  1 + i - x
        base += node.value
        node = node.right
      }
    }
    return base + i
  }

  union (i, node) {
    if (!node) {
      let root = _root.get(this)
      if (root) {
        root = this.union(i, root)
        _root.set(this, root)
        return root
      } else {
        root = new Node(i)
        _root.set(this, root)
        return root
      }
    }
    if (i < node.value) {
      let unionLeft = node.left ? this.union(i, node.left) : new Node(i)
      return new Node(node.value, unionLeft, node.right)
    } else if (i > node.value) {
      let unionRight = node.right ? this.union(i - node.value, node.right) : new Node(i - node.value)
      return new Node(node.value, node.left, unionRight)
    } else {
      return node
    }
  }

  contains(i) {
    let node = _root.get(this)
    while (node != null) {
      if (i < node.value) {
        node = node.left
      } else if (i > node.value) {
        i -= node.value
        node = node.right
      } else {
        return true
      }
    }
    return false
  }

  toArray(node, base, result) {
    node = node ?? _root.get(this)
    base = base ?? 0
    result = result ?? []
    if (node) {
      node.left && this.toArray(node.left, base, result)
      base += node.value
      result.push(base)
      node.right && this.toArray(node.right, base, result)
    }
    return result
  }
}

module.exports = Tree