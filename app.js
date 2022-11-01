var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const database = require('./db');
const models = require('./models');
const port = 3000;

app.use(express.static(__dirname + '/styles'));
app.use(express.static(__dirname + '/scripts'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(session({secret: 'nossoSegredinho', saveUninitialized: false, resave: false, name: 'crmSession'}));

// GETs

app.get('/', function (req, res) {
    res.redirect('/login');
});

app.get('/authError', function (req, res) {
    res.render('facaLogin');
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/changelogCRM', function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        res.render('changelog-crm');
    }
});

// ROUTES

app.route('/login')
    .get(function (req, res) {
        if (req.session.matricula){
            res.redirect('/home');
        }
        else{
            res.render('login');
        }
    })
    .post(async function (req, res) {
        try{
            let retorno = await models.Colaborador.findOne({
                attributes: ['idcolaborador', 'senha', 'setor', 'nome'],
                where: {
                    idcolaborador: req.body.matricula,
                    senha: req.body.senha
                }
            });
            if (retorno === [] || retorno === null) {
                throw {message: 'Matrícula ou senha incorretas.'};
            } else {
                req.session.matricula = req.body.matricula;
                req.session.setor = retorno.setor;
                req.session.nome = retorno.nome;
                res.status(200).redirect('/home');
            }
        } catch (err) {
            console.log('Erro ao efetuar login: ' + err.message);
            res.status(401).render('loginInvalido');
        }
    });
app.route('/home')
    .get(async function (req, res) {
        if (!req.session.matricula){
            res.redirect('/authError');
        }
        else{
            try{
                let retorno = await database.query(
                    `SELECT DISTINCT ON (c.idcrm) c.idcrm, max(c.versao), c.descricao, c.dataabertura, c.etapaprocesso, c.flagarquivamento, cc.nome, cc.sobrenome FROM crm c JOIN colaborador cc ON c.idcolaborador_criador = cc.idcolaborador WHERE c.idcolaborador_criador = '${req.session.matricula}' GROUP BY c.idcrm, c.descricao, c.dataabertura, c.etapaprocesso, c.flagarquivamento, cc.nome, cc.sobrenome ORDER BY c.idcrm ASC, max(c.versao) DESC;`
                );
                res.render('tela-inicial', {crm: retorno[0], nome: req.session.nome});
            }
            catch (error){
                res.send(`Deu ruim: ${error.message}`);
            }
        }
    });

app.get('/updateCRM', function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        res.render('atualizar-crm');
    }
});

app.route('/createCRM')
    .get(async function (req, res) {
        if (!req.session.matricula){
            res.redirect('/authError');
        }
        else{
            let setor = await database.query(`SELECT c.setor, s.is_ti FROM colaborador c JOIN setor s ON c.setor = s.idsetor WHERE c.idcolaborador = '${req.session.matricula}';`);
            if (setor[0][0].is_ti === true){
                res.status(403).render('erroUsuario', {erro: 'Usuários do setor de TI não podem criar CRMs!'});
            }
            else{
                let data = await database.query('SELECT * FROM setor');
                console.log(data[0]);
                res.render('criar-crm', {setores: data[0]});
            }
        }
    })
    .post(async function (req, res) {
        const c = await database.transaction();
        console.log(req.body);
        if (req.body.setores.length === 0){
            throw {message: 'Selecione pelo menos um setor.'};
        }
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
            await req.body.setores.forEach(setor => {
                models.SetoresEnvolvidos.create({
                    crm_idcrm: retorno + 1,
                    crm_versao: 1,
                    setor_idsetor: parseInt(setor)
                },
                {
                    fields: ['crm_idcrm', 'crm_versao', 'setor_idsetor']
                });
            })
            await c.commit();
            res.redirect('/home'); // Criar pagina de sucesso
        }
        catch(error){
            await c.rollback();
            res.render('criar-crm'); // Inserir informações de erro
        }
    });

app.route('/addUser')
    .get(async function (req, res) {
        if (!req.session.matricula){
            res.redirect('/authError');
        }
        else{
            let retorno = await database.query(`SELECT c.setor, s.is_ti FROM colaborador c JOIN setor s ON c.setor = s.idsetor WHERE c.idcolaborador = '${req.session.matricula}'`);
            if (retorno[0][0].is_ti === true){
                let data = await database.query('SELECT * FROM setor');
                res.render('cadastrar-usuario', {setores: data[0]});
            }
            else{
                res.status(403).render('erroUsuario', {erro: 'Você não tem autorização para cadastrar um novo usuário!'});
            }
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
    console.log(parseInt(req.query.id));
    if(isNaN(parseInt(req.query.id))){
        res.render('erroUsuario', {erro: 'Busca inválida! Insira um ID válido.'});
    }
    else{
        let retorno = await models.Crm.findOne({
            where: {
                idcrm: parseInt(req.query.id),
            },
            order: [['versao', 'DESC']]
        });
        if (retorno === null) {
            res.render('erroUsuario', {erro: `CRM #${req.query.id} não encontrado!`});
        } else {
            res.render('info-crm', {dados: retorno});
        }
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
            idcolaborador_criador: req.session.matricula,
            descricao: req.body.descricao,
            objetivo: req.body.objetivo,
            justificativa: req.body.justificativa,
            comportamentooffline: req.body.comportamentooffline,
            changelog: req.body.changelog
        },
        {
            fields: ['idcrm', 'versao', 'idcolaborador_criador', 'descricao', 'objetivo', 'justificativa', 'comportamentooffline', 'changelog']
        });
        await models.SetoresEnvolvidos.create({
            crm_idcrm: req.body.idcrm,
            crm_versao: retorno + 1,
            setor_idsetor: req.session.setor
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