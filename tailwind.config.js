/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```
4. Нажми **Commit changes...**.

### 🔍 Важная проверка (на всякий случай):
Убедись, что те самые строчки `@tailwind...` находятся в файле **`src/index.css`**, а не в конфигах. 
Содержимое **`src/index.css`** должно быть таким:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
