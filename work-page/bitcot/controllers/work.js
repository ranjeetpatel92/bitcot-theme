/**
 * Work page of the bitcot theme
 */
function work(){}

//dependencies
var TopMenu        = require(DOCUMENT_ROOT + '/include/theme/top_menu');

//inheritance
util.inherits(work, pb.BaseController);

work.prototype.render = function(cb) {

    var self = this;
    var cos=new pb.CustomObjectService();
    var dao = new pb.DAO();

    pb.content.getSettings(function(err, contentSettings) {
        self.gatherData(function(err, data) {
            self.ts.reprocess = false;
            self.ts.registerLocal('meta_keywords', 'work');
            self.ts.registerLocal('meta_desc', 'works');
            self.ts.registerLocal('meta_title', 'Our-Work');
            self.ts.registerLocal('meta_lang', localizationLanguage);
            self.ts.registerLocal('current_url', self.req.url);
            self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
            self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));
            self.ts.registerLocal('completeProject', function(flag, cb) {
                cos.loadTypeByName('work', function (err, result) {
                    if (!result) {
                        cb(err, '[]');
                        return;
                    }
                    var options = {
                        fetch_depth: 3
                    };

                    var link = 'Link';
                    var completeProject = '';
                    cos.findByTypeWithOrdering(result, options, function (err, work) {

                        var tasks = pb.utils.getTasks(work, function(content, i) {
                            return function(callback) {
                                self.renderContent(content[i], callback);
                            };
                        });

                        async.parallel(tasks, function(err, results) {
                            cb(err, new pb.TemplateValue(results.join(''), false));
                        });
                    });
                });
            });
            self.ts.registerLocal('angular', function(flag, cb) {

                var loggedIn       = pb.security.isAuthenticated(self.session);
                //var commentingUser = loggedIn ? Comments.getCommentingUser(self.session.authentication.user) : null;

                var objects = {
                    contentSettings: contentSettings,
                    loggedIn: loggedIn,
                    //commentingUser: commentingUser,
                    themeSettings: data.nav.themeSettings,

                    //sideNavItems: sideNavItems,
                    trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                };
                var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                cb(null, angularData);
            });

            self.ts.load('work', function (err, result) {

                if (util.isError(err)) {
                    throw err;
                }
                cb({content: result});
            });
        });
    });
};

work.prototype.gatherData = function(cb) {
    var self  = this;
    var tasks = {

        //navigation
        nav: function(callback) {
            self.getNavigation(function(themeSettings, navigation, accountButtons) {
                callback(null, {themeSettings: themeSettings, navigation: navigation, accountButtons: accountButtons});
            });
        }
    };
    async.parallel(tasks, cb);
};

work.prototype.renderContent = function(result, cb) {
    var self = this;
    var ats = new pb.TemplateService(this.ls);
    ats.reprocess = false;
    ats.registerLocal('work_name', result.name);
    ats.registerLocal('work_title', result.title);    
    ats.registerLocal('work_url', result.url);
    ats.registerLocal('work_projectType', result.projectType);
    ats.registerLocal('work_projectThumb', result.projectThumb);
    ats.registerLocal('work_project_images', result.project_images);
	ats.registerLocal('work_description', result.description);

    ats.load('elements/work', cb);
};



//this method is used for object getNavigation
work.prototype.getNavigation = function(cb) {
    var options = {
        currUrl: this.req.url
    };
    TopMenu.getTopMenu(this.session, this.ls, options, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
            cb(themeSettings, navigation, accountButtons);
        });
    });
};

// Define the routes for the controller
work.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: "/works",
            auth_required: false,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

module.exports = work;



