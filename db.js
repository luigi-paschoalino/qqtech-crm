const Sequelize = require('sequelize');
const sequelize = new Sequelize('postgres', 'postgres', 'PostgreSQL', {dialect: 'postgres', host: 'localhost', timezone: '-03:00'});

async function conexao(){
    try{
        await sequelize.authenticate();
        console.log('Conectado com sucesso!');
    }
    catch(error){
        console.error('Não foi possível conectar ao banco de dados: ', error.message);
    }
}

conexao();

module.exports = sequelize;