const Sequelize = require('sequelize');
const database = require('./db');

const Colaborador = database.define('colaborador', {
    idcolaborador: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    setor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'setor',
            key: 'idsetor'
        }
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    sobrenome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    }
},
{
    freezeTableName: true,
    timestamps: false
});

const Setor = database.define('setor', {
    idsetor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nomesetor: {
        type: Sequelize.STRING,
        allowNull: false
    },
    is_ti: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},
{
    freezeTableName: true,
    timestamps: false
});

const Crm = database.define('crm', {
    idcrm: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    versao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    idcolaborador_criador: {
        type: Sequelize.STRING,
        allowNull: false
    },
    descricao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    objetivo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    justificativa: {
        type: Sequelize.STRING,
        allowNull: false
    },
    dataabertura: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    dataarquivamento: {
        type: Sequelize.DATE,
        allowNull: true
    },
    etapaprocesso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    flagti: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    flagarquivamento: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    changelog: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Versão inicial'
    },
    comportamentooffline: {
        type: Sequelize.STRING,
        allowNull: true
    }
},
{
    freezeTableName: true,
    timestamps: false
});

const Documento = database.define('documento', {
    iddocumento: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    crm_idcrm: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    crm_versao: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    enderecodoc: {
        type: Sequelize.STRING,
        allowNull: false
    }
},
{
    freezeTableName: true,
    timestamps: false
});

const FeedbackCRM = database.define('feedbackcrm', {
    colaborador_idcolaborador: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    crm_idcrm: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    crm_versao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    tipoavaliacao: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
},
{
    freezeTableName: true,
    timestamps: false
});

const SetoresEnvolvidos = database.define('setoresenvolvidos', {
    crm_idcrm: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    crm_versao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    setor_idsetor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    flagsetor: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    sugestoes: {
        type: Sequelize.STRING,
        allowNull: true
    }
},
{
    freezeTableName: true,
    timestamps: false
});

module.exports = { Colaborador, Setor, Crm, Documento, FeedbackCRM, SetoresEnvolvidos, Sequelize };
