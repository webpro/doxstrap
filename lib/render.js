var gs = require('glob-stream');
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    Promise = require('bluebird'),
    dox = require('dox'),
    Handlebars = require('handlebars');

var readFile = Promise.promisify(fs.readFile);

Handlebars.registerHelper('notEmpty', function(a, b, options) {
    if (!_.isEmpty(a) || !_.isEmpty(b)) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

var templatePath = path.resolve(__dirname, '..', 'template', 'default.html'),
    template = fs.readFileSync(templatePath, {encoding: 'utf8'}),
    tpl = Handlebars.compile(template);

module.exports = function(options) {

    var stream = gs.create([options.source]),
        files = [],
        docs = {};

    return new Promise(function(resolve, reject) {

        stream.on('data', function(file) {

            var module = path.relative(file.base, file.path).replace(/\.js$/, '');

            docs[module] = {
                name: module,
                title: prettifyTitle(module),
                comments: [],
                members: [],
                private_members: []
            };

            files.push(readFile(file.path, {encoding: 'utf8'}).then(function(data) {

                var blocks = dox.parseComments(data);

                _.forEach(blocks, function(block) {

                    var result = {
                        module: module,
                        description: block.description,
                        return: _.filter(block.tags, {type: 'return'})[0],
                        chainable: !!_.find(block.tags, {type: 'chainable'}),
                        private: !!_.find(block.tags, {type: 'private'}),
                        code: block.code,
                        examples: _.pluck(_.filter(block.tags, {type: 'example'}), 'string'),
                        name: block.ctx ? block.ctx.name : ''
                    };

                    result.params = _.map(_.filter(block.tags, {type: 'param'}), function(param) {
                        var hasDefault = param.name.match(/[^=]*=(.*)/);
                        param.default = hasDefault ? hasDefault[1] : null;
                        param.optional = /^\[/.test(param.name);
                        param.title = param.name.replace(/^\[/, '').replace(/\]$/, '').replace(/([^=]*).*/, '$1');
                        return param;
                    });

                    result.cleanParams = _.filter(result.params, function(param) {
                        return param.name.indexOf('.') === -1;
                    });

                    if (!result.examples.length) {
                        result.examples[0] = '// Sorry, no example available.';
                    }

                    if (result.name) {
                        result.id = result.name.replace(/\$/g, 'dollar');
                        if (!result.private) {
                            docs[module].members.push(result);
                        } else {
                            docs[module].private_members.push(result.id);
                        }
                    }
                });
            }));
        });

        stream.on('end', function() {

            Promise.all(files).then(function() {

                var filteredDocs = _.filter(docs, function(doc) {
                    return !!doc.members.length;
                });

                resolve(tpl({
                    title: options.title,
                    docs: _.sortBy(filteredDocs, 'title')
                }));

            });
        });
    });
};

function prettifyTitle(value) {

    var mapping = {
        'api': 'API',
        'noconflict': 'noConflict',
        'css': 'CSS',
        'dom': 'DOM',
        'dom_extra': 'DOM (extra)',
        'html': 'HTML',
        'selector_extra': 'Selector (extra)'
    };

    if (value in mapping) {
        return mapping[value];
    }

    value = value.replace(/\/index$/, '');

    return value.charAt(0).toUpperCase() + value.slice(1);
}
