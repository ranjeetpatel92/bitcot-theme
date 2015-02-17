/**
 * Blog2 page of the Bitcot theme
 */
function Blog2(){}

//dependencies
var PluginService = pb.PluginService;
var TopMenu        = require(DOCUMENT_ROOT + '/include/theme/top_menu');
var ArticleService = require(DOCUMENT_ROOT + '/include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(Blog2, pb.BaseController);

Blog2.prototype.render = function(cb) {

    var self = this;
    //determine and execute the proper call
    var article = self.req.pencilblue_article || null;
    var page    = self.req.pencilblue_page    || null;

    pb.content.getSettings(function(err, contentSettings) {
        self.gatherData(function(err, data) {
            ArticleService.getMetaInfo(data.content[0], function(metaKeywords, metaDescription, metaTitle) {
                self.ts.reprocess = false;
                self.ts.registerLocal('meta_keywords', metaKeywords);
                self.ts.registerLocal('meta_desc', metaDescription);
                self.ts.registerLocal('meta_title', metaTitle);
                self.ts.registerLocal('meta_lang', localizationLanguage);
                self.ts.registerLocal('current_url', self.req.url);
                self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
                self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));
                self.ts.registerLocal('infinite_scroll', function(flag, cb) {
                    if(article || page) {
                        cb(null, '');
                    }
                    else {
                        var infiniteScrollScript = pb.js.includeJS('/js/infinite_article_scroll.js');
                        cb(null, new pb.TemplateValue(infiniteScrollScript, false));
                    }
                });

                self.ts.registerLocal('pages', function(flag, cb) {
                    //var mycount=0;
                    var tasks = pb.utils.getTasks(data.content, function(content, i) {
                        return function(callback) {
                            if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not throug hackery
                                callback(null, '');
                                return;
                            }
                            self.renderContent(content[i], contentSettings, data.nav.themeSettings, i, callback);
                        };
                    });
                    async.parallel(tasks, function(err, result) {
                        cb(err, new pb.TemplateValue(result.join(''), false));
                    });
                });

                self.ts.load('blog_articles', function(err, result) {
                    if (util.isError(err)) {
                        throw err;
                    }
                    cb({content: result});
                });
            });
        });
    });
};

Blog2.prototype.gatherData = function(cb) {
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

Blog2.prototype.loadContent = function(articleCallback) {

    var article = this.req.pencilblue_article || null;
    var page    = this.req.pencilblue_page    || null;

    var service = new ArticleService();
    if(this.req.pencilblue_preview) {
        if(this.req.pencilblue_preview == page || article) {
            if(page) {

                service.setContentType('page');
            }
            var where = pb.DAO.getIDWhere(page || article);
            where.draft = {$exists: true};
            where.publish_date = {$exists: true};
            service.find(where, articleCallback);
        }
        else {
            service.find({}, articleCallback);
        }
    }
    else if(article) {
        service.findById(article, articleCallback);

    }
    else if(page) {
        service.setContentType('page');
        service.findById(page, articleCallback);
    }
    else{
        service.find({}, articleCallback);
    }
};

Blog2.prototype.renderContent = function(content, contentSettings, themeSettings, index, cb) {
    var self = this;
    if(index%2==0)
    {
        var floatclass='left fade-right';
    }
    else
    {
        var floatclass='right fade-left';
    }
    var isPage        = content.object_type === 'page';
    var showByLine    = contentSettings.display_bylines && !isPage;
    var showTimestamp = contentSettings.display_timestamp && !isPage;
    var ats           = new pb.TemplateService(this.ls);
    var contentUrlPrefix = isPage ? '/page/' : '/article/';
    self.ts.reprocess = false;
    ats.registerLocal('floatclass', floatclass);
    ats.registerLocal('article_permalink', pb.UrlService.urlJoin(pb.config.siteRoot, contentUrlPrefix, content.url));
    ats.registerLocal('article_headline', new pb.TemplateValue('<a href="' + pb.UrlService.urlJoin(contentUrlPrefix, content.url) + '">' + content.headline + '</a>', false));
    ats.registerLocal('article_headline_nolink', content.headline);
    ats.registerLocal('article_subheading', content.subheading ? content.subheading : '');
    ats.registerLocal('article_subheading_display', content.subheading ? '' : 'display:none;');
    ats.registerLocal('article_id', content._id.toString());
    ats.registerLocal('article_index', index);
    ats.registerLocal('article_timestamp', showTimestamp && content.timestamp ? content.timestamp : '');
    ats.registerLocal('article_timestamp_display', showTimestamp ? '' : 'display:none;');
    ats.registerLocal('article_layout', new pb.TemplateValue(content.layout, false));
    ats.registerLocal('article_url', content.url);
    ats.registerLocal('media_body_style', content.media_body_style ? content.media_body_style : '');
    ats.load('elements/page', cb);
};

Blog2.prototype.getNavigation = function(cb) {
    var options = {
        currUrl: this.req.url
    };
    TopMenu.getTopMenu(this.session, this.ls, options, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
            cb(themeSettings, navigation, accountButtons);
        });
    });
};

/**
 * @param cb A callback of the form: cb(error, array of objects)
 */
Blog2.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/blog',
            auth_required: false,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = Blog2;
