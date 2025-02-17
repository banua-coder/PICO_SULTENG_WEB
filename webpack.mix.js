const mix = require("laravel-mix");
const tailwindcss = require("tailwindcss");

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js("resources/js/app.js", "public/js")
    .vue({
        extractStyles: true,
        globalStyles: false
    })
    .sass("resources/sass/app.scss", "public/css")
    .options({
        processCssUrls: false,
        postCss: [
            tailwindcss("./tailwind.config.js")
        ]
    })
    .webpackConfig(require("./webpack.config"))
    .sourceMaps();

mix.disableNotifications();

mix.browserSync("127.0.0.1:8000");

if (mix.inProduction()) {
    mix.version();
}
