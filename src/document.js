const Tree= require('./tree')
let _operations = new WeakMap()
let _deletions = new WeakMap()
let _locations = new WeakMap()
let _text = new WeakMap()
let _revision = new WeakMap()
let _context = new WeakMap()
let _priority = new WeakMap()
let _counter = new WeakMap()

function adjustOperation(operation1, operation2) {
  if (operation2.type != 'insert') {
    return operation1
  }
  return adjustInsertOperation(operation1, operation2.index, operation2.priority)
}

function adjustInsertOperation(operation, index, priority) {
  if (operation.type != 'insert') {
     if (operation.index < index) {
       return operation
     }
     return {type: operation.type, index: operation.index + 1, id: operation.id}
  }
  if ((operation.index < index) || ((operation.index == index) && (operation.priority < priority))) {
    return operation
  }
  return {...operation, index: operation.index + 1}
}

class Document {
  constructor() {
    _operations.set(this, [])
    _deletions.set(this, new Tree())
    _locations.set(this, [])
    _text.set(this,``)
    _revision.set(this, 0)
    _context.set(this, new Set())
    _priority.set(this, Math.floor(Math.random() * 0x1000000))
    _counter.set(this, 0)
  }
  get text () {
    return _text.get(this)
  }
  get locations () {
    return _locations.get(this)
  }
  set locations (value) {
    if (!Array.isArray(value)) {
      throw new Error("Locations much be an array of integers")
    }
    _locations.set(this, value)
  }
  get revision () {
    return _revision.get(this)
  }
  updates (rev) {
    let operations = _operations.get(this)
    return operations.slice(rev)
  }
  get operationsCount() {
    let operations = _operations.get(this)
    return operations.length
  }
  get operations () {
    let operations = _operations.get(this)
    return operations.slice(0)
  }
  getId() {
    let priority = _priority.get(this)
    let counter = _counter.get(this)
    counter++
    _counter.set(this, counter)
    return (priority * 0x100000) + counter;
  }
  add(operation) {
    let operations = _operations.get(this)
    operations.push(operation)
    let deletions, index, text
    switch (operation.type) {
      case 'delete':
        deletions = _deletions.get(this)
        if (!deletions.contains(operation.index)) {
          index = deletions.inverse(operation.index)
          deletions.union(operation.index)
          text = _text.get(this)
          text = text.slice(0, index) + text.slice(index + 1)
          _text.set(this, text)
          let locations = _locations.get(this)
          for (var i = 0; i < locations.length; i++) {
            if (locations[i] > index) {
              locations[i] -= 1
            }
          }
        }
        break
      case 'insert':
        deletions = _deletions.get(this)
        let locations = _locations.get(this)
        deletions.forwardTransform(operation.index)
        index = deletions.inverse(operation.index)
        text = _text.get(this)
        text = text.slice(0, index) + operation.value + text.slice(index)
        _text.set(this, text)
        for (var i = 0; i < locations.length; i++) {
          if (locations[i] > index) {
            locations[i] += 1
          }
        }
        break
    }
  }
  merge(operation) {
    let priority = _priority.get(this)
    let counter = _counter.get(this)
    let currentId = (priority * 0x100000) + counter;
    // ignore our own ops
    if ((operation.priority == priority) && (operation.id <= currentId)) {
      return
    }
    let id = operation.id
    let operations = _operations.get(this)
    let revision = _revision.get(this)
    let context = _context.get(this)

    if ((revision < operations.length) && (operations[revision].id == id)) {
      revision++
      while ((revision < operations.length) && (context.has(operations[revision].id))) {
        context.delete(operations[revision].id)
        revision++
      }
      _revision.set(this, revision)
      return
    }

    for (let index = revision; index < operations.length; index++) {
      if (operations[index].id == id) {
        context.add(id)
        return
      }
    }

    let insertList = []
    let S , T
    for (let index = operations.length - 1; index >= revision; index--) {
      let current = operations[index]
      if (current.type == 'insert') {
        let i = S ? S.transform(current.index) : current.index
        if (!context.has(current.index)) {
          insertList.push([(T ? T.inverse(i): i), current.priority])
          if (T) {
            T.union(i)
          } else {
            T = new Tree(i)
          }
        }
        if (S) {
          S.union(i)
        } else {
          S = new Tree(i)
        }
      }
    }

    for (let i = insertList.length - 1; i >= 0; i--) {
      operation = adjustInsertOperation(operation, insertList[i][0], insertList[i][1])
    }

    let isCurrent = (revision == operations.length)
    this.add(operation)
    if (isCurrent) {
      revision++
    } else {
      context.add(id)
    }
    _revision.set(this, revision)
  }
  transformIndex(index) {
    let deletions = _deletions.get(this)
    return deletions.transform(index)
  }
  static getDiff(oldText, newText, cursor) {
    let delta = newText.length - oldText.length
    let limit = Math.max(0, cursor - delta)
    let end = oldText.length
    while ((end > limit) && (oldText.charAt(end -1)  == newText.charAt((end + delta) - 1))) {
      end -= 1
    }
    let start = 0
    let startLimit = cursor - Math.max(0, delta)
    while ((start < startLimit) && (oldText.charAt(start) == newText.charAt(start))) {
      start += 1
    }
    return {start, end, newText: newText.slice(start, end + delta)}
  }
  diffToOps(diff) {
    let {start , end, newText} = diff
    let result = []
    let priority = _priority.get(this)
    for (let i = start; i < end; i++) {
      result.push({priority, type: 'delete', index: this.transformIndex(i), id: this.getId()})
    }
    var index = this.transformIndex(end)
    for (var i = 0; i < newText.length; i++) {
      result.push({priority, type: 'insert', index: (index + i), id: this.getId(), value: newText.charAt(i)})
    }
    return result
  }
}
module.exports = Document