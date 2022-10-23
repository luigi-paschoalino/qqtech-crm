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
    res.redirect('/login');
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/login.html'));
});

app.get('/home', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/tela-inicial.html'));
});

app.post('/home', async function (req, res) {
    try{
        let retorno = await models.Colaborador.findOne({
            attributes: ['idcolaborador', 'senha'],
            where: {
                idcolaborador: req.body.matricula,
                senha: req.body.senha
            }
        });
        if (retorno === [] || retorno === null) {
            res.status(401).redirect('/login');
        } else {
            res.sendFile(path.join(__dirname + '/views/tela-inicial.html'));
        }
    } catch (err) {
        console.log('Erro ao efetuar login: ' + err.message);
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

app.post('/addUser', async function (req, res) {
    try{
        if (req.body.senha != req.body.confSenha){
            throw { 'message': 'As senhas não conferem!'};
        }
        else{
            await models.Colaborador.create({
                idcolaborador: req.body.matricula,
                senha: req.body.senha,
                setor: parseInt(req.body.setor),
                nome: req.body.nome,
                sobrenome: req.body.sobrenome,
                email: req.body.email
            });
            res.status(200).redirect('/home');
        }
    }
    catch (err) {
        console.log('Erro ao cadastrar novo colaborador: ' + err.message);
        res.redirect('/addUser');
    }
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