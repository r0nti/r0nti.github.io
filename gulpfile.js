"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var sass = require("gulp-sass");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var csso = require("gulp-csso");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var del = require("del");
var uglify = require("gulp-uglify");
var pump = require("pump");

gulp.task("copy", function() {
    return gulp.src([
      "source/fonts/**/*.{woff,woff2}",
      "source/images/**",
      "source/js/**"
      ], {
        base: "source"
      })
      .pipe(gulp.dest("build"));
    });

  gulp.task("clean", function() {
    return del("build");
  });

  gulp.task("css", function () {
    return gulp.src("source/sass/style.scss")
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(sass())
      .pipe(postcss([
        autoprefixer()
      ]))
      .pipe(csso())
      .pipe(rename("style.min.css"))
      .pipe(sourcemap.write("."))
      .pipe(gulp.dest("build/css"))
      .pipe(server.stream());
  });

  gulp.task("compress", function(cb) {
    pump([
      gulp.src("source/js/*.js"),
      rename(({ suffix: '.min' })),
      uglify(),
      gulp.dest("build/js")
      ],
    cb
    );
  });

  gulp.task("images", function () {
    return gulp.src("source/images/**/*.{png,jpg,jpeg,svg}")
      .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.mozjpeg({quality: 75, progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo()
      ]))
      .pipe(gulp.dest("build/images"));
  });

  gulp.task("webp", function() {
    return gulp.src("build/images/**/*.{png,jpg,jpeg}")
      .pipe(webp({quality: 90}))
      .pipe(gulp.dest("build/images"));
    }
  );

  gulp.task("sprite", function () {
    return gulp.src("source/images/icon-*.svg")
      .pipe(svgstore({
        inlineSvg: true
      }))
      .pipe(rename("sprite.svg"))
      .pipe(gulp.dest("build/images"));
  });

  gulp.task("html", function() {
    return gulp.src("source/*.html")
      .pipe(posthtml([
        include()
      ]))
      .pipe(gulp.dest("build"));
    });

  gulp.task("server", function () {
    server.init({
      server: "build",
      notify: false,
      open: true,
      cors: true,
      ui: false
    });

    gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css"));
    gulp.watch("source/images/icon-*.svg", gulp.series("sprite", "html", "refresh"));
    gulp.watch("source/js/*.js", gulp.series("compress", "refresh"));
    gulp.watch("source/*.html").on("change", gulp.series("html", "refresh"));
  });

  gulp.task("refresh", function (done) {
    server.reload();
    done();
  });

  gulp.task("build", gulp.series("clean", "copy","css", "compress", "images", "webp",  "sprite", "html"));
  gulp.task("start", gulp.series("build", "server"));
