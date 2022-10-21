var express = require('express');
var app = express();
const path = require('path');
const bodyParser = require('body-parser');
const database = require('./db');
const models = require('./models');
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
    console.log(req.body);
    res.sendFile(path.join(__dirname + '/views/tela-inicial.html'));
});

app.post('/readTeste', async function (req, res) {
    try{
        const retorno = await models.Colaborador.findOne({attributes: ['idcolaborador', 'senha'], where: {idcolaborador: req.body.idcolaborador, senha: req.body.senha}})
        if (retorno === [] || retorno === null) {
            res.send('Usuário ou senha incorretos');
        } else {
            res.send('Login realizado com sucesso!');
        }
    }
    catch(error){
        res.send('Erro ao realizar login');
    }
});

app.post('/insertTeste', async function (req, res) {
    try{
        await models.Setor.create({
            idsetor: null,
            nomesetor: req.body.nomesetor
        });
        res.send('Setor cadastrado com sucesso!');
    }
    catch(error){
        res.send('Erro ao cadastrar setor');
    }
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