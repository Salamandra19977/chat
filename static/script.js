const socket = io({
  auth: {
    cookie: document.cookie
  }
})
const messages = document.getElementById("messages")
const form = document.getElementById("form")
const input = document.getElementById("input")

form.addEventListener('submit', function(e){
    e.preventDefault()
    if (input.value) {
        socket.emit('new_message', input.value)
        input.value = ''
    }
})

socket.on('all_messages', function(msgArray){
    console.log(msgArray)
    msgArray.forEach(msg => {
        let item = document.createElement('li')
        item.textContent = msg.login + " : "+ msg.content
        messages.appendChild(item)
    });
    window.scrollTo(0, document.body.scrollHeight)
})

socket.on('message', function(msg){
    console.log("info" + msg)
    var item = document.createElement('li')
    item.textContent = msg
    messages.appendChild(item)
    window.scrollTo(0, document.body.scrollHeight)
})

function changeNickname() {
    let nickname = prompt('Choose your nickname')
    if (nickname)  {
        socket.emit('set_nickname', nickname)
    }
}