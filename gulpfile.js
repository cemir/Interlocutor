'use strict'

const path    = require('path')
const gulp    = require('gulp')
const gulpif  = require('gulp-if')
const crisper = require('gulp-crisper')
const babel   = require('gulp-babel')
const uglify  = require('gulp-uglify')
const htmlMinifier = require('gulp-html-minifier')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const gulpCssnano = require('gulp-cssnano')
const autoprefixer = require('autoprefixer')

require('es6-promise').polyfill()

// Got problems? Try logging 'em
const logging = require('plylog')
logging.setVerbose()
// Or
// const debug = require('gulp-debug');
// and add pipe step to debug e.g.
// .pipe(gulpif(/\.css$/, debug({ title: 'IN CSS PIPE' })))

// !!! IMPORTANT !!! //
// Keep the global.config above any of the gulp-tasks that depend on it
global.config = {
  polymerJsonPath: path.join(process.cwd(), 'polymer.json'),
  build: {
    rootDirectory: 'build',
    bundledDirectory: 'bundled',
    unbundledDirectory: 'unbundled',
    // Accepts either 'bundled', 'unbundled', or 'both'
    // A bundled version will be vulcanized and sharded. An unbundled version
    // will not have its files combined (this is for projects using HTTP/2
    // server push). Using the 'both' option will create two output projects,
    // one for bundled and one for unbundled
    bundleType: 'both'
  },
  // Path to your service worker, relative to the build root directory
  serviceWorkerPath: 'service-worker.js',
  // Service Worker precache options based on
  // https://github.com/GoogleChrome/sw-precache#options-parameter
  swPrecacheConfig: {
    navigateFallback: '/interlocutor-app.html'
  }
}

// Add your own custom gulp tasks to the gulp-tasks directory
// A few sample tasks are provided for you
// A task should return either a WriteableStream or a Promise
const clean = require('./gulp-tasks/clean.js')
// const images = require('./gulp-tasks/images.js')
const project = require('./gulp-tasks/project.js')

// The source task will split all of your source files into one
// big ReadableStream. Source files are those in src/** as well as anything
// added to the sourceGlobs property of polymer.json.
// Because most HTML Imports contain inline CSS and JS, those inline resources
// will be split out into temporary files. You can use gulpif to filter files
// out of the stream and run them through specific tasks. An example is provided
// which filters all images and runs them through imagemin

// .pipe(gulpif('**/*.{png,gif,jpg,svg}', images.minify()))
    // .pipe(gulpif(/\.html$/, crisper()))
function source() {
  return project.splitSource()
    // Add your own build tasks here!
    .pipe(gulpif(/\.js$/, babel({
        presets: ['es2015']
      })))
    .pipe(gulpif(/\.html$/, htmlMinifier({
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true
      })))
    .pipe(gulpif(/\.js$/, uglify()))
    .pipe(project.rejoin()) // Call rejoin when you're finished
}

// The dependencies task will split all of your bower_components files into one
// big ReadableStream
// You probably don't need to do anything to your dependencies but it's here in
// case you need it :)
function dependencies() {
  return project.splitDependencies()
    // PolymerBuild HtmlSplitter Does not split out css atm
    // https://github.com/Polymer/polymer-build/pull/40
    .pipe(gulpif(/\.html$/, htmlMinifier({
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true
      })))
    .pipe(gulpif(/\.js$/, uglify()))
    .pipe(project.rejoin())
}

// Clean the build directory, split all source and dependency files into streams
// and process them, and output bundled and unbundled versions of the project
// with their own service workers
gulp.task('default', gulp.series([
  clean.build,
  project.merge(source, dependencies),
  project.serviceWorker
]))

