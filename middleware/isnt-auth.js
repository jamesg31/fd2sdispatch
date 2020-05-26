module.exports = (req, res, next) => {
    if (req.session.discordId) {
        return res.redirect('/');
    }
    next();
};