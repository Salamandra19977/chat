const http = require("http")
const fs = require("fs")
const path = require("path")

const indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"))
const styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"))
const scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"))

const server = http.createServer((req, res) => {
    switch(req.url) {
        case "/": return res.end(indexHtmlFile)
        case "/style.css": return res.end(styleFile)
        case "/script.js": return res.end(scriptFile)
    }

    return res.end("Error 404")
})

server.listen(3000)

const {Server} = require("socket.io")
const io = new Server(server)

io.on('connection', (socket)=>{
    console.log("user connected id - " + socket.id)
    let userNickname = 'user'

    socket.on('set_nickname', (nickname)=>{
        console.log(nickname)
        userNickname = nickname
    })

    socket.on('new_message', (message)=>{
        console.log("id: " + socket.id+" message :" + message)
        io.emit('message', userNickname + ':' + message)
    })
})