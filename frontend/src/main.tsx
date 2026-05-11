import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

// 1. Creiamo il client per le query (il motore delle chiamate API)
const queryClient = new QueryClient()

// 2. Creiamo il router passandogli il queryClient (come richiesto dal nuovo router.tsx)
const router = getRouter(queryClient)

// 3. Renderizziamo l'app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)