var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const database = require('./db');
const models = require('./models');
const sequelize = require('./db');
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

app.get('/changelog', async function (req, res) {
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        let retorno = await database.query(`SELECT * FROM crm WHERE idcrm = ${req.query.id}`);
        if (retorno[0].length > 0){
            let data = await database.query(`SELECT * FROM crm WHERE idcrm = ${req.query.id} ORDER BY idcrm DESC, versao DESC`);
            res.render('changelog-crm', {crm: data[0]});
        }
        else{
            res.render('erroUsuario', {erro: 'CRM não encontrado'});
        }
        
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
                res.render('erroUsuario', {erro: 'Erro ao carregar CRMs'});
            }
        }
    });

app.route('/updateCRM')
    .get(async function (req, res) {
        if (!req.session.matricula){
            res.redirect('/authError');
        }
        else{
            let retorno = await database.query(`SELECT * FROM crm where idcrm = ${req.query.id} ORDER BY versao DESC LIMIT 1;`);
            if(retorno[0][0].idcolaborador_criador === req.session.matricula){
                let data = await database.query('SELECT * FROM setor');
                console.log(data[0]);
                res.render('atualizar-crm', {idcrm: req.query.id, setores: data[0], setorUsuario: req.session.setor, idcrm: req.query.id, descricao: retorno[0][0].descricao});
            }
            else{
                res.render('erroUsuario', {erro: 'Você não é o autor deste CRM.'});
            }
        }
    })
    .post(async function (req, res) {
        console.log(req.body);
        if(isNaN(parseInt(req.body.idcrm))){
            res.render('erroUsuario', {erro: 'Não é possível atualizar uma CRM com ID inválido!'});
        }
        else{
            const c = await database.transaction();
            try{
                let retorno = await models.Crm.max('versao', {
                    where: {
                        idcrm: parseInt(req.body.idcrm)
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
                    idcrm: parseInt(req.body.idcrm),
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
                }, {transaction: c});
                await req.body.setores.forEach(setor => {
                    models.SetoresEnvolvidos.create({
                        crm_idcrm: parseInt(req.body.idcrm),
                        crm_versao: retorno + 1,
                        setor_idsetor: parseInt(setor)
                    },
                    {
                        fields: ['crm_idcrm', 'crm_versao', 'setor_idsetor']
                    }, {transaction: c});
                });
                await c.commit();
                res.redirect('/home');
            }
            catch(error){
                await c.rollback();
                res.render('erroUsuario', {erro: 'Erro ao atualizar CRM'});
            }
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
                res.render('criar-crm', {setores: data[0], setorUsuario: req.session.setor});
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
            }, {transaction: c});
            await req.body.setores.forEach(setor => {
                models.SetoresEnvolvidos.create({
                    crm_idcrm: retorno + 1,
                    crm_versao: 1,
                    setor_idsetor: parseInt(setor)
                },
                {
                    fields: ['crm_idcrm', 'crm_versao', 'setor_idsetor']
                }, {transaction: c});
            });
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
    var crmAvaliada = null;
    if (!req.session.matricula){
        res.redirect('/authError');
    }
    else{
        try{
            console.log(parseInt(req.query.id));
            if(isNaN(parseInt(req.query.id))){
                throw {message: 'Insira um ID válido.'};
            }
            else{
                let retorno = await models.Crm.findOne({
                    where: {
                        idcrm: parseInt(req.query.id),
                    },
                    order: [['versao', 'DESC']]
                });
                let setores = await database.query(`SELECT s.nomesetor, se.flagsetor, se.sugestoes FROM setor s JOIN setoresenvolvidos se ON se.setor_idsetor = s.idsetor WHERE se.crm_idcrm = ${parseInt(req.query.id)} AND se.crm_versao = ${parseInt(retorno.versao)}`);
                if (retorno === null) {
                    throw {message: 'CRM não existe!'};
                } else {
                    let tipoUsuario = 3;
                    if (retorno.idcolaborador_criador === req.session.matricula){
                        tipoUsuario = 0; // 0 = criador, 1 = setor envolvido, 2 = TI, 3 = qualquer outro
                    }
                    else{
                        let setor = await database.query(`SELECT se.setor_idsetor, se.flagsetor FROM setoresenvolvidos se JOIN colaborador c ON se.setor_idsetor = c.setor WHERE se.crm_idcrm = ${retorno.idcrm} AND se.crm_versao = ${retorno.versao} AND c.idcolaborador = '${req.session.matricula}';`);
                        console.log(setor[0])
                        if (setor[0].length > 0){
                            tipoUsuario = 1;
                            if(setor[0][0].flagsetor !== null) {
                                crmAvaliada = true
                            } else {
                                crmAvaliada = false
                            }
                        }
                        else{
                            let setor = await database.query(`SELECT idsetor FROM setor WHERE is_ti = true AND idsetor = ${req.session.setor}`);
                            if (setor[0].length > 0){
                                tipoUsuario = 2;
                                if (retorno.flagti !== null){
                                    crmAvaliada = true;
                                }
                                else{
                                    crmAvaliada = false;
                                }
                            }
                            else{
                                tipoUsuario = 3;
                            }
                        }
                    }
                    console.log(setores[0], tipoUsuario, crmAvaliada);
                    res.render('info-crm', {dados: retorno, id: req.query.id, usuario: tipoUsuario, setores: setores[0], avaliacao: crmAvaliada});
                }
            }
        }
        catch(error){
            if (error.message === 'Cannot read property \'versao\' of null'){
                error.message = 'CRM não existe!';
            }
            res.status(404).render('erroUsuario', {erro: `Erro ao buscar CRM #${req.query.id}: ${error.message}`});
        }
    }
});


