const validator = require('mysql-validator');
var moment = require('moment');

exports.getNewBooking = (req, res, next) => {
    const url = req.params.url;

    db.query('SELECT * FROM flights WHERE url = ?', [url], (err, result) => {
        if (result.lenth < 1) {
            req.flash('error', 'Error: Flight Not Found');
            return res.redirect('/flights');
        } else if (result[0].open == 0) {
            req.flash('error', 'Error: Bookings for this flight are closed.');
            return res.redirect('/flights');
        }
        db.query('SELECT * FROM bookings WHERE discord_id = ? AND flight_id = ?', [req.session.discordId, result[0].flight_id], (err, booking) => {
            if (booking.length > 0) {
                req.flash('error', 'Error: You already have a booking for the selected flight.');
                res.redirect('/flights');
            } else {
                res.render('bookings/new-booking', {
                    path: '/',
                    pageTitle: 'Alpaca Airways',
                    data: result[0],
                    flight_start: moment.utc(moment.unix(result[0].flight_start)).format('YYYY-MM-DD HH:mm'),
                    flight_end: moment.utc(moment.unix(result[0].flight_end)).format('YYYY-MM-DD HH:mm')
                });    
            }
        });
    });
};

exports.postNewBooking = (req, res, next) => {
    const url = req.params.url;
    var errors = [];
    var map = {
        callsign: 'varchar(4)'
    };
    for (var key in map) {
        var err = validator.check(req.body[key], map[key]);
        if (err) errors.push({ name: key, error: err.message });
    }
    if (errors.length) {
        req.flash('error', 'Validation Error: Incorrect Syntax');
        return res.redirect('/new-booking/' + url);
    } else {
        db.query('SELECT * FROM flights WHERE url = ?', [url], (err, result) => {
            if (err) throw err;
            var times = [result[0].flight_start];
            while (times[times.length - 1] + 120 <= result[0].flight_end) {
                times.push(times[times.length - 1] + 120);
            }
            var requested = moment(req.body.time + 'Z').unix();
            times.sort((a, b) => Math.abs(requested - a) - Math.abs(requested - b));
            
            db.query('SELECT * FROM bookings WHERE flight_id = ?', [result[0].flight_id], (err, bookings) => {
                if (err) throw err;

                var a = 0;
                for (var i = 0; i < bookings.length; i++) {
                    if (a >= times.length - 1) {
                        req.flash('error', 'Error: No available time slots.');
                        res.redirect('/flights');
                    }
                    if (bookings[i].time == times[a]) {
                        i = 0;
                        a++;
                    }
                }
                
                var used = {};
                used[result[0].flight_departure] = [];
                used[result[0].flight_arrival] = [];

                for (var x = 0; x < bookings.length; x++) {
                    used[bookings[x].airport].push(bookings[x].gate);
                }

                var gates1 = JSON.parse(result[0].flight_gates)[result[0].flight_departure].filter(d => !used[result[0].flight_departure].includes(d));
                var gates2 = JSON.parse(result[0].flight_gates)[result[0].flight_arrival].filter(d => !used[result[0].flight_arrival].includes(d));
                var gate;
                var airport;

                if (gates1.length != 0) {
                    gate = gates1[0];
                    airport = result[0].flight_departure;
                } else if (gates2.length != 0) {
                    gate = gates2[0];
                    airport = result[0].flight_arrival;
                } else {
                    req.flash('error', 'Error: All gates occupied.');
                    res.redirect('/flights');
                }
                
                db.query('INSERT INTO bookings (flight_id, discord_id, gate, airport, time, callsign) VALUES (?, ?, ?, ?, ?, ?)', [result[0].flight_id, req.session.discordId, gate, airport, times[a], req.body.callsign], (err, result) => {
                    if (err) throw err;
                    res.redirect('/flights');    
                });
            });


        });        
    }
};

exports.postDeleteBooking = (req, res, next) => {
    db.query('DELETE FROM bookings WHERE flight_id = ? AND discord_id = ?', [req.body.id, req.session.discordId], (err, result) => {
        if (err) throw err;
        res.redirect('/flights');
    });
};