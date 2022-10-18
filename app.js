var express = require('express');
var app = express();
const path = require('path');
const bodyParser = require('body-parser');
const port = 3000;

app.use(express.static(__dirname + '/styles'));
app.use(express.static(__dirname + '/scripts'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/login.html'));
});

app.post('/home', function (req, res) {
    console.log(req.body.matricula);
    console.log(req.body.password);
    res.sendFile(path.join(__dirname + '/views/tela-inicial.html'));
});

app.get('/infoCRM', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/info-default.html'));
});

app.get('/infoTI', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/info-ti.html'));
});

app.get('/infoSetor', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/info-setor.html'));
});

app.get('/infoCriador', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/info-creator.html'));
});

app.get('/updateCRM', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/atualizar-crm.html'));
});

app.get('/changelogCRM', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/changelog-crm.html'));
});

app.get('/createCRM', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/criar-crm.html'));
});

app.get('/addUser', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/cadastrar-usuario.html'));
});

app.get('/teste', function (req, res) {
    res.send('<h1>Funfou</h1>');
});

// Ligando o servidor

app.listen(port, err => {
    if (err) {
        return console.log('Erro', err)
    }
    console.log('Projeto rodando na porta ' + port);
});