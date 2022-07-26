const test = require('tape')
const Tree = require('./src/tree')

test('tree test',(t) => {
  let tree = new Tree(7)
  tree.union(2)
  tree.union(0)
  console.log(tree.toArray())
  tree.union(2)
  tree.union(3)
  console.log(tree.toArray())

  for (var i = 200; i > 100; i--) {
    tree.union(i);
  }

  console.log(tree.toArray())

  for (var i = 0; i < 10; i++) {
    console.log(i, tree.transform(i), tree.inverse(tree.transform(i)), tree.contains(i));
  }


} )