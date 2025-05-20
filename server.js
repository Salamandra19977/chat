const http = require("http")
const fs = require("fs")
const path = require("path")
const db = require('./database')
const cookie = require('cookie')

const indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"))
const styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"))
const scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"))
const authFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"))
const registerFile = fs.readFileSync(path.join(__dirname, "static", "register.html"))
const loginFile = fs.readFileSync(path.join(__dirname, "static", "login.html"))

const validAuthTokens = []

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        switch(req.url) {
            case "/style.css": return res.end(styleFile)
            case "/auth.js": return res.end(authFile)
            case "/register": return res.end(registerFile)
            case "/login": return res.end(loginFile)
            default: return guarded(req, res);
        } 
    }

    if (req.method === 'POST') {
        switch(req.url) {
            case "/api/register": return registerUser(req, res)
            case "/api/login": return login(req, res)
            default: return guarded(req, res);
        } 
    }
    return res.end("Error 404")
})
function guarded(req, res) {
    const credentionals = getCredentionals(req.headers?.cookie)
    if (!credentionals) {
        res.writeHead(302, {'Location': '/register'})
        return res.end()
    }

    if (req.method === 'GET') {
        switch(req.url) {
            case "/": return res.end(indexHtmlFile)
            case "/script.js": return res.end(scriptFile)
        } 
    }

    res.writeHead(404)
    return res.end('Error 404')
}

function getCredentionals(c = '') {
    const cookies = cookie.parse(c);
    const token = cookies?.token;
    if(!token || !validAuthTokens.includes(token)) return null;
    const [user_id, login] = token.split('.');
    if(!user_id || !login) return null;
    return {user_id, login};
}

function login(req, res) {
    let data = ''
    req.on('data', function(chunk) {
        data += chunk
    })
    req.on('end', async function() {
        try {
            console.log(data)
            const user = JSON.parse(data)
            const token = await db.getAuthToken(user)
            console.log(token)
            validAuthTokens.push(token)
            res.writeHead(200)
            res.end(token)
        } 
        catch(e) {
            res.writeHead(500)
            res.end('Error: ' + e)
        }
    })
}

function registerUser(req, res) {
    let data = ''
    req.on('data', function(chunk) {
        data += chunk
    })
    req.on('end', async function() {
        try {
            const user = JSON.parse(data)
            console.log(user)
            if (!user.login || !user.password) {
                return res.end("Empty login or password")
            }

            if (await db.isUserExist(user.login)) {
                return res.end("Empty already exist")
            }

            await db.addUser(user)
            return res.end("Registration is successfull")
        } 
        catch(e) {
            console.log(e)
        }
    })
}

server.listen(3000)

const {Server} = require("socket.io")
const io = new Server(server)

io.use((socket, next) => {
  const cookie = socket.handshake.auth.cookie;
  console.log(cookie)
  const credentionals = getCredentionals(cookie);
  console.log(credentionals)
  if(!credentionals) {
    next(new Error("no auth"));
  }
  socket.credentionals = credentionals;
  next();
})

io.on('connection', async (socket)=>{
    console.log("user connected id - " + socket.id)

    let userNickname = socket.credentionals?.login;
    let userId = socket.credentionals?.user_id;

    let messages = await db.getMessages()
    io.emit('all_messages', messages)

    socket.on('set_nickname', (nickname)=>{
        console.log(nickname)
        userNickname = nickname
    })

    socket.on('new_message', (message)=>{
        console.log("id: " + socket.id+" message :" + message)
        db.addMessage(message, userId)
        io.emit('message', userNickname + ':' + message)
    })
})