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

// GET Routes

app.get('/', function (req, res) {
    res.redirect('/login');
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/login.html'));
});

app.get('/home', function (req, res) {
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


// POST Routes

app.post('/login', async function (req, res) {
    try{
        let retorno = await models.Colaborador.findOne({
            attributes: ['idcolaborador', 'senha'],
            where: {
                idcolaborador: req.body.matricula,
                senha: req.body.senha
            }
        });
        if (retorno === [] || retorno === null) {
            throw {message: 'Matrícula ou senha incorretas.'};
        } else {
            res.status(200).redirect('/home');
        }
    } catch (err) {
        console.log('Erro ao efetuar login: ' + err.message);
        res.status(401).sendFile(path.join(__dirname + '/views/loginInvalido.html'));
    }
});

app.post('/insertSetor', async function (req, res) {
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

app.post('/createCRM', async function (req, res) {
    try{
        let retorno = await models.Crm.max('idcrm');
        if (retorno === null){
            retorno = 0;
        }
        else{
            retorno = parseInt(retorno);
        }
        console.log(retorno);
        await models.Crm.create({
            idcrm: retorno + 1,
            versao: 1,
            idcolaborador_criador: req.body.matricula,
            descricao: req.body.descricao,
            objetivo: req.body.objetivo,
            justificativa: req.body.justificativa,
            comportamentooffline: req.body.comportamentooffline
        },
        {
            fields: ['idcrm', 'versao', 'idcolaborador_criador', 'descricao', 'objetivo', 'justificativa', 'comportamentooffline']
        });
        let setorRetorno = await models.Colaborador.findOne({
            attributes: ['idcolaborador', 'setor'],
            where:{
                idcolaborador: req.body.matricula
            }
        })
        await models.SetoresEnvolvidos.create({
            crm_idcrm: retorno + 1,
            crm_versao: 1,
            setor_idsetor: setorRetorno.setor
        });
        res.send('CRM criado com sucesso!');
    }
    catch(error){
        res.send('Erro ao criar CRM: ' + error.message);
    }
});

app.post('/updateCRM', async function (req, res) {
    try{
        let retorno = await models.Crm.max('versao', {
            where: {
                idcrm: req.body.idcrm
            }
        });
        if (retorno === null){
            retorno = 0;
        }
        else{
            retorno = parseInt(retorno);
        }
        console.log(retorno);
        await models.Crm.create({
            idcrm: req.body.idcrm,
            versao: retorno + 1,
            idcolaborador_criador: req.body.matricula,
            descricao: req.body.descricao,
            objetivo: req.body.objetivo,
            justificativa: req.body.justificativa,
            comportamentooffline: req.body.comportamentooffline,
            changelog: req.body.changelog
        },
        {
            fields: ['idcrm', 'versao', 'idcolaborador_criador', 'descricao', 'objetivo', 'justificativa', 'comportamentooffline', 'changelog']
        });
        let setorRetorno = await models.Colaborador.findOne({
            attributes: ['idcolaborador', 'setor'],
            where: {
                idcolaborador: req.body.matricula
            }
        });
        await models.SetoresEnvolvidos.create({
            crm_idcrm: req.body.idcrm,
            crm_versao: retorno + 1,
            setor_idsetor: setorRetorno.setor
        });
        res.send('CRM atualizado com sucesso!');
    }
    catch(error){
        res.send('Erro ao atualizar CRM: ' + error.message);
    }
});

app.get('/teste', async function (req, res) {
    try{
        let retorno = await models.Crm.max('idcrm');
        res.send(JSON.stringify(retorno));
    }
    catch(error){
        res.send('Erro ao consultar tabela CRM: ' + error.message);
    }
});

// Ligando o servidor

app.listen(port, err => {
    if (err) {
        return console.log('Erro', err)
    }
    console.log('Projeto rodando na porta ' + port);
});