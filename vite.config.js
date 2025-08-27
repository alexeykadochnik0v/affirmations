import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // If building on GitHub Actions for project pages, set base to '/repo-name/'
  const repo = process.env.GITHUB_REPOSITORY
  const base = repo ? `/${repo.split('/')[1]}/` : '/'
  return {
    plugins: [react()],
    base,
  }
})
