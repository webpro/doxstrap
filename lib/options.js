var optimist = require('optimist'),
    pkg = require('../package.json'),
    version = pkg.version;

optimist.usage('Usage: doxstrap [options]');

optimist.boolean('h');
optimist.alias('h', 'help');
optimist.describe('h', 'Print help');

optimist.boolean('v');
optimist.alias('v', 'version');
optimist.describe('v', 'Print version number');

optimist.boolean('V');
optimist.alias('V', 'verbose');
optimist.describe('V', 'Verbose output');

optimist.alias('s', 'source');
optimist.default('s', 'src/**/*.js');
optimist.describe('s', 'Source files');

optimist.alias('o', 'output');
optimist.describe('o', 'Directory to render output');

optimist.alias('t', 'title');
optimist.default('t', 'Documentation');
optimist.describe('t', 'Document title');

module.exports = {
    version: function() {
        console.log('v' + version);
    },
    help: function() {
        console.log(optimist.help());

    },
    parse: function(argv) {
        var options = optimist.parse(argv);
        if(options._[0] && !options.output) {
            options.output = options.o = options._[0];
        }
        return options;
    }
};
