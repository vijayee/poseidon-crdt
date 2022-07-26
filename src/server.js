const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const Document = require('./document')


app.use(express.static('dist'))

var doc = new Document()
var rev = 0
function broadcast() {
    if (rev < doc.operationsCount) {
        console.log('sending updates')
        io.emit('update', doc.updates(rev))
        rev = doc.operationsCount
    }
}

io.on('connection', function(socket){
    console.log('client connected');
    socket.on('update', function(operations) {
        for (var i = 0; i < operations.length; i++) {
            doc.merge(operations[i])
        }
        broadcast()
        console.log(`update: ${JSON.stringify(operations)}:  ${doc.text}`)
    });
    socket.emit('update', doc.operations);
})

http.listen(3000, function(){
  console.log('Connect your client to http://localhost:3000/')
})
