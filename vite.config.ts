import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * 公開 URL（末尾スラッシュ付き）。例: https://shinpoyo.github.io/mashimashida/
 * OGP（SNS で共有したときのカード画像）は絶対 URL が必要なため、ビルド時に環境変数で渡す。
 * 未設定なら og:image / og:url を出力しない（ローカル開発・テスト版用）。
 */
function siteMeta(siteUrl: string | undefined): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      if (!siteUrl) return html.replace(/\s*<!-- site-meta:start -->[\s\S]*?<!-- site-meta:end -->/, '');
      const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
      return html.replaceAll('%SITE_URL%', base);
    },
  };
}

export default defineConfig(() => {
  return {
    // 相対パスで出力し、GitHub Pages のサブパスや他のホスティングでもそのまま動くようにする
    base: './',
    plugins: [react(), tailwindcss(), siteMeta(process.env.SITE_URL)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
