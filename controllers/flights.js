const validator = require('mysql-validator');
var moment = require('moment');

exports.getFlights = (req, res, next) => {
    db.query('SELECT * FROM flights', (err, flights) => {
        if (err) throw err;
        db.query('SELECT * FROM bookings WHERE discord_id = ?', [req.session.discordId], (err, bookings) => {
            var flight_start = [];
            var flight_end = [];
            var booked = [];
            var booked_ids = [];
            for (a = 0; a < Object.keys(bookings).length; a++) {
                booked_ids.push(bookings[a].flight_id);
            }
            for(i = 0; i < Object.keys(flights).length; i++) {
                flight_start.push(moment.utc(moment.unix(flights[i].flight_start)).format('YYYY-MM-DD HH:mm') + 'z');
                flight_end.push(moment.utc(moment.unix(flights[i].flight_end)).format('YYYY-MM-DD HH:mm') + 'z');
                booked.push(booked_ids.includes(flights[i].flight_id));
            }
            if (err) throw err;
            res.render('flights/flights', {
                path: '/',
                pageTitle: 'Alpaca Airways',
                data: flights,
                flight_start: flight_start,
                flight_end: flight_end,
                bookings: booked
            });   
        });
    });
};

exports.getRoster = (req, res, next) => {
    const url = req.params.url;
    db.query('SELECT * FROM flights WHERE url = ?', [url], (err, result) => {
        if (err) throw err;
        db.query('SELECT * FROM bookings WHERE flight_id = ?', [result[0].flight_id], (err, bookings) => {
            if (err) throw err;
            discords = [];
            for (i = 0; i < Object.keys(bookings).length; i++) {
                discords.push(bookings[i].discord_id);
            }
            db.query('SELECT * FROM users', (err, users) => {
                if (err) throw err;
                var discord_accounts = {};
                for(i = 0; i < Object.keys(users).length; i++) {
                    if (discords.includes(users[i].discord_id)) {
                        discord_accounts[users[i].discord_id] = users[i].discord_username + '#' + users[i].discord_discriminator;
                    }
                }
                var time = [];
                var discord = [];
                for(i = 0; i < Object.keys(bookings).length; i++) {
                    time.push(moment.utc(moment.unix(bookings[i].time)).format('YYYY-MM-DD HH:mm') + 'z');
                    discord.push(discord_accounts[bookings[i].discord_id]);
                }
                
                res.render('flights/roster', {
                    path: '/',
                    pageTitle: 'Alpaca Airways',
                    data: bookings,
                    time: time,
                    discord: discord,
                    flight_data: result[0],
                    flight_start: moment.utc(moment.unix(result[0].flight_start)).format('YYYY-MM-DD HH:mm'),
                    flight_end: moment.utc(moment.unix(result[0].flight_end)).format('YYYY-MM-DD HH:mm')        
                });    
            });
        });
    });
};

exports.getNewFlight = (req, res, next) => {
    res.render('flights/new-flight', {
        path: '/new-flight',
        pageTitle: 'Alpaca Airways'
    });
};

exports.postNewFlight = (req, res, next) => {
    var errors = [];
    var map = {
        name: 'varchar(32)',
        departure: 'varchar(4)',
        arrival: 'varchar(4)',
        callsign: 'varchar(4)'
    };
    for (var key in map) {
        var err = validator.check(req.body[key], map[key]);
        if (err) errors.push({ name: key, error: err.message });
    }
    if (errors.length) {
        req.flash('error', 'Validation Error: Incorrect Syntax');
        return res.redirect('/new-flight');
    } else {
        var gates = {};
        gates[req.body.departure] = [];
        var depgates = req.body.gates1.split(', ');
        for (var i in depgates) {
            gates[req.body.departure].push(depgates[i]);
        }
        if (req.body.both == 'true') {
            gates[req.body.arrival] = [];
            var arrgates = req.body.gates2.split(', ');
            for (var x in arrgates) {
                gates[req.body.arrival].push(arrgates[x]);
            }
        }

        db.query('INSERT INTO flights (flight_name, flight_start, flight_end, flight_departure, flight_arrival, flight_gates, flight_callsign, open) VALUES (?, ?, ?, ?, ?, ?, ?, true)',
        [req.body.name, moment(req.body.start + 'Z').unix(), moment(req.body.end + 'Z').unix(), req.body.departure, req.body.arrival, JSON.stringify(gates), req.body.callsign], (err, result) => {
            if (err) throw err;
            db.query('UPDATE flights SET url = ? WHERE flight_id = ?', [result.insertId + '-' + req.body.name.toLowerCase().replace(/ /g, '-'), result.insertId], (err, result) => {
                if (err) throw err;
                res.redirect('/flights');    
            });
        });
    }
};

