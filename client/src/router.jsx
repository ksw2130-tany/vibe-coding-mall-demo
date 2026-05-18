import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminRoute from './components/AdminRoute.jsx'
import Admin from './pages/Admin.jsx'
import AdminOrders from './pages/AdminOrders.jsx'
import AdminReviews from './pages/AdminReviews.jsx'
import AdminProductNew from './pages/AdminProductNew.jsx'
import AdminProducts from './pages/AdminProducts.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import OrderFailure from './pages/OrderFailure.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import Orders from './pages/Orders.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Signup from './pages/Signup.jsx'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/products/:id', element: <ProductDetail /> },
  { path: '/cart', element: <Cart /> },
  { path: '/checkout', element: <Checkout /> },
  { path: '/order/success', element: <OrderSuccess /> },
  { path: '/order/failure', element: <OrderFailure /> },
  { path: '/orders', element: <Orders /> },
  { path: '/orders/:id', element: <OrderDetail /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  {
    path: '/admin',
    element: (
      <AdminRoute from="/admin" dashboardLink={false}>
        <Admin />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <AdminRoute from="/admin/orders">
        <AdminOrders />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/reviews',
    element: (
      <AdminRoute from="/admin/reviews">
        <AdminReviews />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/products',
    element: (
      <AdminRoute from="/admin/products">
        <AdminProducts />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/products/new',
    element: (
      <AdminRoute from="/admin/products/new">
        <AdminProductNew />
      </AdminRoute>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
