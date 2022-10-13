var express = require('express');
var app = express();
const port = 3000;

app.use(express.static('styles'));

app.get('/', function (req, res) {
    res.sendFile('views/login.html', { root: __dirname });
});

app.get('')

app.listen(port, err => {
    if (err) {
        return console.log('Erro', err)
    }
    console.log('Projeto rodando na porta ' + port);
});