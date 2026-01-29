/**
 * Система разграничения прав доступа
 * Основана на таблице прецедентов из ТЗ
 */

export const ROLES = {
    ADMIN: 'admin',
    TRAINER: 'trainer', 
    MANAGER: 'manager',
};

// Детальная матрица прав доступа
export const PERMISSIONS = {
    // Клиенты
    clients: {
        view: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MANAGER],
        create: [ROLES.ADMIN],
        edit: [ROLES.ADMIN], // Тренер может редактировать только своих клиентов (обрабатывается отдельно)
        delete: [ROLES.ADMIN],
        editOwn: [ROLES.TRAINER], // Тренер может редактировать только своих клиентов
    },

    // Тренеры
    trainers: {
        view: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MANAGER],
        viewLimited: [ROLES.TRAINER], // Ограниченный просмотр
        create: [ROLES.ADMIN],
        edit: [ROLES.ADMIN],
        editOwn: [ROLES.TRAINER], // Только свои данные
        delete: [ROLES.ADMIN],
    },

    // Абонементы и типы абонементов
    memberships: {
        viewTypes: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MANAGER],
        editTypes: [ROLES.ADMIN, ROLES.MANAGER],
        create: [ROLES.ADMIN],
        extend: [ROLES.ADMIN],
    },

    // Платежи
    payments: {
        view: [ROLES.ADMIN, ROLES.MANAGER],
        viewHistory: [ROLES.ADMIN, ROLES.MANAGER],
        create: [ROLES.ADMIN],
    },

    // Расписание
    schedule: {
        view: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MANAGER],
        create: [ROLES.ADMIN],
        createOwn: [ROLES.TRAINER], // Только свои занятия
        edit: [ROLES.ADMIN],
        editOwn: [ROLES.TRAINER], // Только свои занятия
        registerClient: [ROLES.ADMIN],
        registerClientOwn: [ROLES.TRAINER], // Только на свои занятия
    },

    // Посещаемость
    attendance: {
        mark: [ROLES.ADMIN],
        markOwn: [ROLES.TRAINER], // Только свои занятия
        viewHistory: [ROLES.ADMIN, ROLES.MANAGER],
        viewOwnHistory: [ROLES.TRAINER], // Только свои клиенты
    },

    // Dashboard
    dashboard: {
        viewFull: [ROLES.ADMIN, ROLES.MANAGER],
        viewLimited: [ROLES.TRAINER],
        viewAlerts: [ROLES.ADMIN, ROLES.MANAGER],
        viewOwnAlerts: [ROLES.TRAINER],
    },

    // Отчёты
    reports: {
        financial: [ROLES.ADMIN, ROLES.MANAGER],
        attendance: [ROLES.ADMIN, ROLES.MANAGER],
        attendanceOwn: [ROLES.TRAINER], // Только свои занятия
        exportPdf: [ROLES.ADMIN, ROLES.MANAGER],
        exportExcel: [ROLES.ADMIN, ROLES.MANAGER],
        exportExcelOwn: [ROLES.TRAINER], // Только свои данные
    },

    // Справочники и настройки
    settings: {
        halls: [ROLES.ADMIN],
        trainingTypes: [ROLES.ADMIN],
        system: [ROLES.ADMIN],
    },

    // Управление пользователями
    users: {
        manage: [ROLES.ADMIN],
    },
};

/**
 * Проверка права доступа
 * @param {string} userRole - Роль пользователя
 * @param {string} module - Модуль (например: 'clients', 'payments')
 * @param {string} action - Действие (например: 'view', 'create', 'edit')
 * @returns {boolean}
 */
export const hasPermission = (userRole, module, action) => {
    if (!userRole || !module || !action) return false;
    
    const modulePerms = PERMISSIONS[module];
    if (!modulePerms) return false;
    
    const actionPerms = modulePerms[action];
    if (!actionPerms) return false;
    
    return actionPerms.includes(userRole.toLowerCase());
};

/**
 * Проверка, является ли пользователь владельцем ресурса
 * @param {object} user - Объект пользователя
 * @param {object} resource - Ресурс (тренировка, клиент и т.д.)
 * @param {string} ownerField - Поле, содержащее ID владельца
 * @returns {boolean}
 */
export const isOwner = (user, resource, ownerField = 'trainer') => {
    if (!user || !resource) return false;
    return user.trainer === resource[ownerField];
};

/**
 * Комплексная проверка прав с учётом владения
 * @param {object} user - Объект пользователя
 * @param {string} module - Модуль
 * @param {string} action - Действие
 * @param {object} resource - Ресурс (опционально)
 * @param {string} ownerField - Поле владельца (опционально)
 * @returns {boolean}
 */
export const canPerformAction = (user, module, action, resource = null, ownerField = 'trainer') => {
    if (!user) return false;
    
    const role = user.role?.toLowerCase();
    
    // Проверяем обычное право
    if (hasPermission(role, module, action)) {
        return true;
    }
    
    // Проверяем "own" право (например: editOwn, createOwn)
    const ownAction = `${action}Own`;
    if (hasPermission(role, module, ownAction)) {
        // Если есть ресурс - проверяем владение
        if (resource) {
            return isOwner(user, resource, ownerField);
        }
        // Если ресурса нет (создание своего) - разрешаем
        return true;
    }
    
    return false;
};

/**
 * Получить список разрешённых действий для модуля
 * @param {string} userRole - Роль пользователя
 * @param {string} module - Модуль
 * @returns {string[]}
 */
export const getAllowedActions = (userRole, module) => {
    if (!userRole || !module) return [];
    
    const modulePerms = PERMISSIONS[module];
    if (!modulePerms) return [];
    
    const role = userRole.toLowerCase();
    
    return Object.keys(modulePerms).filter(action => 
        modulePerms[action].includes(role)
    );
};

export default {
    ROLES,
    PERMISSIONS,
    hasPermission,
    isOwner,
    canPerformAction,
    getAllowedActions,
};1