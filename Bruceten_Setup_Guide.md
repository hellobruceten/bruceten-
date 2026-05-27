# Bruceten Medical Rehabilitation
## GitHub Project Setup Guide

**Version 1.0** | Last Updated: May 2026

---

## 📋 Project Overview

**Bruceten** is an AI-powered medical rehabilitation platform built with modern web technologies. This project connects patients and healthcare providers through an intuitive interface backed by secure cloud infrastructure.

### Core Stack
- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Backend/Database**: Supabase (PostgreSQL)
- **Deployment**: GitHub Pages / Vercel Ready
- **Package Manager**: npm

### Key Features
- Responsive patient dashboard
- Healthcare provider management
- Product/service catalog with category organization
- Secure patient order system
- Real-time database synchronization
- HIPAA-ready architecture

---

## 📁 Project Structure

```
bruceten/                    ← Your GitHub repository root
├── package.json             ← Dependencies & build scripts
├── vite.config.js          ← Vite build configuration
├── index.html              ← HTML entry point
└── src/
    ├── main.jsx            ← React app initialization
    ├── App.jsx             ← Main application component
    └── lib/
        └── supabase.js     ← Supabase database client
```

### Folder Organization

| Location | Purpose | Color |
|----------|---------|-------|
| **root** | Project metadata & configuration | 🟠 Amber |
| **src/** | React components & application logic | 🔵 Cyan |
| **src/lib/** | External service integrations | 🟢 Green |

---

## 📦 6 Files to Create

### File 1: `package.json` (Root)
**Purpose**: Declares all npm dependencies and build scripts

**Location**: Root of repository
**Folder Color**: 🟠 Amber

```json
{
  "name": "bruceten",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

**What it does**:
- Defines project metadata (name, version)
- Lists all required libraries
- Provides npm commands (`npm run dev`, `npm run build`)
- Uses ES modules (`"type": "module"`)

---

### File 2: `vite.config.js` (Root)
**Purpose**: Configures the Vite build tool and development server

**Location**: Root of repository
**Folder Color**: 🟠 Amber

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**What it does**:
- Activates React JSX transformation
- Optimizes build output
- Enables hot module replacement (HMR) during development
- Handles CSS and asset bundling automatically

---

### File 3: `index.html` (Root)
**Purpose**: The main HTML page that loads your React application

**Location**: Root of repository
**Folder Color**: 🟠 Amber

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bruceten Medical Rehabilitation</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**What it does**:
- Sets character encoding to UTF-8
- Enables mobile responsive design
- Creates the `#root` container where React mounts
- Loads the JavaScript entry point (`main.jsx`)

---

### File 4: `src/main.jsx` (Inside src/)
**Purpose**: Initializes the React application and mounts it to the DOM

**Location**: Inside `src/` folder
**Folder Color**: 🔵 Cyan

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**What it does**:
- Imports React and ReactDOM
- Loads the main `App` component
- Finds the `#root` element in HTML
- Renders the app with React.StrictMode (catches common mistakes)

---

### File 5: `src/lib/supabase.js` (Inside src/lib/)
**Purpose**: Connects to Supabase PostgreSQL database and provides data functions

**Location**: Inside `src/lib/` folder
**Folder Color**: 🟢 Green

```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug, icon)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) { console.error(error); return [] }
  return data
}

export async function placeOrder(cart, formData) {
  const { data: customer } = await supabase
    .from('customers')
    .upsert({
      email: formData.email,
      full_name: formData.name,
      phone: formData.phone,
      address: formData.address,
    }, { onConflict: 'email' })
    .select().single()

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const { data: order } = await supabase
    .from('orders')
    .insert({
      customer_id: customer.id,
      total,
      payment_method: formData.payment,
      payment_status: 'unpaid',
      delivery_address: formData.address,
      status: 'pending',
    })
    .select().single()

  await supabase.from('order_items').insert(
    cart.map(i => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.qty,
      unit_price: i.price,
    }))
  )
  return { success: true, orderId: order.id }
}
```

**Database Functions**:
- `fetchProducts()` — Get active products with categories
- `fetchCategories()` — Get all service categories
- `placeOrder()` — Create customer order with line items

**Database Schema** (must exist in Supabase):
- `products` table
- `categories` table
- `customers` table
- `orders` table
- `order_items` table

---

### File 6: `src/App.jsx` (Inside src/)
**Purpose**: Main React component containing the full Bruceten application

**Location**: Inside `src/` folder
**Folder Color**: 🔵 Cyan

**⚠️ Special Instructions**:
1. Generate the full Bruceten component from the Claude artifact
2. Copy ALL code from the artifact
3. Paste it into `App.jsx`
4. Add this import at the very top:

```javascript
import { fetchProducts, fetchCategories, placeOrder as saveOrder } from './lib/supabase'
```

5. Replace the hardcoded `PRODUCTS` constant with dynamic state:

```javascript
const [products, setProducts] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchProducts().then(data => {
    setProducts(data)
    setLoading(false)
  })
}, [])
```

---

## 🚀 Step-by-Step: Adding Files to GitHub

### Prerequisites
1. Create a GitHub repository named `bruceten`
2. Initialize it with a README (optional)
3. Have Git set up on your local machine

### How to Add Files (Repeat for Each File)

#### Step 1: Go to Your Repository
- Visit `github.com/yourusername/bruceten`
- Click the green **"Code"** button
- Select **"Add file"** → **"Create new file"**

#### Step 2: Enter the Filename
- For root files: type the name directly (e.g., `package.json`)
- For nested files: type the path (e.g., `src/main.jsx`)
  - GitHub automatically creates folders as needed

| File | Path to Type |
|------|-----------|
| 1. package.json | `package.json` |
| 2. vite.config.js | `vite.config.js` |
| 3. index.html | `index.html` |
| 4. main.jsx | `src/main.jsx` |
| 5. supabase.js | `src/lib/supabase.js` |
| 6. App.jsx | `src/App.jsx` |

#### Step 3: Paste the Code
- Copy the code block from above
- Paste it into the large text editor
- Leave trailing newlines as they are

#### Step 4: Commit the File
- Scroll to the bottom
- Click **"Commit new file"**
- GitHub creates a commit automatically

### Recommended Creation Order
1. **package.json** — Dependencies first
2. **vite.config.js** — Build configuration
3. **index.html** — HTML entry point
4. **src/main.jsx** — React initialization
5. **src/lib/supabase.js** — Database client
6. **src/App.jsx** — Main application

---

## ⚙️ Configuration & Environment Setup

### Setting Up Supabase

After creating the files, you'll need to configure Supabase:

1. **Create a Supabase project** at supabase.com
2. **Get your credentials**:
   - Project URL
   - Anon Key (public)
3. **Create a `.env.local` file** in your repo root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

4. **Create database tables** in Supabase SQL Editor:

```sql
-- Products table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id BIGINT REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  icon TEXT
);

-- Customers table
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  total DECIMAL(10,2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  delivery_address TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Running Locally

After all files are committed:

```bash
# Clone your repository
git clone https://github.com/yourusername/bruceten.git
cd bruceten

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Development server runs at `http://localhost:5173`

---

## 🔐 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project endpoint | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public API key | `eyJhbGc...` |

⚠️ **Never commit credentials** — Use `.env.local` (add to `.gitignore`)

---

## 📚 Additional Resources

### React & Vite Documentation
- [React 18 Docs](https://react.dev)
- [Vite Getting Started](https://vitejs.dev/guide/)
- [Vite React Plugin](https://github.com/vitejs/vite-plugin-react)

### Supabase
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/latest)
- [Database Docs](https://supabase.com/docs/guides/database)
- [Authentication](https://supabase.com/docs/guides/auth)

### Deployment Options
- **Vercel** (Recommended for Vite + React)
- **Netlify**
- **GitHub Pages**
- **Railway**

---

## ✅ Troubleshooting

### "Module not found" errors
- Ensure file paths match exactly (case-sensitive on Linux/Mac)
- Verify folder structure: `src/lib/supabase.js` not `src/Lib/` or `src/lib/Supabase.js`

### Supabase connection fails
- Check `.env.local` exists and has correct credentials
- Verify Supabase project is active
- Confirm anon key is published (not a service role key)

### Build errors
- Run `npm install` to ensure dependencies are installed
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (requires 14+, 18+ recommended)

### Port 5173 already in use
- Change port: `npm run dev -- --port 3000`
- Or kill the process using that port

---

## 📝 Next Steps After Setup

1. ✅ Create all 6 files on GitHub
2. ✅ Clone repository locally
3. ✅ Run `npm install`
4. ✅ Set up Supabase account and `.env.local`
5. ✅ Create database tables (SQL provided above)
6. ✅ Run `npm run dev` to test
7. ✅ Deploy to Vercel or GitHub Pages

---

## 📞 Support

For issues with:
- **GitHub**: Visit github.com/help
- **React**: Check react.dev/learn
- **Vite**: See vitejs.dev/guide
- **Supabase**: Browse supabase.com/docs

---

**Last Updated**: May 2026  
**Status**: Ready for Production  
**License**: [Your License Here]