exports.getManage = (req, res, next) => {
    const url = req.params.url;

    db.query('SELECT * FROM flights WHERE url = ?', [url], (err, flight) => {
        if (err) throw err;
        if (flight.length < 1) {
            req.flash('error', 'Error: Flight Not Found');
            return res.redirect('/flights');
        }

        gates = JSON.parse(flight[0].flight_gates);
        
        var gates2;
        if (gates[flight[0].flight_arrival] == undefined) {
            gates2 = '';
        } else {
            gates2 = gates[flight[0].flight_arrival].join(', ');
        }

        var dateLarge = new Date(flight[0].flight_date);

        let date = JSON.stringify(dateLarge);
        date = date.slice(1,11);
                
        res.render('flights/manage-flight', {
            path: '/manage/' + url,
            pageTitle: 'Alpaca Airways',
            data: flight[0],
            gates1: gates[flight[0].flight_departure].join(', '),
            gates2: gates2,
            both: Object.keys(gates).length,
            flight_start: moment.utc(moment.unix(flight[0].flight_start)).format('YYYY-MM-DD HH:mm'),
            flight_end: moment.utc(moment.unix(flight[0].flight_end)).format('YYYY-MM-DD HH:mm'),
            id: flight[0].flight_id
        });
    });
};

exports.postManage = (req, res, next) => {
    var errors = [];
    var map = {
        name: 'varchar(32)',
        departure: 'varchar(4)',
        arrival: 'varchar(4)',
        callsign: 'varchar(4)'
    };
    for (var key in map) {
        var err = validator.check(req.body[key], map[key]);
        if (err) errors.push({ name: key, error: err.message });
    }
    if (errors.length) {
        req.flash('error', 'Validation Error: Incorrect Syntax');
        return res.redirect('/new-flight');
    } else {
        var gates = {};
        gates[req.body.departure] = [];
        var depgates = req.body.gates1.split(', ');
        for (var i in depgates) {
            gates[req.body.departure].push(depgates[i]);
        }
        if (req.body.both == 'true') {
            gates[req.body.arrival] = [];
            var arrgates = req.body.gates2.split(', ');
            for (var x in arrgates) {
                gates[req.body.arrival].push(arrgates[x]);
            }
        }
        db.query('REPLACE INTO flights (flight_id, flight_name, flight_start, flight_end, flight_departure, flight_arrival, flight_gates, flight_callsign, url, open) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)',
        [req.body.id, req.body.name, moment(req.body.start + 'Z').unix(), moment(req.body.end + 'Z').unix(), req.body.departure, req.body.arrival, JSON.stringify(gates), req.body.callsign, req.body.id + '-' + req.body.name.toLowerCase().replace(/ /g, '-')], (err, result) => {
            if (err) throw err;
            res.redirect('/flights');
        });    
    }
};

exports.postDelete = (req, res, next) => {
    db.query('DELETE FROM flights WHERE flight_id = ?', [req.body.id], (err, result) => {
        if (err) throw err;
        res.redirect('/flights');
    });
};

exports.postClose = (req, res, next) => {
    db.query('UPDATE flights SET open = ? WHERE flight_id = ?', [false, req.body.id], (err, result) => {
        if (err) throw err;
        res.redirect('/flights');
    });
};

exports.postOpen = (req, res, next) => {
    db.query('UPDATE flights SET open = ? WHERE flight_id = ?', [true, req.body.id], (err, result) => {
        if (err) throw err;
        res.redirect('/flights');
    });
};