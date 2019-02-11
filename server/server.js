const mongo = require('mongodb').MongoClient;
const port = process.env.PORT || 4000;
const io = require('socket.io').listen(port).sockets;

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', { useNewUrlParser: true }, (err, client) => {
    if(err) throw err;

    console.log('Mongodb connected...');

    // Connect to socket.io
    io.on('connection', (socket) => {
        let chat = client.db('mongochat').collection('chats');

        // Create function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id: 1}).toArray((err, res) => {
            if(err) throw err;
            
            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', (data) => {
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == '') {
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message into db
                chat.insertOne({name, message}, () => {
                    io.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', (data) => {
            // Remove all chats from the collection
            chat.deleteMany({}, () => {
                socket.emit('cleared');
            });
        });
    });
});


