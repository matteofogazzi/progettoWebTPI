'use strict;'

const lstCoseDaFare = document.getElementById('cosedafare')
let coseDaFare = []


const LoadFromLocalStorage = () => {
    return JSON.parse(localStorage.getItem('todo')) || []
}

coseDaFare = LoadFromLocalStorage()

const SaveToLocalStorage = () => {
    const jsonData = JSON.stringify(coseDaFare)
    localStorage.setItem('todo', jsonData)
}

const eliminaElemento = (pos) => {
    coseDaFare.splice(pos, 1)
    SaveToLocalStorage()
    console.log('Elemento eliminato in posizione ' + pos)
}

const RefreshView = () => {
    lstCoseDaFare.innerText = ''
    //for (const todo of coseDaFare) {
    //    lstCoseDaFare.innerHTML += '<li>' + todo.content + '<button>X</button></li>'
    //}
    coseDaFare.forEach((todo,idx) => {
        const li = document.createElement('li')
        li.innerText = todo.content
        const deleteButton = document.createElement('button')
        deleteButton.innerText = 'X'
        deleteButton.onclick = () => {
            eliminaElemento(idx)
            RefreshView()
        }
        li.appendChild(deleteButton)
        lstCoseDaFare.appendChild(li)
    })

}

RefreshView()

const addForm = document.getElementById('form-registrazione')
addForm.onsubmit = (evt) => {
    evt.preventDefault()
    const nome = document.getElementById('nome').value.trim()
    const cosaDaFare = {
        content: nome
    }
    coseDaFare.push(cosaDaFare)
    RefreshView()
    document.getElementById('nome').value = ''
    SaveToLocalStorage()
}
