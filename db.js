const Sequelize = require('sequelize');
const sequelize = new Sequelize('postgres', 'postgres', 'postgres', {dialect: 'postgres', host: 'localhost'});

async function conexao(){
    try{
        await sequelize.authenticate();
        console.log('Conectado com sucesso!');
    }catch(error){
        console.error('Não foi possível conectar ao banco de dados: ', error.message);
    }
}

// Teste de consulta no banco de dados (QUERY ESTÁ NO DISCORD)

async function consulta(){
    const [results, metadata] = await sequelize.query("SELECT * FROM colaborador JOIN setor ON colaborador.setor = setor.idsetor");
    console.log(results[0].nome, results[0].sobrenome, results[0].setor, results[0].nomesetor);
}

conexao();

consulta();



module.exports = sequelize;