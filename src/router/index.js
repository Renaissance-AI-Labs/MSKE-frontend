import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import OrdersView from '../views/OrdersView.vue';
import TradeView from '../views/TradeView.vue';
import FriendsView from '../views/FriendsView.vue';
import InvestNBView from '../views/InvestNBView.vue';
import InvestLobsterView from '../views/InvestLobsterView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { walletState } from '../services/wallet';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/orders',
    name: 'Orders',
    component: OrdersView,
  },
  {
    path: '/trade',
    name: 'Trade',
    component: TradeView,
  },
  {
    path: '/friends',
    name: 'Friends',
    component: FriendsView,
  },
  {
    path: '/invest-nb',
    name: 'InvestNB',
    component: InvestNBView,
  },
  {
    path: '/invest-lobster',
    name: 'InvestLobster',
    component: InvestLobsterView,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  },
});

export default router;
