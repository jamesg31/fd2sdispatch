const validator = require('mysql-validator');

exports.getIndex = (req, res, next) => {
    res.render('index', {
        path: '/',
        pageTitle: 'Alpaca Airways',
    });
};

exports.getFlights = (req, res, next) => {
    db.query('SELECT * FROM flights', (err, flights) => {
        res.render('flights', {
            path: '/',
            pageTitle: 'Alpaca Airways',
            data: flights
        });    
    });
};

exports.getNewFlight = (req, res, next) => {
    res.render('new-flight', {
        path: '/new-flight',
        pageTitle: 'Alpaca Airways'
    });
};

exports.postNewFlight = (req, res, next) => {
    var errors = [];
    var map = {
        date: 'date',
        name: 'varchar(32)',
        departure: 'varchar(4)',
        arrival: 'varchar(4)',
        callsign: 'varchar(4)'
    }    
    for (var key in map) {
        var err = validator.check(req.body[key], map[key]);
        // store the error's message and the field name
        if (err) errors.push({ name: key, error: err.message });
    }
    if (errors.length) {
        req.flash('error', 'Validation Error: Incorrect Syntax');
        return res.redirect('/new-flight');
    } else {
        var gates = {};
        gates[req.body.departure] = {};
        var depgates = req.body.gates1.split(', ');
        for (var i in depgates) {
            gates[req.body.departure][depgates[i]] = null;
        }
        if (req.body.both == 'true') {
            gates[req.body.arrival] = {};
            var arrgates = req.body.gates2.split(', ');
            for (var x in arrgates) {
                gates[req.body.arrival][arrgates[x]] = null;
            }
        }
        db.query('INSERT INTO flights (flight_name, flight_date, flight_departure, flight_arrival, flight_gates, flight_callsign, url, open) VALUES (?, ?, ?, ?, ?, ?, ?, true)',
        [req.body.name, req.body.date, req.body.departure, req.body.arrival, JSON.stringify(gates), req.body.callsign, req.body.name.toLowerCase().replace(' ', '-')], (err, result) => {
            if (err) throw err;
            res.redirect('/flights');
        });
    }
};

exports.getManage = (req, res, next) => {
    const url = req.params.url;

    db.query('SELECT * FROM flights WHERE url = ?', [url], (err, flight) => {
        if (err) throw err;
        gates = JSON.parse(flight[0].flight_gates);
        
        var gates2;
        if (gates[flight[0].flight_arrival] == undefined) {
            gates2 = '';
        } else {
            gates2 = Object.keys(gates[flight[0].flight_arrival]).join(', ');
        }

        var dateLarge = new Date(flight[0].flight_date);

        let date = JSON.stringify(dateLarge);
        date = date.slice(1,11);
                
        res.render('manage-flight', {
            path: '/manage/' + url,
            pageTitle: 'Alpaca Airways',
            data: flight[0],
            gates1: Object.keys(gates[flight[0].flight_departure]).join(', '),
            gates2: gates2,
            both: Object.keys(gates).length,
            date: date,
            id: flight[0].flight_id
        });
    });
};

exports.postManage = (req, res, next) => {
    var errors = [];
    var map = {
        date: 'date',
        name: 'varchar(32)',
        departure: 'varchar(4)',
        arrival: 'varchar(4)',
        callsign: 'varchar(4)'
    }    
    for (var key in map) {
        var err = validator.check(req.body[key], map[key]);
        // store the error's message and the field name
        if (err) errors.push({ name: key, error: err.message });
    }
    if (errors.length) {
        req.flash('error', 'Validation Error: Incorrect Syntax');
        return res.redirect('/new-flight');
    } else {
        var gates = {};
        gates[req.body.departure] = {};
        var depgates = req.body.gates1.split(', ');
        for (var i in depgates) {
            gates[req.body.departure][depgates[i]] = null;
        }
        if (req.body.both == 'true') {
            gates[req.body.arrival] = {};
            var arrgates = req.body.gates2.split(', ');
            for (var x in arrgates) {
                gates[req.body.arrival][arrgates[x]] = null;
            }
        }
        db.query('REPLACE INTO flights (flight_id, flight_name, flight_date, flight_departure, flight_arrival, flight_gates, flight_callsign, url, open) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)',
        [req.body.id, req.body.name, req.body.date, req.body.departure, req.body.arrival, JSON.stringify(gates), req.body.callsign, req.body.name.toLowerCase().replace(' ', '-')], (err, result) => {
            if (err) throw err;
            res.redirect('/flights');
        });    
    }
};