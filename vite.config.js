import {defineConfig} from "vite"

export default defineConfig({
	plugins: [
		
	],
	server: {
		proxy: {
			'/api/huggingface': {
				target: 'https://router.huggingface.co',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/huggingface/, ''),
				headers: {
					'Origin': 'https://router.huggingface.co'
				}
			},
			'/api/groq': {
				target: 'https://api.groq.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/groq/, ''),
				headers: {
					'Origin': 'https://api.groq.com'
				}
			},
			'/api/tmdb': {
				target: 'https://api.themoviedb.org',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
				headers: {
					'Origin': 'https://api.themoviedb.org'
				}
			}
		}
	}
})