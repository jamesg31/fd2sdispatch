const url = require('url');
const fetch = require('node-fetch');
const FormData = require('form-data');

const config = require('../config');

exports.getLogin = (req, res, next) => {
    const queryObject = url.parse(req.url,true).query;
    const data = new FormData();
    var info;

    data.append('client_id', config.CLIENT_ID);
    data.append('client_secret', config.CLIENT_SECRET);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', config.REDIRECT_URI);
    data.append('scope', 'identity guilds');
    data.append('code', queryObject.code);

    fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: data,
    }).then(resp => resp.json()).then(info => {
        info = info;
        fetch('https://discordapp.com/api/users/@me', {
		headers: {
			authorization: `${info.token_type} ${info.access_token}`,
		}}).then(userresp => userresp.json()).then(userresp => {
            fetch('https://discordapp.com/api/users/@me/guilds', {
                headers: {
                    authorization: `${info.token_type} ${info.access_token}`,
                },
            }).then(guildresp => guildresp.json()).then(guildresp => {
                if (guildresp.filter(guildresp => guildresp.id == config.GUILD_ID).length == 0 && config.CHECK_GUILD == true) {
                    req.flash('error', 'Discord Authorization Failed');
                    return res.redirect('/');
                }
                if (guildresp.filter(guildresp => guildresp.id == config.GUILD_ID)[0].permissions == 2147483647) {
                    isAdmin = true;
                } else {
                    isAdmin = false;
                }
                db.query('SELECT * FROM users WHERE discord_id = ?', [userresp.id], (err, user) => {
                    if (user.length == 0) {
                        db.query('INSERT INTO users (discord_id, discord_username, discord_discriminator) VALUES (?, ?, ?)', [userresp.id, userresp.username, userresp.discriminator]);
                    }
                    req.session.discordId = userresp.id;
                    req.session.discordAuth = queryObject.code;
                    req.session.isAdmin = isAdmin;
                    return req.session.save(result => {
                        res.redirect('/');
                    });
                });
            });
        });
    });
};

exports.getLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};