// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import env from 'vite-plugin-env-compatible';

const root = resolve(__dirname, 'src');
const base = './';
const outDir = resolve(__dirname, 'dist');

export default defineConfig({
  root,
  base,
  plugins: [
    env({prefix: 'VITE', mountedPath: 'process.env'})
  ],
  build: {
    outDir,
    rollupOptions: {
      input: {
        omap_bases: resolve(root, 'omap_bases.html'),
        omap_basic: resolve(root, 'omap_basic.html'),
        omap_geojson: resolve(root, 'omap_geojson.html'),
        omap_gpx: resolve(root, 'omap_gpx.html'),
        omap_gsibv: resolve(root, 'omap_gsibv.html'),
        omap_kml: resolve(root, 'omap_kml.html')
      }
    }
  }
});
// __END__
