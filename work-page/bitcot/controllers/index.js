/**
 * Index - The home page controller of the Bitcot theme.
 */
function Index() {}

//dependencies
var PluginService = pb.PluginService;
var TopMenu       = require(DOCUMENT_ROOT + '/include/theme/top_menu');
var MediaLoader = require(path.join(DOCUMENT_ROOT, '/include/service/entities/article_service')).MediaLoader;

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
    var self = this;
    var content = {
        content_type: "text/html",
        code: 200
    };
    var options = {
        currUrl: this.req.url
    };
    TopMenu.getTopMenu(self.session, self.ls, options, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
            pb.plugins.getSettings('bitcot', function(err, portfolioSettings) {
                var homePageKeywords = '';
                var homePageDescription = '';
                for(var i = 0; i < portfolioSettings.length; i++) {
                    switch(portfolioSettings[i].name) {
                        case 'home_page_keywords':
                            homePageKeywords = portfolioSettings[i].value;
                            break;
                        case 'home_page_description':
                            homePageDescription = portfolioSettings[i].value;
                            break;
                        default:
                            break;
                    }
                }
                self.ts.registerLocal('meta_keywords', homePageKeywords);
                self.ts.registerLocal('meta_desc', homePageDescription);
                self.ts.registerLocal('meta_title', pb.config.siteName);
                self.ts.registerLocal('meta_lang', localizationLanguage);
                self.ts.registerLocal('current_url', self.req.url);
                self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
                self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
                self.ts.load('landing_page', function(err, template) {
                    if(util.isError(err)) {
                        content.content = '';
                    }
                    else {
                        content.content = template;
                    }

                    var dao = new pb.DAO();
                    dao.query('bitcot_theme_settings', {settings_type: 'home_page'}).then(function(settings) {
                        if(settings.length > 0) {
                            settings = settings[0];
                        }

                        //remove any callouts that are blank. If the home page
                        //settings for the plugin have not been set it is
                        //possible for the setting to be empty.  Therefore we
                        //must put in a fall back plan of an empty array.
                        var callouts = settings.callouts || [];
                        for(var i = callouts.length - 1; i >= 0; i--) {
                            if(typeof callouts[i].copy === 'undefined' || !callouts[i].copy.length) {
                                callouts.splice(i, 1);
                            }
                        }
                        content.content = content.content.split('^display_callouts^').join(callouts.length ? '' : 'display: none');

                        var colWidth = Math.floor(12 / callouts.length) + '';
                        self.ts.registerLocal('col_width', colWidth);
                        self.ts.load('elements/callout', function(err, template) {
                            if(util.isError(err)) {
                                template = '';
                            }

                            var calloutsHTML = '';
                            for(var i = 0; i < callouts.length; i++) {
                                var calloutTemplate = template.split('^copy^').join(callouts[i].copy);
                                if(callouts[i].headline && callouts[i].headline.length) {
                                    if(callouts[i].link && callouts[i].link.length) {
                                        calloutTemplate = calloutTemplate.split('^headline^').join('<h3><a href="' + callouts[i].link + '">' + callouts[i].headline + '</a></h3>');
                                    }
                                    else {
                                        calloutTemplate = calloutTemplate.split('^headline^').join('<h3>' + callouts[i].headline + '</h3>');
                                    }
                                }
                                else {
                                    calloutTemplate = calloutTemplate.split('^headline^').join('');
                                }

                                calloutsHTML += calloutTemplate;
                            }


                            if(!settings.page_layout) {
                                settings.page_layout = '';
                            }
                            var mediaLoader = new MediaLoader();
                            mediaLoader.start(settings.page_layout, function(err, layout) {
                                content.content = content.content.split('^layout^').join(layout);
                                content.content = content.content.split('^hero_image^').join(settings.home_page_hero ? settings.home_page_hero : '');
                                content.content = content.content.split('^callouts^').join(calloutsHTML);

                                content.content = self.ls.localize([], content.content);

                                var angularData = pb.js.getAngularController({}, ['ngSanitize']);
                                content.content = content.content.concat(angularData);

                                cb(content);
                            });
                        });
                    });
                });
            });
        });
    });
};

Index.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/',
            auth_required: false,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = Index;
