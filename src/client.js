const Document = require('./document')
const io = require('socket.io-client')
var textElement = document.getElementById("text")

textElement.selectionStart = 0
textElement.selectionEnd = 0
var oldText = ""
let socket = io()
let doc = new Document()
textElement.addEventListener("input", function(event) {
  let diff = Document.getDiff(oldText, textElement.value, textElement.selectionEnd)
  let ops = doc.diffToOps(diff)
  // apply ops locally
  for (var i = 0; i < ops.length; i++) {
    doc.add(ops[i])
  }
  socket.emit('update', ops)
  console.log('ops:' + JSON.stringify(ops))
  console.log('docstate: ' + doc.text)
  oldText = textElement.value
})
socket.on('update', function(ops) {
  console.log('from server:' + JSON.stringify(ops))
  let rev = doc.operationsCount
  doc.locations = [textElement.selectionStart, textElement.selectionEnd]

  for (var i = 0; i < ops.length; i++) {
    doc.merge(ops[i])
  }
/*
  if (rev < doc.operationsCount) {
    socket.emit('update', doc.updates(rev))
  }*/
  textElement.value = doc.text
  oldText = textElement.value
  textElement.selectionStart = doc.locations[0]
  textElement.selectionEnd = doc.locations[1]
})