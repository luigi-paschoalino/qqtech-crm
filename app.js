var express = require('express');
var app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const database = require('./db');
const models = require('./models');
const port = 3000;

app.use(express.static(__dirname + '/styles'));
app.use(express.static(__dirname + '/scripts'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({secret: 'nossoSegredinho', saveUninitialized: false, resave: false, name: 'crmSession'}));

// GETs

app.get('/', function (req, res) {
    res.redirect('/login');
});

app.get('/authError', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/facaLogin.html'));
});

// ROUTES

app.route('/login')
    .get(function (req, res) {
        if (req.session.matricula){
            console.log(req.session.matricula);
            res.redirect('/home');
        }
        else{
            res.sendFile(path.join(__dirname + '/views/login.html'));
        }
    })
    .post(async function (req, res) {
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
                req.session.matricula = req.body.matricula;
                res.status(200).redirect('/home');
            }
        } catch (err) {
            console.log('Erro ao efetuar login: ' + err.message);
            res.status(401).sendFile(path.join(__dirname + '/views/loginInvalido.html'));
        }
    });

app.get('/home', function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{    
        res.sendFile(path.join(__dirname + '/views/tela-inicial.html'));
    }
});

app.get('/infoCRM', function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        res.sendFile(path.join(__dirname + '/views/info-default.html'));
    }
});

app.get('/updateCRM', function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        res.sendFile(path.join(__dirname + '/views/atualizar-crm.html'));
    }
});

app.get('/changelogCRM', function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        res.sendFile(path.join(__dirname + '/views/changelog-crm.html'));
    }
});

app.route('/createCRM')
    .get(function (req, res) {
        if (!req.session.matricula){
            res.redirect('/authError');
        }
        else{
            res.sendFile(path.join(__dirname + '/views/criar-crm.html'));
        }
    })
    .post(async function (req, res) {
        const c = await database.transaction();
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
                idcolaborador_criador: req.session.matricula,
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
                    idcolaborador: req.session.matricula
                }
            })
            await models.SetoresEnvolvidos.create({
                crm_idcrm: retorno + 1,
                crm_versao: 1,
                setor_idsetor: setorRetorno.setor
            });
            await c.commit();
            res.send('CRM criado com sucesso!');
        }
        catch(error){
            await c.rollback();
            res.send('Erro ao criar CRM: ' + error.message);
        }
    });

app.route('/addUser')
    .get(function (req, res) {
        if (!req.session.matricula){
            res.redirect('/authError');
        }
        else{          
        res.sendFile(path.join(__dirname + '/views/cadastrar-usuario.html'));
        }
    })
    .post(async function (req, res) {
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

app.get('/dadosCRM', async function (req, res) {
    let retorno = JSON.stringify(await models.Crm.findOne({
        where: {
            idcrm: parseInt(req.query.id),
        },
        order: [['versao', 'DESC']]
    }));
    if (retorno === 'null') {
        res.send('Nenhum registro encontrado');
    } else {
        res.send(retorno);
    }
});

// POSTs

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

/*app.post('/avaliarCRM', async function (req, res) {
    const c = await database.transaction();
    try{
        await models.FeedbackCRM.create({
            colaborador_idcolaborador: req.body.matricula,
            crm_idcrm: req.body.idcrm,
            crm_versao: req.body.versao,
            tipoavaliacao: req.body.tipoavaliacao,
            sugestoes: req.body.sugestoes
        });
        let setorRetorno = await models.Colaborador.findOne({
            attributes: ['setor'],
            where: {
                idcolaborador: req.body.matricula
            }
        }).setor;
        if (req.body.tipoavaliacao === false){
            await models.SetoresEnvolvidos.update({
                flagsetor: false,
                where: {
                    crm_idcrm: req.body.idcrm,
                    crm_versao: req.body.versao,
                    setor_idsetor: setorRetorno
                }
            });
        } else {
            if (req.body.tipoavaliacao === true){
                await models.SetoresEnvolvidos.update({
                    flagsetor: true,
                    where: {
                        crm_idcrm: req.body.idcrm,
                        crm_versao: req.body.versao,
                        setor_idsetor: setorRetorno
                    }
                });
            } else {
                throw { 'message': 'Tipo de avaliação inválido!'};
            }
        }
        await c.commit();
        res.send('CRM avaliado com sucesso!');
    }
    catch(error){
        await c.rollback();
        res.send('Erro ao avaliar CRM: ' + error.message);
    }
});*/

// Ligando o servidor

app.listen(port, err => {
    if (err) {
        return console.log('Erro', err)
    }
    console.log('Projeto rodando na porta ' + port);
});