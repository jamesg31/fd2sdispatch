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
        console.log(gates);
        db.query('INSERT INTO flights (flight_name, flight_date, flight_departure, flight_arrival, flight_gates, flight_callsign, url, open) VALUES (?, ?, ?, ?, ?, ?, ?, true)',
        [req.body.name, req.body.date, req.body.departure, req.body.arrival, JSON.stringify(gates), req.body.callsign, req.body.name.toLowerCase().replace(' ', '-')], (err, result) => {
            if (err) throw err;
            res.redirect('/flights');
        });
    }
};