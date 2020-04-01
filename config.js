const Config = {
    development: {
        mongoUrl: 'mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority',
        dbName: 'dashboard'
    },
    production: {
        mongoUrl: 'mongodb+srv://mike:hellman@dashboard-vcavt.azure.mongodb.net/test?retryWrites=true&w=majority',
        dbName: 'dashboard'
    },
    redesign: {
        mongoUrl: 'mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority',
        dbName: 'dashboard-new'
    }
}

module.exports = Config[process.env.NODE_ENV] || Config.development;