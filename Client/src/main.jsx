import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import routes from './app/routes.jsx'
import Providers from './app/providers.jsx'

createRoot(document.getElementById('root')).render(
  <Providers>
    <RouterProvider router={routes} />
  </Providers>,
)
