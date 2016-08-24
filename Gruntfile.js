module.exports = function(grunt) {
    grunt.initConfig({
	cssUrlEmbed: {
	    encodeDirectly: {
		files: {
		    'extsrc/font-awesome.embedded.css': ['extsrc/font-awesome-4.6.3/css/font-awesome.css']
		}
	    }
	},
	inline: {
	    options: {
		exts: ['woff', 'eot'],
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

    grunt.registerTask('build', ['cssUrlEmbed', 'inline']);
    grunt.registerTask('default', ['build', 'watch']);

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-inline');
    grunt.loadNpmTasks('grunt-css-url-embed');
};
