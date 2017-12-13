var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var open = require('open');

var path = {
    src : 'resources/assets/',
    dest : 'public/assets/',
};

gulp.task('concatCommonCss', function () {
    gulp.src(path.src + 'common/*.css')
        .pipe($.concat('common.css'))
        .pipe(gulp.dest(path.dest + 'css/'))
        .pipe($.minifyCss())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(path.dest + 'css/'))
        .pipe($.connect.reload())
    ;
});

gulp.task('concatCommonJs', function () {
    gulp.src(path.src + 'common/*.js')
        .pipe($.concat('common.js'))
        .pipe(gulp.dest(path.dest + 'js/'))
        .pipe($.uglify())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(path.dest + 'js/'))
        .pipe($.connect.reload())
    ;
});

gulp.task('moveModuleCss', function () {
    gulp.src(path.src + 'module/*.css')
        .pipe(gulp.dest(path.dest + 'css/module/'))
        .pipe($.minifyCss())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(path.dest + 'css/module/'))
        .pipe($.connect.reload())
    ;
});

gulp.task('moveModuleJs', function () {
    gulp.src(path.src + 'module/*.js')
        .pipe(gulp.dest(path.dest + 'js/module/'))
        .pipe($.uglify())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(path.dest + 'js/module/'))
        .pipe($.connect.reload())
    ;
});

gulp.task('moveIframeCss', function () {
    gulp.src(path.src + 'iframe/*.css')
        .pipe(gulp.dest(path.dest + 'css/iframe/'))
        .pipe($.minifyCss())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(path.dest + 'css/iframe/'))
        .pipe($.connect.reload())
    ;
});

gulp.task('moveIframeJs', function () {
    gulp.src(path.src + 'iframe/*.js')
        .pipe(gulp.dest(path.dest + 'js/iframe/'))
        .pipe($.uglify())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(path.dest + 'js/iframe/'))
        .pipe($.connect.reload())
    ;
});

gulp.task('clean', function () {
    gulp.src([path.dest + 'css/module/', path.dest + 'js/module/'])
        .pipe($.clean())
    ;
});

gulp.task('build', ['concatCommonCss', 'concatCommonJs', 'moveModuleCss', 'moveModuleJs', 'moveIframeCss', 'moveIframeJs']);

gulp.task('watch', function () {
    gulp.watch(path.src + 'common/*.css', ['concatCommonCss']);
    gulp.watch(path.src + 'common/*.js',  ['concatCommonJs']);
    gulp.watch(path.src + 'module/*.css', ['moveModuleCss']);
    gulp.watch(path.src + 'module/*.js',  ['moveModuleJs']);
    gulp.watch(path.src + 'iframe/*.css', ['moveIframeCss']);
    gulp.watch(path.src + 'iframe/*.js',  ['moveIframeJs']);
});

gulp.task('default', ['build', 'watch']);