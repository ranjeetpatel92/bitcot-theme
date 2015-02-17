/**
 * Work page of the bitcot theme
 */
function work(){}

//dependencies
var TopMenu        = require(DOCUMENT_ROOT + '/include/theme/top_menu');
var ArticleService = require(DOCUMENT_ROOT + '/include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(work, pb.BaseController);

work.prototype.render = function(cb) {

    var self = this;
    var cos=new pb.CustomObjectService();
    var dao = new pb.DAO();

    pb.content.getSettings(function(err, contentSettings) {
        self.gatherData(function(err, data) {
        ArticleService.getMetaInfo(data.content[0], function(metaKeywords, metaDescription, metaTitle) {

            self.ts.reprocess = false;
            self.ts.registerLocal('meta_keywords', 'work');
            self.ts.registerLocal('meta_desc', 'works');
            self.ts.registerLocal('meta_title', 'Our-Work');
            self.ts.registerLocal('meta_lang', localizationLanguage);
            self.ts.registerLocal('current_url', self.req.url);
            self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
            self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));

        cos.loadTypeByName('work', function (err, result) {
            if (!result) {
                cb(err, '[]');
                return;
            }
            var options = {
                fetch_depth: 3
            };

            var link='Link';
            var completeProject='';

        cos.findByTypeWithOrdering(result, options, function (err, result) {
            for (var i = 0; i < result.length; i++) {

                completeProject = completeProject +'<div class="col-md-3 col-sm-6 project-item '+result[i].projectType +'">'+

                '<div class="project-thumb">'+

                    '<a href="#" class="main-link">'+
                         '<img class="img-responsive img-center" src="'+result[i].projectThumb +'"  alt="">'+
                            '<h2 class="project-title">'+ result[i].name +'</h2>'+
                         '<span class="overlay-mask">'+'</span>'+
                    '</a>'+

                     '<a class="enlarge" href="'+result[i].projectThumb +'" title="'+ result[i].name +'">'+
                          '<i class="fa fa-expand fa-fw">'+'</i>'+
                     '</a>'+

                     '<a name="'+result[i].projectType +'" class="link" href="#" android="/media/2015/2/android.png" ios="/media/2015/2/ios.png" iPad="/media/2015/2/iPad.png" web="/media/2015/2/web.png">'+
                           '<i class="fa fa-eye fa-fw">'+'</i>'+
                     '</a>'+

                     '</div>'+

                        '<div class="preview-content" data-images="'+ result[i].project_images +'">'+

                            '<p class="preview-subtitle">'+ result[i].title +'</p>'+
                            '<p>'+ result[i].description +'</p>'+

                            '<p class="text-center">'+
                                 '<a title="" data-original-title="" class="btn btn-qubico" href="'+ result[i].url +'" target="_blank">'+
                                      link +
                                  '</a>'+
                            '</p>'+

                        '</div>'+

                '</div>';

            self.ts.registerLocal('completeProject', new pb.TemplateValue(completeProject, false));
         }
       });
    });

            self.ts.registerLocal('angular', function(flag, cb) {

                var loggedIn       = pb.security.isAuthenticated(self.session);
                //var commentingUser = loggedIn ? Comments.getCommentingUser(self.session.authentication.user) : null;
                var heroImage      = null;
                if(data.content[0]) {
                    heroImage = data.content[0].hero_image ? data.content[0].hero_image: null;
                }

                var objects = {
                    contentSettings: contentSettings,
                    loggedIn: loggedIn,
                    //commentingUser: commentingUser,
                    themeSettings: data.nav.themeSettings,
                    articles: data.content,
                    hero_image: heroImage,
                    //sideNavItems: sideNavItems,
                    trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                };
                var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                cb(null, angularData);
            });
    self.ts.load('work', function(err, result) {

        if (util.isError(err)) {
            throw err;
        }
        cb({content: result});
        });
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
        },

        //articles, pages, etc.
        content: function(callback) {
            self.loadContent(callback);
        }
    };
    async.parallel(tasks, cb);
};

work.prototype.loadContent = function(articleCallback) {

    var service = new ArticleService();
    //if(this.req.pencilblue_preview) {
    //}
    //else{
        service.find({}, articleCallback);
    //}
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

// Export the controller so it can be loaded into the application
module.exports = work;



