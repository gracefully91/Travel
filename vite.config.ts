import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {plannerApi} from './server/planner-api';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'');return {base:process.env.GITHUB_PAGES==='true'?'/Travel/':'/',plugins:[react(),plannerApi(env.DATA_GO_KR_KEY||'')],server:{host:'0.0.0.0',port:5173}}});
