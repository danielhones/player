module.exports = function(grunt) {
    grunt.initConfig({
	inline: {
	    options: {
		cssmin: true,
		tag: '',
		inlineTagAttributes: {
                    js: 'data-inlined="true"',
                    css: 'data-inlined="true"'
		},
	    },
	    dist: {
		src: "src/index.html",
		dest: "build/index.html",
	    },
	},
	watch: {
	    js: {
		files: ['src/*.js'],
		tasks: ['inline'],
	    },
	    css: {
		files: ['src/*.scss', 'src/*.css'],
		tasks: ['inline'],
	    },
	    html: {
		files: ['src/*.html'],
		tasks: ['inline']
	    },
	},
    });

    grunt.registerTask('build', ['inline']);
    grunt.registerTask('default', ['build', 'watch']);

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-inline');
};