// POSTs

app.post('/avaliarCRM', async function (req, res) {
    const c = await database.transaction();
    if(req.body.feedback === 'aprovado'){
        var feedback = true
    }
    else{
        var feedback = false
    }
    try{
        await models.FeedbackCRM.create({
            colaborador_idcolaborador: req.session.matricula,
            crm_idcrm: req.body.idcrm,
            crm_versao: req.body.versao,
            tipoavaliacao: feedback,
        }, {transaction: c});
        let is_ti = await models.Setor.findOne({
            attributes: ['is_ti'],
            where: {
                idsetor: req.session.setor
            }
        });
        console.log(is_ti.is_ti, feedback);
        if (feedback === false){
            if (is_ti.is_ti === true){
                await models.Crm.update({
                    flagti: false,
                    etapaprocesso: 0
                },
                {
                    where: {
                        idcrm: req.body.idcrm,
                        versao: req.body.versao
                    },
                    transaction: c
                });
            } else {
                await models.Crm.update({
                    etapaprocesso: 0
                },
                {
                    where: {
                        idcrm: req.body.idcrm,
                        versao: req.body.versao
                    },
                    transaction: c
                });
            }
            await models.SetoresEnvolvidos.update({
                flagsetor: false,
                sugestoes: req.body.feedbackJust
            },
            {
                where: {
                    crm_idcrm: req.body.idcrm,
                    crm_versao: req.body.versao,
                    setor_idsetor: req.session.setor
                },
                transaction: c
            });
        } else {
            if (feedback === true){
                if (is_ti.is_ti === true){
                    await models.Crm.update({
                        flagti: true,
                    },
                    {
                        where: {
                            idcrm: req.body.idcrm,
                            versao: req.body.versao
                        },
                        transaction: c
                    });
                }
            await models.SetoresEnvolvidos.update({
                flagsetor: true
            },
            {
                where: {
                    crm_idcrm: req.body.idcrm,
                    crm_versao: req.body.versao,
                    setor_idsetor: req.session.setor
                },
                transaction: c
            });
            } else {
                throw {message: 'Erro na avaliação do CRM.'};
            }
        }
        await c.commit();
        let status = await database.query(`SELECT count(*), c.flagti FROM setoresenvolvidos s JOIN crm c ON s.crm_idcrm = c.idcrm AND s.crm_versao = c.versao WHERE s.crm_idcrm = ${req.body.idcrm} AND s.crm_versao = ${req.body.versao} AND s.flagsetor IS NOT true GROUP BY c.flagti`);
        console.log(status[0]);
        if(status[0].length === 0){
            await models.Crm.update({
                etapaprocesso: 2
            },
            {
                where: {
                    idcrm: req.body.idcrm,
                    versao: req.body.versao
                }
            });
        }
        res.redirect('/home');
    } catch(error){
        await c.rollback();
        res.render('erroUsuario', {erro: `Erro ao avaliar CRM #${req.body.idcrm}: ${error.message}`});
    }
});

app.post('/teste', async function (req, res) {
    res.json(req.body);
});

app.post('/arquivarCRM', async function (req, res) {
    let versao = await models.Crm.findOne({
        attributes: ['versao'],
        where: {
            idcrm: req.body.idcrm
        },
        order: [
            ['versao', 'DESC']
        ]
    });
    console.log(versao.dataValues.versao);
    try{
        await models.Crm.update({
            flagarquivamento: true,
            dataarquivamento: database.literal('CURRENT_TIMESTAMP')
        },
        {
            where: {
                idcrm: req.body.idcrm,
                versao: versao.dataValues.versao
            }
        });
        res.redirect('/home');
    } catch(error){
        res.render('erroUsuario', {erro: `Erro ao arquivar CRM #${req.body.idcrm}: ${error.message}`});
    }
});

// Ligando o servidor

app.listen(port, err => {
    if (err) {
        return console.log('Erro', err)
    }
    console.log('Projeto rodando na porta ' + port);
});