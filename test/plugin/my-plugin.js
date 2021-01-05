module.exports = {
    install: function (functions) {
        functions.add('pi', function () {
            return Math.PI;
        });
    }
};