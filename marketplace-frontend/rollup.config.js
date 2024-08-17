import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser'; // Use default import for @rollup/plugin-terser
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/main.js',
	output: {
	  sourcemap: true,
	  format: 'iife',
	  name: 'app',
	  file: 'public/build/bundle.js',
	  globals: {
		'socket.io-client': 'io'
	  }
	},
	plugins: [
	  svelte({
		compilerOptions: {
		  dev: !production
		}
	  }),
	  css({ output: 'bundle.css' }),
	  resolve({
		browser: true,
		dedupe: ['svelte']
	  }),
	  commonjs(),
	  !production && serve({
		contentBase: ['public'],
		historyApiFallback: true,
		host: 'localhost',
		port: 5000
	  }),
	  !production && livereload('public'),
	  production && terser()
	],
	watch: {
	  clearScreen: false
	}
  };

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    name: 'serve',
    writeBundle() {
      if (server) return;
      import('child_process').then(({ spawn }) => {
        server = spawn('npm', ['run', 'start', '--', '--dev'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true
        });

        process.on('SIGTERM', toExit);
        process.on('exit', toExit);
      });
    }
  };
}
