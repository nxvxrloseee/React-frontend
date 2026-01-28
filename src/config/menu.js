import { ROLES } from '../constants/roles';

export const MENU_ITEMS = [
    {
        path: '/',
        label: 'Главная',
        icon: '🏠',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER],
    },
    {
        path: '/clients',
        label: 'Клиенты',
        icon: '👥',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
    },
    {
        path: '/schedule',
        label: 'Расписание',
        icon: '📅',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER],
    },
    {
        path: '/payments',
        label: 'Платежи',
        icon: '💰',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
    },
    {
        path: '/reports',
        label: 'Отчёты',
        icon: '📊',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
    },
];
